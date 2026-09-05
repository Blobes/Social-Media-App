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

/**
 * Retrieves cached data from granular TanStack Query buckets.
 * Memoizes the result array to prevent infinite re-renders.
 */
export const useCachedData = <
  T extends { _id: string; lastViewed?: Date | string },
>(
  queryKeyOrKeys: readonly string[] | readonly string[][],
): T[] => {
  const queryClient = useQueryClient();

  // Stable reference storage — only update when data truly changes
  const snapshotRef = useRef<T[]>([]);
  const snapshotKeyRef = useRef<string>("");

  const normalizedKeys = useMemo(() => {
    if (queryKeyOrKeys.length === 0) return [];
    return typeof queryKeyOrKeys[0] === "string"
      ? [queryKeyOrKeys as string[]]
      : (queryKeyOrKeys as string[][]);
  }, [queryKeyOrKeys]);

  /**
   * getSnapshot — returns a stable reference by comparing a
   * deterministic key derived from the cached data.
   */
  const getSnapshot = useCallback(() => {
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

    // Create a deterministic key from the sorted IDs
    // This avoids comparing array references or doing deep equality
    const snapshotKey = sortedResult.map((item) => item._id).join(",");

    // Only return a new reference if the key changed
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
 * Progressively persists newly fetched pages into the Cache Page layer.
 * Operates on flat data to avoid type infection.
 */
export const usePageCache = (data: any, baseKey: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!data?.pages) return;

    /**
     * Identify the most recently fetched page.
     */
    const pageIndex = data.pages.length - 1;
    const latestPage = data.pages[pageIndex];

    if (latestPage && latestPage.payload) {
      /**
       * Store the raw payload array for this page index.
       * The persister dehydrate filter will catch this "CACHE_PAGE" key.
       */
      queryClient.setQueryData([CACHE_KEYS.CACHE_PAGE, baseKey, pageIndex], {
        payload: latestPage.payload,
        cachedAt: new Date(),
      });
    }
  }, [data?.pages.length, baseKey, queryClient]);
};
