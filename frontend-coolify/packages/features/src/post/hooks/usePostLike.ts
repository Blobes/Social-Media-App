"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { vibrate, processQueue } from "@repo/helpers";
import { AuthStatus, QUEUE_KEYS, QueueItem, UIMode } from "@repo/core";

// --- Interfaces ---
interface LikablePost {
  _id: string;
  likedByMe: boolean;
  likeCount: number;
  status?: string;
  [key: string]: any;
}

interface UsePostLikeContext {
  getPendingLike: (key: string, id: string) => QueueItem<boolean> | null;
  setPendingLike: (key: string, id: string, item: QueueItem<boolean>) => void;
  clearPendingLike: (key: string, id: string) => void;
  authStatus: AuthStatus;
  setModalContent: (content: any) => void;
  isOffline: boolean;
  isUnstableNetwork: boolean;
  setSBMessage: (config: any) => void;
  mode: UIMode;
  LoginPrompt?: React.ReactNode;
}

// --- Hook ---
export const usePostLike = <T extends LikablePost>(
  post: T,
  onLikeApi: (id: string) => Promise<any>,
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

  // --- State & Refs ---
  const [postData, setPostData] = useState<T>(post);
  const [isLiking, setIsLiking] = useState(false);

  const lastStoredVal = useRef(post.likedByMe);
  const clickCount = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { _id } = postData;

  // --- Lifecycle: Sync localStorage on mount ---
  useEffect(() => {
    const pending = getPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
    const pendingLike = pending?.newValue;

    if (pendingLike !== undefined && pendingLike !== post.likedByMe) {
      setPostData((prev) => ({
        ...prev,
        likedByMe: pendingLike,
        likeCount: prev.likeCount + (pendingLike ? 1 : -1),
      }));
      clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
    }
  }, [_id, getPendingLike, post.likedByMe, clearPendingLike]);

  // --- Lifecycle: Background sync ---
  useEffect(() => {
    if (authStatus === "AUTHENTICATED") {
      processQueue(authStatus, QUEUE_KEYS.POST.PENDING_LIKES, onLikeApi);

      const handleOnline = () =>
        processQueue(authStatus, QUEUE_KEYS.POST.PENDING_LIKES, onLikeApi);

      window.addEventListener("online", handleOnline);
      return () => window.removeEventListener("online", handleOnline);
    }
  }, [authStatus, onLikeApi]);

  // --- Logic Helpers ---
  const toggleUI = useCallback(
    (nextState: boolean) => {
      setIsLiking(true);
      setPostData((prev) => ({
        ...prev,
        likedByMe: nextState,
        likeCount: prev.likeCount + (nextState ? 1 : -1),
      }));

      setPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id, {
        newValue: nextState,
        prevValue: lastStoredVal.current,
      });

      if (nextState) vibrate();
      setTimeout(() => setIsLiking(false), 500);
    },
    [_id, setPendingLike],
  );

  // --- Main Action ---
  const handleLike = useCallback(async () => {
    // 1. Guards
    if (authStatus === "UNAUTHENTICATED") {
      setModalContent({ content: LoginStepper });
      return;
    }

    if (isOffline || isUnstableNetwork || mode === "OFFLINE") {
      setSBMessage({
        msg: {
          content:
            mode === "OFFLINE" ? "Post is offline." : "Connection unstable.",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      return;
    }

    // 2. Optimistic Update
    const nextLiked = !postData.likedByMe;
    toggleUI(nextLiked);

    // 3. Debounce Control
    clickCount.current += 1;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      const isEven = clickCount.current % 2 === 0;

      // Check if user toggled back to original state during the 3s window
      if (clickCount.current > 1 && isEven) {
        setPostData((prev) => prev);
        clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
        clickCount.current = 0;
        return;
      }

      // 4. API Sync
      try {
        const payload = await onLikeApi(_id);

        if (payload) {
          setPostData((prev) => ({
            ...prev,
            likeCount: payload.likeCount,
            likedByMe: payload.likedByMe,
          }));

          lastStoredVal.current = payload.likedByMe;
          clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
        }
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        clickCount.current = 0;
      }
    }, 3000);
  }, [
    _id,
    authStatus,
    postData.likedByMe,
    isOffline,
    isUnstableNetwork,
    mode,
    onLikeApi,
    clearPendingLike,
    setSBMessage,
    setModalContent,
    LoginStepper,
    toggleUI,
  ]);

  return { postData, isLiking, handleLike };
};
