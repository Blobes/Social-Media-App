"use client";

import { IPostAuthor, IPost, QUERY_KEYS } from "@repo/core";
import { get, set, del } from "idb-keyval";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Creating the query client instance.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      staleTime: 1000 * 60 * 5,
    },
  },
});

/**
 * Safe wrapper for indexedDB operations to prevent SSR crashes.
 */
const idbStorage = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") return null;
    return await get(key);
  },
  setItem: async (key: string, value: any) => {
    if (typeof window === "undefined") return;
    await set(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === "undefined") return;
    await del(key);
  },
};

/**
 * Initialize persister only on the client side.
 */
const persister =
  typeof window !== "undefined"
    ? createAsyncStoragePersister({
        storage: idbStorage,
        throttleTime: 1000,
        key: QUERY_KEYS.OFFLINE_CACHE,
      })
    : null;

// Applying persistence to the client.
if (persister) {
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    buster: "v1-granular-keys",
    // Dehydrate options ensure we only save successful queries.
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const isSuccess = query.state.status === "success";
        // console.log(`Checking Query ${query.queryKey}: ${isSuccess}`);
        // We only want to persist 'leaf' nodes (specific items).
        // Broad collection keys (e.g., ['gists']) usually have a length of 1.
        const isGranular = query.queryKey.length > 1;

        // Explicitly allow specific broad keys if needed
        // const isWhiteListed = query.queryKey.includes(QUERY_KEYS.SETTINGS);

        return isSuccess && isGranular;
      },
    },
  });
}

/**
 * Updates a specific item within the TanStack Query cache.
 * Handles both Infinite Queries (paginated) and standard Array queries.
 */
export const updateCacheItem = <T extends { _id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  targetId: string,
  updateFn: (oldItem: T) => T,
) => {
  // 1. Update the broad query (the list/feed)
  queryClient.setQueriesData({ queryKey }, (oldData: any) => {
    if (!oldData) return oldData;

    // Handle Infinite Query structure (pages)
    if (oldData.pages) {
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          data: page.data?.map((item: T) =>
            item._id === targetId ? updateFn(item) : item,
          ),
        })),
      };
    }

    // Handle Standard Array structure
    if (Array.isArray(oldData)) {
      return oldData.map((item: T) =>
        item._id === targetId ? updateFn(item) : item,
      );
    }

    return oldData;
  });

  // 2. Update the granular granular item key if it exists
  // This ensures specific post views are also in sync
  queryClient.setQueryData(
    [...queryKey, targetId],
    (oldData: T | undefined) => {
      if (!oldData) return oldData;
      return updateFn(oldData);
    },
  );
};

/**
 * Purges the top-level list keys for a set of domains.
 */
export const purgeBroadKeys = (queryClient: any, domains: string[][]) => {
  setTimeout(() => {
    domains.forEach((key) => {
      queryClient.removeQueries({ queryKey: key, exact: true });
    });
  }, 0);
};

export interface Cached {
  post: IPost;
  lastViewed: Date;
}
export const cachePost = async (post: IPost) => {
  const now = new Date();

  // Parallel fetch for speed
  const [savedPost, authorDict] = await Promise.all([
    get("cached-posts") as Promise<Cached[] | undefined>,
    get("cached-authors") as Promise<Record<string, IPostAuthor>>,
  ]);

  const postList = savedPost || [];
  const authors = authorDict || {};

  // PERFORMANCE CHECK: Does this post and its author already exist?
  const alreadyCached = postList.find((item) => item.post._id === post._id);
  const authorExists = authors[post.authorId];

  if (alreadyCached && authorExists) return;

  // Update Feed Map (Upsert logic)
  const postMap = new Map<string, Cached>();
  postList.forEach((item) => postMap.set(item.post._id, item));
  postMap.set(post._id, { post, lastViewed: now });

  // Cache Author
  authors[post.authorId] = post.author;

  // Save immediate changes
  await Promise.all([
    set("cached-posts", Array.from(postMap.values())),
    set("cached-authors", authors),
  ]);
};

export const getCachedPosts = async (): Promise<IPost[]> => {
  try {
    const cachedPost = (await get("cached-posts")) as Cached[] | undefined;

    if (!cachedPost || !Array.isArray(cachedPost)) {
      return [];
    }
    // Sort and map to return just the Post objects
    return cachedPost
      .sort((a, b) => {
        // Ensure we compare timestamps correctly
        const timeA = new Date(a.lastViewed).getTime();
        const timeB = new Date(b.lastViewed).getTime();
        return timeB - timeA; // Descending order (newest first)
      })
      .map((item) => item.post);
  } catch (error) {
    console.error("Error retrieving offline posts:", error);
    return [];
  }
};

export const cleanupCache = async () => {
  const now = new Date();
  const DAY_IN_MS = 1000 * 60 * 60 * 24;
  const EXPIRY_DAYS = 7;

  // 1. Retrieve current data
  const savedPosts = ((await get("cached-posts")) as Cached[]) || [];
  const authorDictionary = (await get("cached-authors")) || {};

  // 2. Filter posts older than 7 days
  const activePosts = savedPosts.filter((item) => {
    const lastViewed = new Date(item.lastViewed);
    const diffInDays = (now.getTime() - lastViewed.getTime()) / DAY_IN_MS;
    return diffInDays <= EXPIRY_DAYS;
  });

  // 3. Author Cleanup: Only keep authors who have at least one post remaining
  const activeAuthorIds = new Set(
    activePosts.map((item) => item.post.authorId),
  );

  const updatedAuthors: Record<string, IPostAuthor> = {};
  Object.keys(authorDictionary).forEach((id) => {
    if (activeAuthorIds.has(id)) {
      updatedAuthors[id] = authorDictionary[id];
    }
  });

  // 4. Atomic update
  await Promise.all([
    set("cached-posts", activePosts),
    set("cached-authors", updatedAuthors),
  ]);
  console.log(`Cache Cleanup Sync: Kept ${activePosts.length} posts.`);
};

export const getCachedAuthor = async (
  authorId: string,
): Promise<IPostAuthor | undefined> => {
  try {
    // 1. Fetch the entire dictionary from IndexedDB
    const cachedAuthors =
      await get<Record<string, IPostAuthor>>("cached-authors");
    // 2. Return the specific author or null if they don't exist
    return cachedAuthors && cachedAuthors[authorId];
  } catch (error) {
    console.error(`Error fetching author ${authorId} from cache:`, error);
    return;
  }
};
