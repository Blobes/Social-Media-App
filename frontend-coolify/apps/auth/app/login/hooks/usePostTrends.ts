"use client";

import { useMemo } from "react";
import { asset } from "packages/assets";
import { CACHE_KEYS, IPost, IGistPayload } from "packages/core";
import { useFeed } from "@repo/features";
import { useCachedData, usePageCache } from "packages/shared-hooks";

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

  const bgColors = [
    "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
    "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
    "linear-gradient(135deg, #373b44 0%, #4286f4 100%)",
    "linear-gradient(135deg, #232526 0%, #414345 100%)",
    "linear-gradient(135deg, #0f0c20 0%, #17123a 100%)",
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
