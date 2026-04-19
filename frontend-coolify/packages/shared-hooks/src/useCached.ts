"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useSyncExternalStore, useCallback, useRef } from "react";

/**
 * Retrieves cached data from granular TanStack Query buckets.
 * Uses a version-tracking ref to ensure getSnapshot returns a stable reference.
 */
export const useCachedData = <
  T extends { _id: string; lastViewed?: Date | string },
>(
  queryKeyOrKeys: string[] | string[][],
): T[] => {
  const queryClient = useQueryClient();

  // Track the last processed data and cache version to avoid infinite loops
  const lastSnapshot = useRef<T[]>([]);
  const lastVersion = useRef<number>(-1);

  const normalizedKeys = useMemo(() => {
    if (queryKeyOrKeys.length === 0) return [];
    return typeof queryKeyOrKeys[0] === "string"
      ? [queryKeyOrKeys as string[]]
      : (queryKeyOrKeys as string[][]);
  }, [queryKeyOrKeys]);

  /**
   * getSnapshot implementation with manual memoization.
   */
  const getSnapshot = useCallback(() => {
    // Get the current hash/version of the cache
    const currentVersion = queryClient.getQueryCache().getAll().length;

    // Only re-calculate if the number of queries changed or if this
    // is the first run. For deeper change detection, you could use
    // a timestamp from the cache.
    if (
      currentVersion === lastVersion.current &&
      lastSnapshot.current.length > 0
    ) {
      return lastSnapshot.current;
    }

    const allData: any[] = [];

    normalizedKeys.forEach((key) => {
      const cachedEntries = queryClient.getQueriesData<any>({ queryKey: key });

      cachedEntries.forEach(([_, data]) => {
        if (!data) return;

        if (data.pages) {
          data.pages.forEach((page: any) => {
            const pageData = Array.isArray(page.data) ? page.data : page;
            if (Array.isArray(pageData)) allData.push(...pageData);
          });
        } else if (Array.isArray(data)) {
          allData.push(...data);
        } else if (typeof data === "object" && data._id) {
          allData.push(data);
        }
      });
    });

    const uniqueMap = new Map<string, T>();
    allData.forEach((item) => {
      if (item?._id) {
        uniqueMap.set(item._id, item);
      }
    });

    const sortedResult = Array.from(uniqueMap.values()).sort((a, b) => {
      const timeA = a.lastViewed ? new Date(a.lastViewed).getTime() : 0;
      const timeB = b.lastViewed ? new Date(b.lastViewed).getTime() : 0;
      return timeB - timeA;
    });

    // Update refs and return the new reference
    lastSnapshot.current = sortedResult;
    lastVersion.current = currentVersion;

    return sortedResult;
  }, [queryClient, normalizedKeys]);

  return useSyncExternalStore(
    useCallback(
      (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
      [queryClient],
    ),
    getSnapshot,
  );
};
