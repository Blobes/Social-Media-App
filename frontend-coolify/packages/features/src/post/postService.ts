"use client";

import { ISinglePayload, PostType, SERVER_API } from "@repo/core";
import { apiClient } from "@repo/helpers";

interface SeenResponse {
  viewCount: number;
}

export const PostService = () => {
  const markAsSeen = async (
    postId: string,
    postType: PostType,
  ): Promise<ISinglePayload<SeenResponse | null>> => {
    try {
      const res = await apiClient<ISinglePayload<SeenResponse>>(
        SERVER_API.postSeen(postId),
        { method: "PATCH", body: JSON.stringify({ postType }) },
      );
      return res;
    } catch (error) {
      throw error;
    }
  };

  return { markAsSeen };
};
