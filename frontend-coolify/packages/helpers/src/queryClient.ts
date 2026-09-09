"use client";

import { TEMP_STORAGE_KEYS, CACHE_KEYS, STORAGE_KEYS } from "@repo/core";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, QueryKey } from "@tanstack/react-query";
import { idbStorage } from "./storage";

interface PurgeOptions {
  queryClient: QueryClient;
  queryKeys: QueryKey | QueryKey[] | QueryKey[][];
  purgeInMins?: number;
}

// const NON_PERSISTENT_KEYS: readonly (readonly string[])[] = [
//   STORAGE_KEYS.AUTH_TRANSIT,
//   STORAGE_KEYS.ACCOUNT_UPDATE_TRANSIT,
//   STORAGE_KEYS.MFA_UPDATE_TRANSIT,
//   STORAGE_KEYS.PASS_RESET_INIT_TRANSIT,
//   STORAGE_KEYS.PASS_RESET_FINALIZED_TRANSIT,
//   STORAGE_KEYS.ONBOARDING_TRANSIT,
// ];

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
 * Initialize persister only on the client side.
 */
const persister =
  typeof window !== "undefined"
    ? createAsyncStoragePersister({
        storage: idbStorage,
        throttleTime: 1000,
        key: CACHE_KEYS.OFFLINE_CACHE,
      })
    : null;

// Applying persistence to the client.
if (persister) {
  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    buster: "v1-granular-keys",
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const isSuccess = query.state.status === "success";
        const isCachePage = query.queryKey[0] === CACHE_KEYS.CACHE_PAGE;
        const isGranular = query.queryKey.length > 1;

        // // Checking if the query key matches any non-persistent transit key.
        // const isNonPersistent = NON_PERSISTENT_KEYS.some((nonPersistentKey) =>
        //   nonPersistentKey.every(
        //     (part, index) => query.queryKey[index] === part,
        //   ),
        // );

        // if (isNonPersistent) {
        //   return false;
        // }

        return isSuccess && (isCachePage || isGranular);
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
  /**
   * Update the broad query (the live list or infinite feed in memory).
   */
  queryClient.setQueriesData({ queryKey }, (oldData: any) => {
    if (!oldData) return oldData;

    // Handle Infinite Query structure (pages). Backend uses 'payload' for the array of items.
    if (oldData.pages) {
      return {
        ...oldData,
        pages: oldData.pages.map((page: any) => ({
          ...page,
          payload: page.payload?.map((item: T) =>
            item._id === targetId ? updateFn(item) : item,
          ),
        })),
      };
    }
    // Handle Standard Array structure.
    if (Array.isArray(oldData)) {
      return oldData.map((item: T) =>
        item._id === targetId ? updateFn(item) : item,
      );
    }
    return oldData;
  });

  // Update Progressive Cache Pages. This ensures the IndexedDB backup stays in sync with live changes.
  queryClient.setQueriesData(
    { queryKey: [CACHE_KEYS.CACHE_PAGE] },
    (oldPage: any) => {
      if (!oldPage || !oldPage.payload) return oldPage;

      return {
        ...oldPage,
        payload: oldPage.payload.map((item: T) =>
          item._id === targetId ? updateFn(item) : item,
        ),
      };
    },
  );

  // Update the granular item key if it exists. Used by useCachedData or specific post view hooks.
  queryClient.setQueryData(
    [...queryKey, targetId],
    (oldData: T | undefined) => {
      if (!oldData) return oldData;
      return updateFn(oldData);
    },
  );
};

/**
 * Normalizes input domain keys into a unified array of QueryKeys.
 */
const normalizeDomainKeys = (
  domains: QueryKey | QueryKey[] | QueryKey[][],
): QueryKey[] => {
  if (!Array.isArray(domains)) {
    return [domains];
  }
  if (domains.length === 0) {
    return [];
  }
  // Checking if dealing with a single QueryKey array like ["transit_data", "auth"]
  const isSingleQueryKey =
    domains.every(
      (item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "object",
    ) && !Array.isArray(domains[0]);

  if (isSingleQueryKey) {
    return [domains as QueryKey];
  }
  return domains as QueryKey[];
};

/**
 * Purges the top-level list keys for a set of domains.
 */
export const purgeCacheKeys = (options: PurgeOptions) => {
  const { queryClient, queryKeys, purgeInMins } = options;
  const normalizedKeys = normalizeDomainKeys(queryKeys);

  const purge = () => {
    normalizedKeys.forEach((key) => {
      queryClient.removeQueries({ queryKey: key, exact: true });
    });
  };
  if (purgeInMins && purgeInMins > 0) {
    setTimeout(purge, purgeInMins * 60 * 1000);
  } else {
    purge();
  }
};

/**
 * Checks whether a given QueryKey matches any key in the auto purge keys list.
 */
export const isAutoPurgeKey = (queryKey: QueryKey): boolean => {
  return TEMP_STORAGE_KEYS.some((key) =>
    key.every((part, index) => queryKey[index] === part),
  );
};
