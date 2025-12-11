"use client";

import { fetcher } from "./fetcher";

// POST LIKE HANDLING HELPERS
const pendingLikesKey = "pendingLikes";
const likeQueueKey = "likeQueue";

// --- Pending likes ---
export const setPendingLike = (postId: string, liked: boolean) => {
  const pending = JSON.parse(localStorage.getItem(pendingLikesKey) || "{}");
  pending[postId] = liked;
  localStorage.setItem(pendingLikesKey, JSON.stringify(pending));
};

export const getPendingLike = (postId: string): boolean | null => {
  const pending = JSON.parse(localStorage.getItem(pendingLikesKey) || "{}");
  return pending[postId] ?? null;
};

export const clearPendingLike = (postId: string) => {
  const pending = JSON.parse(localStorage.getItem(pendingLikesKey) || "{}");
  delete pending[postId];
  localStorage.setItem(pendingLikesKey, JSON.stringify(pending));
};

// --- Offline queue ---
export const enqueueLike = (postId: string) => {
  const queue = JSON.parse(localStorage.getItem(likeQueueKey) || "[]");
  queue.push({ postId, timestamp: Date.now() });
  localStorage.setItem(likeQueueKey, JSON.stringify(queue));
};

export const processQueue = async () => {
  const queue = JSON.parse(localStorage.getItem(likeQueueKey) || "[]");
  if (!queue.length) return;

  const remaining: any[] = [];
  for (const { postId } of queue) {
    try {
      await fetcher(`/posts/${postId}/like`, { method: "PUT" });
    } catch {
      remaining.push({ postId, timestamp: Date.now() });
    }
  }
  localStorage.setItem(likeQueueKey, JSON.stringify(remaining));
};
