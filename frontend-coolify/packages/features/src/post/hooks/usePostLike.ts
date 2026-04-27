"use client";

import { useState, useCallback, useRef } from "react";
import { vibrate } from "@repo/helpers";
import { AuthStatus, QUEUE_KEYS, QueueItem, UIMode } from "@repo/core";
import { usePostLikeSync } from "./usePostSync";
import { usePostLikeMutation } from "./usePostMutation";
import { SBMessage } from "@repo/shared-hooks";

// The smallest like-only data shape shared across the hook.
export interface LikeSlice {
  likedByMe: boolean;
  likeCount: number;
}

// Minimum post fields required for like management.
export interface LikablePost extends LikeSlice {
  _id: string;
  status?: string;
}

// Public API returned to UI consumers.
export interface PostLikeState extends LikeSlice {
  isLiking: boolean;
  handleLike: () => void;
  canInteract: () => boolean;
}

export interface UsePostLikeContext {
  getPendingLike: (key: string, id: string) => QueueItem<boolean> | null;
  setPendingLike: (key: string, id: string, item: QueueItem<boolean>) => void;
  clearPendingLike: (key: string, id: string) => void;
  authStatus: AuthStatus;
  setModalContent: (content: any) => void;
  isOffline: boolean;
  isUnstableNetwork: boolean;
  setSBMessage: (config: SBMessage) => void;
  mode: UIMode;
  LoginPrompt?: React.ReactNode;
  updateStore?: (id: string, likedByMe: boolean, likeCount: number) => void;
  queryKey?: string[];
}

/**
 * Computes the next optimistic like state from the current state.
 * A single user can only contribute either 1 like or 0 likes.
 */
const getNextLikeState = (
  current: LikeSlice,
  nextLikedByMe: boolean,
): LikeSlice => {
  if (!current.likedByMe && nextLikedByMe) {
    return {
      likedByMe: true,
      likeCount: current.likeCount + 1,
    };
  }

  if (current.likedByMe && !nextLikedByMe) {
    return {
      likedByMe: false,
      likeCount: Math.max(0, current.likeCount - 1),
    };
  }

  return {
    likedByMe: nextLikedByMe,
    likeCount: current.likeCount,
  };
};

/**
 * Handles optimistic like updates, queue persistence, and debounced server sync.
 * This hook intentionally owns only like-related state, not the full post object.
 */
export const usePostLike = (
  post: LikablePost,
  onLikeApi: (id: string) => Promise<any>,
  context: UsePostLikeContext,
): PostLikeState => {
  const {
    setPendingLike,
    clearPendingLike,
    authStatus,
    setModalContent,
    isOffline,
    isUnstableNetwork,
    setSBMessage,
    mode,
    LoginPrompt: LoginStepper,
    updateStore,
    queryKey,
  } = context;

  const [likeState, setLikeState] = useState<LikeSlice>({
    likedByMe: post.likedByMe,
    likeCount: post.likeCount,
  });
  const [isLiking, setIsLiking] = useState(false);

  // Tracks the last server-confirmed value so queued updates know the original state.
  const lastStoredVal = useRef(post.likedByMe);

  // Counts rapid toggles so we can avoid unnecessary server writes when the user cancels themselves out.
  const clickCount = useRef(0);

  // Debounces the mutation so multiple quick taps collapse into one final sync.
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const { _id } = post;

  // Restores any pending optimistic state for this post and resumes queued work when needed.
  usePostLikeSync(_id, post, context, onLikeApi, setLikeState);

  const { mutate } = usePostLikeMutation(
    onLikeApi,
    setSBMessage,
    queryKey,
    clearPendingLike,
    updateStore,
  );

  /**
   * Runs the short-lived like animation.
   * Only a positive like action triggers vibration.
   */
  const triggerLikeAnimation = useCallback((nextLikedByMe: boolean) => {
    setIsLiking(true);
    if (nextLikedByMe) vibrate();
    setTimeout(() => setIsLiking(false), 500);
  }, []);

  /**
   * Applies the optimistic UI state immediately and persists that intent for recovery.
   */
  const applyOptimisticLike = useCallback(
    (nextState: LikeSlice) => {
      setPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id, {
        newValue: nextState.likedByMe,
        prevValue: lastStoredVal.current,
      });

      // Keep external stores aligned with the optimistic UI value.
      updateStore?.(_id, nextState.likedByMe, nextState.likeCount);

      setLikeState(nextState);
      triggerLikeAnimation(nextState.likedByMe);
    },
    [_id, setPendingLike, updateStore, triggerLikeAnimation],
  );

  /**
   * Prevents interaction when auth or network conditions do not allow a like action.
   */
  const canInteract = useCallback(() => {
    if (authStatus === "UNAUTHENTICATED") {
      setModalContent({ content: LoginStepper });
      return false;
    }

    if (!navigator.onLine || isUnstableNetwork || mode === "OFFLINE") {
      setSBMessage({
        msg: {
          tagline:
            mode === "OFFLINE"
              ? "Post is offline."
              : !navigator.onLine
                ? "You are offline."
                : "Connection unstable.",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      return false;
    }

    return true;
  }, [
    authStatus,
    setModalContent,
    LoginStepper,
    isOffline,
    isUnstableNetwork,
    mode,
    setSBMessage,
  ]);

  /**
   * Schedules the final server sync after the user pauses interaction.
   * If the user toggles back to the starting state, the queued mutation is skipped.
   */
  const scheduleMutation = useCallback(() => {
    clickCount.current += 1;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const isEven = clickCount.current % 2 === 0;

      if (clickCount.current > 1 && isEven) {
        clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
        clickCount.current = 0;
        return;
      }

      mutate(_id, {
        onSuccess: (payload) => {
          if (payload) {
            // Replace optimistic values with the server-confirmed state.
            setLikeState({
              likedByMe: payload.likedByMe,
              likeCount: Math.max(0, payload.likeCount),
            });
            lastStoredVal.current = payload.likedByMe;
          }
          clickCount.current = 0;
        },
      });
    }, 3000);
  }, [_id, clearPendingLike, mutate]);

  /**
   * Main public action for toggling like state.
   */
  const handleLike = useCallback(async () => {
    if (!canInteract()) return;

    const nextLikedByMe = !likeState.likedByMe;
    const nextState = getNextLikeState(likeState, nextLikedByMe);

    applyOptimisticLike(nextState);
    scheduleMutation();
  }, [canInteract, likeState, applyOptimisticLike, scheduleMutation]);

  return {
    likedByMe: likeState.likedByMe,
    likeCount: likeState.likeCount,
    isLiking,
    handleLike,
    canInteract,
  };
};
