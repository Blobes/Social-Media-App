"use client";

import { QUERY_KEYS, CachedItem } from "@repo/core";
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
        const isGranular = query.queryKey.length > 1;
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
  updateFn: (oldItem: CachedItem<T>) => CachedItem<T>,
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
          data: page.data?.map((item: CachedItem<T>) =>
            // Access _id from the internal data property
            item.data._id === targetId ? updateFn(item) : item,
          ),
        })),
      };
    }
    // Handle Standard Array structure
    if (Array.isArray(oldData)) {
      return oldData.map((item: CachedItem<T>) =>
        item.data._id === targetId ? updateFn(item) : item,
      );
    }
    return oldData;
  });

  // 2. Update the granular item key if it exists
  queryClient.setQueryData(
    [...queryKey, targetId],
    (oldData: CachedItem<T> | undefined) => {
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
