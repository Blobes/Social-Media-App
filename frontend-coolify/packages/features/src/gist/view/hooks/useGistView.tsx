"use client";

import { useEffect, useRef, useState } from "react";
import { LikeState } from "../GistMedia";

export const useGistLikeState = (likeState: LikeState) => {
  const [localLikeState, setLocalLikeState] = useState(likeState);
  const [localIsLiking, setLocalIsLiking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalLikeState((prev) => ({
      ...prev,
      likedByMe: likeState.likedByMe,
      likeCount: likeState.likeCount,
      handleLike: likeState.handleLike,
    }));
  }, [likeState.likedByMe, likeState.likeCount, likeState.handleLike]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleGistLike = () => {
    if (localLikeState.canInteract && localLikeState.canInteract() === false)
      return;

    const nextLikedByMe = !localLikeState.likedByMe;
    if (nextLikedByMe) {
      setLocalIsLiking(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setLocalIsLiking(false);
      }, 500);
    }

    setLocalLikeState((prev) => ({
      ...prev,
      likedByMe: !prev.likedByMe,
      likeCount: prev.likedByMe
        ? Math.max(0, prev.likeCount - 1)
        : prev.likeCount + 1,
    }));

    likeState.handleLike();
  };

  return {
    localLikeState,
    localIsLiking,
    handleGistLike,
  };
};
