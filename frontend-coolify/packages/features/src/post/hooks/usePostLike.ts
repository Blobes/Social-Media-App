"use client";

import { useState, useCallback, useEffect } from "react";
import { vibrate, processQueue } from "@repo/helpers";
import { AuthStatus, QUEUE_KEYS, UIMode } from "@repo/core";

// Generic interface for any content that can be liked
interface LikablePost {
  _id: string;
  likedByMe: boolean;
  likeCount: number;
  status?: string;
  [key: string]: any;
}

interface UsePostLikeContext {
  getPendingLike: (key: string, id: string) => boolean | null;
  setPendingLike: (key: string, id: string, value: boolean) => void;
  clearPendingLike: (key: string, id: string) => void;
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
  // useEffect(() => {
  //   const pendingLike = getPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
  //   if (pendingLike !== null && pendingLike !== likedByMe) {
  //     setPostData((prev) => ({
  //       ...prev,
  //       likedByMe: pendingLike,
  //       likeCount: prev.likeCount + (pendingLike ? 1 : -1),
  //     }));
  //   }
  // }, [_id, getPendingLike, likedByMe]);

  useEffect(() => {
    const pendingLike = getPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);

    // If we have a stored intent that differs from what the server sent
    if (pendingLike !== null && pendingLike !== likedByMe) {
      setPostData((prev) => {
        // Calculate the difference:
        // If we intended to LIKE but the server says we HAVEN'T, add 1.
        // If we intended to UNLIKE but the server says we HAVE, subtract 1.
        const adjustment = pendingLike ? 1 : -1;

        return {
          ...prev,
          likedByMe: pendingLike,
          // Only adjust if the server data hasn't already accounted for it
          likeCount: prev.likeCount + adjustment,
        };
      });
    }
  }, [_id]); // Remove likedByMe from dependencies to prevent infinite loops

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
    setPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id, nextLiked);

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
        clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
      }
    } catch (error) {
      // Rollback strategy: In a hard failure, we clear the queue.
      // You could also revert the UI state here if desired.
      clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
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
      processQueue(authStatus, QUEUE_KEYS.POST.LIKE, onLikeApi);
      const handleOnline = () =>
        processQueue(authStatus, QUEUE_KEYS.POST.LIKE, onLikeApi);
      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [authStatus]);

  return { postData, isLiking, handleLike };
};
