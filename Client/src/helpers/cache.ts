import { FeedItem } from "@/app/(app)/(feed)/useFeed";
import { IUser } from "@/types";
import { get, set } from "idb-keyval";

// CACHING FEED POSTS
export interface CacheFeed {
  post: FeedItem;
  lastViewed: Date;
}
export const cacheFeed = async (newFeed: FeedItem[]) => {
  const now = new Date();
  const DAY_IN_MS = 1000 * 60 * 60 * 24;

  // 1. Retrieve current cache
  const savedFeed = ((await get("feed")) as CacheFeed[]) || [];
  const authorDictionary = (await get("cached-authors")) || {};

  // 2. Filter existing posts (7-day rule)
  const filteredSavedFeed = savedFeed.filter((item) => {
    const lastViewed = new Date(item.lastViewed);
    const diffInDays = Math.floor(
      (now.getTime() - lastViewed.getTime()) / DAY_IN_MS,
    );
    return diffInDays <= 7;
  });

  // 3. Merge old fresh posts with new fetch
  const feedMap = new Map<string, CacheFeed>();
  filteredSavedFeed.forEach((item) => feedMap.set(item.post._id, item));

  newFeed.forEach((item) => {
    feedMap.set(item._id, { post: item, lastViewed: new Date() });
  });

  const finalFeed = Array.from(feedMap.values());

  // 4. AUTHOR CLEANUP (The "Sweep" Logic)
  // Create a Set of all author IDs that have at least one post in the final list
  const activeAuthorIds = new Set(finalFeed.map((item) => item.post.authorId));

  // Get all IDs currently in the author cache
  const cachedAuthorIds = Object.keys(authorDictionary);

  cachedAuthorIds.forEach((id) => {
    // If an author in the cache is NOT linked to any current post, delete them
    if (!activeAuthorIds.has(id)) {
      delete authorDictionary[id];
    }
  });

  // 5. Save back to IndexedDB
  await Promise.all([
    set("feed", finalFeed),
    set("cached-authors", authorDictionary),
  ]);
};

export const getCachedFeed = async (): Promise<FeedItem[]> => {
  try {
    const cachedPost = (await get("feed")) as CacheFeed[] | undefined;

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

export const cacheAuthor = async (author: IUser) => {
  if (!author || !author._id) return;

  try {
    // 1. Get the existing dictionary or initialize an empty object
    const cachedAuthors = (await get("cached-authors")) || {};

    // 2. Add/Update the author using their ID as the key
    cachedAuthors[author._id] = author;

    // 3. Save back to IndexedDB
    await set("cached-authors", cachedAuthors);
  } catch (error) {
    console.error("Failed to cache author:", error);
  }
};

export const getCachedAuthor = async (
  authorId: string,
): Promise<IUser | null> => {
  if (!authorId) return null;

  try {
    // 1. Fetch the entire dictionary from IndexedDB
    const cachedAuthors = await get<Record<string, IUser>>("cached-authors");
    // 2. Return the specific author or null if they don't exist
    return (cachedAuthors && cachedAuthors[authorId]) || null;
  } catch (error) {
    console.error(`Error fetching author ${authorId} from cache:`, error);
    return null;
  }
};
