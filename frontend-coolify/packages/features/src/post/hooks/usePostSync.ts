"use client";

import { useEffect } from "react";
import { processQueue } from "@repo/helpers";
import { QUEUE_KEYS } from "@repo/core";
import { LikablePost, UsePostLikeContext } from "./usePostLike";

interface LikeSlice {
  likedByMe: boolean;
  likeCount: number;
}

/**
 * Restores pending optimistic likes and retries the queue when connectivity returns.
 */
export const usePostLikeSync = (
  _id: string,
  post: LikablePost,
  context: UsePostLikeContext,
  onLikeApi: (id: string) => Promise<any>,
  setLikeState: React.Dispatch<React.SetStateAction<LikeSlice>>,
) => {
  const { getPendingLike, clearPendingLike, updateStore, authStatus } = context;

  useEffect(() => {
    const pending = getPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
    const pendingLike = pending?.newValue;

    if (pendingLike !== undefined && pendingLike !== post.likedByMe) {
      const nextCount = pendingLike
        ? post.likeCount + 1
        : Math.max(0, post.likeCount - 1);

      setLikeState({
        likedByMe: pendingLike,
        likeCount: nextCount,
      });

      updateStore?.(_id, pendingLike, nextCount);
      clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
    }
  }, [
    _id,
    post.likedByMe,
    post.likeCount,
    getPendingLike,
    clearPendingLike,
    updateStore,
    setLikeState,
  ]);

  useEffect(() => {
    if (authStatus === "AUTHENTICATED") {
      processQueue(authStatus, QUEUE_KEYS.POST.PENDING_LIKES, onLikeApi);

      const handleOnline = () =>
        processQueue(authStatus, QUEUE_KEYS.POST.PENDING_LIKES, onLikeApi);

      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [authStatus, onLikeApi]);
};
