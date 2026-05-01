"use client";

import { IPost, IStake, CACHE_KEYS, IListPayload } from "@repo/core";
import { useStake } from "@repo/features";
import { FeedService } from "./service";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Type for the unified feed page.
 */
type FeedPage = IListPayload<IPost> & { next: number | undefined };

/**
 * Manages the unified feed and dissolves bulk results into granular cache entries.
 */
export const useFeed = () => {
  const queryClient = useQueryClient();
  const { stakes } = useStake();
  const { fetchFeed } = FeedService();

  const {
    data,
    error,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<FeedPage>({
    queryKey: [CACHE_KEYS.POST.FEED],
    queryFn: async ({ pageParam = 1 }) => {
      // Feed service now accepts page params
      const res = await fetchFeed(pageParam as number, 20);

      if (res.status !== "SUCCESS") {
        throw new Error(res.message || "Failed to fetch feed");
      }

      const remotePayload = res.payload || [];

      /**
       * Dissolve Strategy: Push each post into its own granular key.
       * This allows individual post updates to sync across the whole app.
       */
      remotePayload.forEach((post: IPost) => {
        const baseKey =
          post.postType === "STAKE"
            ? CACHE_KEYS.POST.STAKES
            : CACHE_KEYS.POST.GISTS;

        queryClient.setQueryData([baseKey, post._id], post);
      });

      return {
        ...res,
        payload: remotePayload,
        next: res.metaData?.hasNextPage ? (pageParam as number) + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  /**
   * Combines remote paginated feed and local stakes into a single unified list.
   */
  const remotePosts = data?.pages.flatMap((page) => page.payload || []) || [];

  const feed = [
    ...remotePosts.map((post) => ({
      ...post,
      postType: post.postType || "GIST",
    })),
    ...stakes.map((stake: IStake) => ({
      ...stake,
      postType: "STAKE" as const,
    })),
  ] as IPost[];

  return {
    feed,
    rawData: data,
    message: error instanceof Error ? error.message : null,
    isLoading,
    handleRefresh: refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
