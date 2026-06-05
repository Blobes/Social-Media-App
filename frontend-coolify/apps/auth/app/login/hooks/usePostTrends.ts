"use client";

import { useMemo } from "react";
import { asset } from "@repo/assets";
import { CACHE_KEYS, IPost, IGistPayload } from "@repo/core";
import { useFeed } from "@repo/features";
import { useCachedData, usePageCache } from "@repo/shared-hooks";

/**
 * Filter and compute the top trending posts based on engagement heuristics.
 */
export const useTrendingData = () => {
  const { feed: onlinePosts, isLoading, rawData } = useFeed();
  const cachedPosts = useCachedData<IPost>([
    [CACHE_KEYS.POST.GISTS],
    [CACHE_KEYS.POST.STAKES],
  ]);

  usePageCache(rawData, CACHE_KEYS.POST.FEED);
  const posts = onlinePosts.length > 0 ? onlinePosts : cachedPosts;

  const avatars = [
    asset.avatar1,
    asset.avatar2,
    asset.avatar3,
    asset.avatar4,
    asset.avatar5,
    asset.avatar6,
  ];

  const gradLocation = "30%";
  const gradDegree = "180deg";
  const bgColors = [
    `linear-gradient(${gradDegree},rgb(19, 29, 97) 0%,rgb(50, 73, 200) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(13, 65, 82) 0%,rgb(29, 157, 169) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(11, 71, 32) 0%,rgb(29, 141, 96) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(63, 66, 12) 0%,rgb(111, 129, 30) ${gradLocation})`,
    `linear-gradient(${gradDegree},rgb(81, 46, 22) 0%,rgb(145, 105, 26) ${gradLocation})`,
  ];

  const processedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];

    // Calculate engagement weights for filtering
    const scoredPosts = posts.map((post) => {
      let score = 0;
      let caption = "";

      if (post.postType === "GIST") {
        const payload = post as unknown as IGistPayload;
        score =
          (payload.likeCount || 0) +
          (payload.viewCount || 0) +
          (payload.commentCount || 0);
        caption = payload.latestCaption?.caption || "";
      } else {
        // Fallback weighting structure for Stake payloads
        score = 0;
        caption = post.content || "";
      }

      return { post, score, caption };
    });

    // Sort descending and pluck top 6 items
    return scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item, index) => ({
        post: item.post,
        caption: item.caption,
        avatar: avatars[index % avatars.length],
        bgColor: bgColors[index % bgColors.length],
      }));
  }, [posts]);

  return { processedPosts, isLoading };
};
