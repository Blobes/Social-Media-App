"use client";

import { useState, useCallback, useEffect } from "react";
import { vibrate, processQueue } from "@repo/helpers";
import { AuthStatus, UIMode } from "@repo/core";

// Generic interface for any content that can be liked
interface LikablePost {
  _id: string;
  likedByMe: boolean;
  likeCount: number;
  status?: string;
  [key: string]: any;
}

interface UsePostLikeContext {
  getPendingLike: (id: string) => boolean | null;
  setPendingLike: (id: string, value: boolean) => void;
  clearPendingLike: (id: string) => void;
  authStatus: AuthStatus;
  setModalContent: (content: any) => void;
  isOffline: boolean;
  isUnstableNetwork: boolean;
  setSBMessage: (config: any) => void;
  mode: UIMode;
  LoginPrompt?: React.ReactNode;
}

/**
 * A reusable hook for handling optimistic likes across different post types.
 * @param post The initial post object (Gist, Article, Comment, etc.)
 * @param onLikeApi The specific API function to call (e.g., gistService.likeGist)
 * @param context The global application context/state
 */
export const usePostLike = <T extends LikablePost>(
  post: T,
  onLikeApi: (id: string, nextState: boolean) => Promise<any>,
  context: UsePostLikeContext,
) => {
  const {
    getPendingLike,
    setPendingLike,
    clearPendingLike,
    authStatus,
    setModalContent,
    isOffline,
    isUnstableNetwork,
    setSBMessage,
    mode,
    LoginPrompt: LoginStepper,
  } = context;

  const [postData, setPostData] = useState<T>(post);
  const [isLiking, setIsLiking] = useState(false);

  const { _id, likedByMe } = postData;

  // Sync with localStorage on mount (Handles refreshes while offline)
  useEffect(() => {
    const pendingLike = getPendingLike(_id);
    if (pendingLike !== null && pendingLike !== likedByMe) {
      setPostData((prev) => ({
        ...prev,
        likedByMe: pendingLike,
        likeCount: prev.likeCount + (pendingLike ? 1 : -1),
      }));
    }
  }, [_id, getPendingLike, likedByMe]);

  const handleLike = useCallback(async () => {
    if (isLiking) return;

    // Guard clauses
    if (authStatus === "UNAUTHENTICATED") {
      setModalContent({ content: LoginStepper });
      return;
    }

    if (isOffline || isUnstableNetwork || mode === "OFFLINE") {
      setSBMessage({
        msg: {
          content:
            mode === "OFFLINE"
              ? "You can't engage an offline post."
              : "Connection unstable. Try again later.",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      return;
    }

    setIsLiking(true);

    // 1. Optimistic Update
    const nextLiked = !postData.likedByMe;
    setPostData((prev) => ({
      ...prev,
      likedByMe: nextLiked,
      likeCount: prev.likeCount + (nextLiked ? 1 : -1),
    }));

    // 2. Persist to Queue (Local Storage)
    setPendingLike(_id, nextLiked);

    // 3. Feedback
    if (nextLiked) vibrate();

    try {
      // 4. API Call
      const payload = await onLikeApi(_id, nextLiked);

      if (payload) {
        setPostData((prev) => ({
          ...prev,
          likedByMe: payload.likedByMe,
          likeCount: payload.likeCount,
        }));
        clearPendingLike(_id);
      }
    } catch (error) {
      // Rollback strategy: In a hard failure, we clear the queue.
      // You could also revert the UI state here if desired.
      clearPendingLike(_id);
    } finally {
      setIsLiking(false);
    }
  }, [
    _id,
    postData.likedByMe,
    isLiking,
    authStatus,
    isOffline,
    isUnstableNetwork,
    mode,
    onLikeApi,
    setPendingLike,
    clearPendingLike,
    setSBMessage,
    setModalContent,
    LoginStepper,
  ]);

  // Background syncing for connectivity changes
  useEffect(() => {
    if (authStatus === "AUTHENTICATED") {
      processQueue(authStatus);
      const handleOnline = () => processQueue(authStatus);
      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [authStatus]);

  return { postData, isLiking, handleLike };
};
