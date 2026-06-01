"use client";

import { CACHE_KEYS, IGist, IListPayload } from "@repo/core";
import { GistService } from "../../gistService";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

// Custom type for the paginated result to ensure type safety.
type GistPage = IListPayload<IGist> & { next: number | undefined };

/**
 * Hook to manage gist list fetching and granular cache synchronization.
 */
export const useGists = () => {
  const queryClient = useQueryClient();
  const { fetchGistList } = GistService();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    error,
  } = useInfiniteQuery<GistPage>({
    queryKey: [CACHE_KEYS.POST.GISTS],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetchGistList(pageParam as number, 10);

      const payload = res.payload || [];

      // Dissolve Strategy: Populate granular keys for each gist. We use the raw IGist object directly now.
      payload.forEach((gist) => {
        queryClient.setQueryData([CACHE_KEYS.POST.GISTS, gist._id], gist);
      });

      return {
        ...res,
        payload,
        next: res.metaData?.hasNextPage ? (pageParam as number) + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    gists: data?.pages.flatMap((page) => page.payload || []) || [],
    rawData: data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    handleRefresh: refetch,
    message: error instanceof Error ? error.message : null,
  };
};
