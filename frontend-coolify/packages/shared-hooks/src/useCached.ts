"use client";

import { CACHE_KEYS } from "@repo/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  useMemo,
  useSyncExternalStore,
  useCallback,
  useRef,
  useEffect,
} from "react";

type EntityOrTransit =
  | { transitId: string; lastViewed?: Date | string }
  | { _id: string; lastViewed?: Date | string };

interface InfiniteCachePage<T> {
  data?: T[] | unknown;
  payload?: T[];
}

interface InfiniteCacheData<T> {
  pages?: InfiniteCachePage<T>[];
}

/**
 * Extracts key for deduplication based on item contract (_id or transitId).
 */
const getItemKey = <T extends EntityOrTransit>(item: T): string | null => {
  if ("transitId" in item && item.transitId) return item.transitId;
  if ("_id" in item && item._id) return item._id;
  return null;
};

/**
 * Retrieves cached data from granular TanStack Query buckets.
 * Supports both transit containers (via transitId) and standard entity payloads (via _id).
 */
export const useCachedData = <T extends EntityOrTransit>(
  queryKeyOrKeys: readonly string[] | readonly (readonly string[])[],
): T[] => {
  const queryClient = useQueryClient();

  const snapshotRef = useRef<T[]>([]);
  const snapshotKeyRef = useRef<string>("");

  const normalizedKeys = useMemo<readonly (readonly string[])[]>(() => {
    if (queryKeyOrKeys.length === 0) return [];
    return typeof queryKeyOrKeys[0] === "string"
      ? [queryKeyOrKeys as readonly string[]]
      : (queryKeyOrKeys as readonly (readonly string[])[]);
  }, [queryKeyOrKeys]);

  /**
   * Extracts and deduplicates cached entities/containers using their appropriate identifier.
   */
  const getSnapshot = useCallback((): T[] => {
    const allData: T[] = [];

    normalizedKeys.forEach((key) => {
      const cachedEntries = queryClient.getQueriesData<
        InfiniteCacheData<T> | T[] | T
      >({ queryKey: key });

      cachedEntries.forEach(([_, data]) => {
        if (!data) return;

        if (
          typeof data === "object" &&
          "pages" in data &&
          Array.isArray(data.pages)
        ) {
          data.pages.forEach((page) => {
            if (Array.isArray(page.data)) {
              allData.push(...(page.data as T[]));
            } else if (Array.isArray(page.payload)) {
              allData.push(...page.payload);
            }
          });
        } else if (Array.isArray(data)) {
          allData.push(...data);
        } else if (typeof data === "object" && getItemKey(data as T) !== null) {
          allData.push(data as T);
        }
      });
    });

    const uniqueMap = new Map<string, T>();
    allData.forEach((item) => {
      const itemKey = getItemKey(item);
      if (itemKey) {
        uniqueMap.set(itemKey, item);
      }
    });

    const sortedResult = Array.from(uniqueMap.values()).sort((a, b) => {
      const timeA = a.lastViewed ? new Date(a.lastViewed).getTime() : 0;
      const timeB = b.lastViewed ? new Date(b.lastViewed).getTime() : 0;
      return timeB - timeA;
    });

    const snapshotKey = sortedResult.map((item) => getItemKey(item)).join(",");

    if (snapshotKey !== snapshotKeyRef.current) {
      snapshotRef.current = sortedResult;
      snapshotKeyRef.current = snapshotKey;
    }

    return snapshotRef.current;
  }, [queryClient, normalizedKeys]);

  return useSyncExternalStore(
    useCallback(
      (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
      [queryClient],
    ),
    getSnapshot,
  );
};

/**
 * Type contract for infinite query page payload entries.
 */
interface PaginatedCacheResponse<P = Record<string, unknown>> {
  pages?: Array<{
    payload?: P[] | null;
  }>;
}

/**
 * Progressively persists newly fetched pages into the Cache Page layer.
 * Operates on flat data to avoid type infection.
 */
export const usePageCache = <P>(
  data: PaginatedCacheResponse<P> | undefined,
  baseKey: string,
): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!data?.pages) return;

    // Identify the most recently fetched page.
    const pageIndex = data.pages.length - 1;
    const latestPage = data.pages[pageIndex];

    if (latestPage && latestPage.payload) {
      // Store the raw payload array for this page index. The persister dehydrate filter catches "CACHE_PAGE".
      queryClient.setQueryData([CACHE_KEYS.CACHE_PAGE, baseKey, pageIndex], {
        payload: latestPage.payload,
        cachedAt: new Date(),
      });
    }
  }, [data?.pages, baseKey, queryClient]);
};
