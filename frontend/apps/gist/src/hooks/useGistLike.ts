import { useState, useCallback, useEffect } from "react";
import { IGist } from "@/types";
import { vibrate } from "@/helpers/global";
import { processQueue } from "@/helpers/post";

export const useGistLike = (gist: IGist, context: any) => {
  // 1. Destructure everything internally for clarity
  const {
    handleGistLike,
    getPendingLike,
    setPendingLike,
    clearPendingLike,
    authStatus,
    setModalContent,
    isOffline,
    isUnstableNetwork,
    setSBMessage,
    mode,
    LoginStepper,
  } = context;
  const [gistData, setGistData] = useState<IGist>(gist);
  const [isLiking, setIsLiking] = useState(false);

  const { _id, likedByMe } = gistData;

  // Sync like with localStorage on mount
  useEffect(() => {
    const pendingLike = getPendingLike(_id);
    if (pendingLike !== null && pendingLike !== likedByMe) {
      setGistData((prev) => ({
        ...prev,
        likedByMe: pendingLike,
        likeCount: prev.likeCount + (pendingLike ? 1 : -1),
      }));
    }
  }, [_id, getPendingLike, likedByMe]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;

    if (authStatus === "UNAUTHENTICATED") {
      setModalContent({ content: LoginStepper });
      return;
    }
    if (isOffline || isUnstableNetwork || mode === "offline") {
      setSBMessage({
        msg: {
          content:
            mode === "offline"
              ? "You can't engage an offline post."
              : "Something went wrong.",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      return;
    }

    setIsLiking(true);

    // Optimistic update
    setGistData((prev) => {
      const nextLiked = !prev.likedByMe;
      const nextCount = prev.likeCount + (nextLiked ? 1 : -1);
      // persist pending like
      setPendingLike(_id, nextLiked);
      return { ...prev, likedByMe: nextLiked, likeCount: nextCount };
    });

    if (!likedByMe) vibrate(); // Vibrate on like

    try {
      const payload = await handleGistLike(_id, !likedByMe);
      if (payload) {
        setGistData((prev) => ({
          ...prev,
          likedByMe: payload.likedByMe,
          likeCount: payload.likeCount,
        }));
        clearPendingLike(_id);
      }
    } catch {
      clearPendingLike(_id);
      // Optional: Rollback state on hard error
    } finally {
      setIsLiking(false);
    }
  }, [
    _id,
    likedByMe,
    authStatus,
    isOffline,
    isUnstableNetwork,
    handleGistLike,
    setPendingLike,
    clearPendingLike,
    setSBMessage,
    setModalContent,
    LoginStepper,
  ]);

  // Background syncing
  useEffect(() => {
    if (authStatus === "AUTHENTICATED") {
      // Initial sync on login/boot
      processQueue(authStatus);

      // Sync when coming back online
      const handleOnline = () => processQueue(authStatus);
      window.addEventListener("online", handleOnline);

      return () => window.removeEventListener("online", handleOnline);
    }
  }, [authStatus]);

  return { gistData, isLiking, handleLike };
};
