"use client";

import { IPost, IStake, QUERY_KEYS } from "@repo/core";
import { useStake } from "@repo/features";
import { FeedService } from "./service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Manages the unified feed and dissolves bulk results into granular cache entries.
 */
export const useFeed = () => {
  const queryClient = useQueryClient();
  const { stakes } = useStake();
  const { fetchFeed } = FeedService();

  const {
    data: feed = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.POST.FEED],
    queryFn: async () => {
      const res = await fetchFeed();
      if (res.status !== "SUCCESS") {
        throw new Error(res.message || "Failed to fetch feed");
      }
      const remotePayload = res.payload || [];
      // Dissolve Strategy: Push each post into its own granular key based on its ID.
      // This allows useCachedData and usePostSeen to work without refetching.
      remotePayload.forEach((post: IPost) => {
        // We use the broad GISTS or STAKES key + ID
        const baseKey =
          post.postType === "STAKE"
            ? QUERY_KEYS.POST.STAKES
            : QUERY_KEYS.POST.GISTS;

        queryClient.setQueryData([baseKey, post._id], post);
      });
      return remotePayload;
    },

    /**
     * Combines remote feed and local stakes into a single unified list.
     */
    select: (remotePayload: IPost[]) => {
      const feedList = remotePayload.map((post) => ({
        ...post,
        postType: post.postType || "GIST",
      })) as IPost[];

      const stakeList = stakes.map((stake: IStake) => ({
        ...stake,
        postType: "STAKE" as const,
      })) as IPost[];

      return [...feedList, ...stakeList];
    },

    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  return {
    feed,
    message: error instanceof Error ? error.message : null,
    isLoading,
    handleRefresh,
  };
};
