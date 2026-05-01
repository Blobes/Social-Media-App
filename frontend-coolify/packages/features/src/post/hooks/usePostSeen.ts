"use client";

import { useQueryClient, QueryKey } from "@tanstack/react-query";
import { useRef, useEffect, useCallback } from "react";
import { CACHE_KEYS, PostType } from "@repo/core";
import { useIntersectionObserver } from "@repo/shared-hooks";
import { PostService } from "../postService";
import { updateCacheItem } from "@repo/helpers";

/**
 * Marks a post as viewed after a deliberate dwell time and updates multiple cache keys.
 * @param postId - The ID of the post.
 * @param postType - GIST or STAKE.
 * @param affectedQueryKeys - Array of QueryKeys that should reflect the updated viewCount.
 */
export const usePostSeen = (
  postId: string,
  postType: PostType,
  affectedQueryKeys: QueryKey[] = [[CACHE_KEYS.POST.FEED]],
) => {
  const queryClient = useQueryClient();
  const { markAsSeen } = PostService();
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasBeenSeen = !!queryClient.getQueryData([
    CACHE_KEYS.POST.SEEN,
    postId,
  ]);

  /**
   * Cleanup timer on unmount.
   */
  useEffect(() => {
    return () => {
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    };
  }, []);

  const handleIntersect = useCallback(() => {
    if (viewTimerRef.current || hasBeenSeen) return;

    // Trigger update after 30 seconds of continuous visibility
    viewTimerRef.current = setTimeout(async () => {
      // Prevent further triggers in this session
      queryClient.setQueryData([CACHE_KEYS.POST.SEEN, postId], new Date());

      try {
        const response = await markAsSeen(postId, postType);

        if (response?.status === "SUCCESS" && response.payload?.viewCount) {
          const newCount = response.payload.viewCount;

          /**
           * Iterate through all affected keys (Feed, Gists, Stakes, Profile, etc.)
           * and update the viewCount in each.
           */
          affectedQueryKeys.forEach((key) => {
            updateCacheItem(queryClient, key, postId, (oldPost: any) => ({
              ...oldPost,
              viewCount: newCount,
            }));
          });
        }
      } catch (error) {
        console.error(`[usePostSeen] Sync failed for ${postId}:`, error);
      }
    }, 30000);
  }, [
    postId,
    postType,
    markAsSeen,
    queryClient,
    affectedQueryKeys,
    hasBeenSeen,
  ]);

  const handleLeave = useCallback(() => {
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
  }, []);

  const { elementRef } = useIntersectionObserver({
    onIntersect: handleIntersect,
    onLeave: handleLeave,
    threshold: 0.5,
    enabled: !hasBeenSeen,
    once: true,
  });

  return { elementRef };
};
