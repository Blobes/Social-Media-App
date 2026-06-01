"use client";

import { useState } from "react";
import { CACHE_KEYS, IListPayload, ITopic } from "@repo/core";
import { useInfiniteQuery } from "@tanstack/react-query";
import { PostService } from "../postService";

export interface UseTopicsProps {
  topics: string[];
  setTopics: (topics: string[]) => void;
}

type TopicPage = IListPayload<ITopic> & { next: number | undefined };

/**
 * Manages taxonomy operations, text search inputs, and remote queries for post categorizations.
 */
export const useTopics = ({ topics, setTopics }: UseTopicsProps) => {
  const { lookupTopics } = PostService();
  const [topicSearchQuery, setTopicSearchQuery] = useState("");

  /**
   * Fetches matching taxonomy collections from backend records based on the search term and active tags.
   */
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isTopicsLoading,
  } = useInfiniteQuery<TopicPage>({
    queryKey: [CACHE_KEYS.POST.LOOKUP_TOPICS, topicSearchQuery, topics],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await lookupTopics({
        keyword: topicSearchQuery,
        alreadySelected: topics,
      });

      if (res.status !== "SUCCESS") {
        throw new Error(res.message || "Failed to query server topics index.");
      }

      const payload = res.payload || [];

      return {
        ...res,
        payload,
        next: res.metaData?.hasNextPage ? (pageParam as number) + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.next,
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
    refetchOnWindowFocus: false,
  });

  /**
   * Adds chosen topic selections to active state collections while shielding duplicates.
   */
  const handleTopics = (selectedItem?: ITopic) => {
    if (!selectedItem) return;

    const keyword = selectedItem.title || "";
    if (!topics.includes(keyword)) {
      setTopics([...topics, keyword]);
    }
    setTopicSearchQuery("");
  };

  /**
   * Splices designated tag titles out of state vectors when a removal action event is fired.
   */
  const handleRemoveTopic = (targetTitle: string) => {
    setTopics(topics.filter((t) => t !== targetTitle));
  };

  return {
    topicSearchQuery,
    setTopicSearchQuery,
    availableTopicsList:
      data?.pages.flatMap((page) => page.payload || []) || [],
    isTopicsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    handleTopics,
    handleRemoveTopic,
  };
};
