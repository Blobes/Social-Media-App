"use client";

import { GenericQueue } from "@repo/core";

// // POST LIKE HANDLING HELPERS
// const pendingLikesKey = "pendingLikes";
// const likeQueueKey = QueueKeys.POST.like;
/**
 * Generic helper to manage pending/optimistic states in localStorage
 */
export const setPendingState = <T>(key: string, id: string, value: T) => {
  if (typeof window === "undefined") return;
  const pending = JSON.parse(localStorage.getItem(key) || "{}");
  pending[id] = value;
  localStorage.setItem(key, JSON.stringify(pending));
};

export const getPendingState = <T>(key: string, id: string): T | null => {
  if (typeof window === "undefined") return null;
  const pending = JSON.parse(localStorage.getItem(key) || "{}");
  return (pending[id] as T) ?? null;
};

export const clearPendingState = (key: string, id: string) => {
  if (typeof window === "undefined") return;
  const pending = JSON.parse(localStorage.getItem(key) || "{}");
  if (pending[id] !== undefined) {
    delete pending[id];
    localStorage.setItem(key, JSON.stringify(pending));
  }
};
// // --- Offline queue ---
// export const enqueueLike = (postId: string, finalState: boolean) => {
//   const queue = JSON.parse(localStorage.getItem(likeQueueKey) || "{}");
//   // Overwrites any previous pending action for this specific post
//   queue[postId] = { liked: finalState, timestamp: Date.now() };
//   localStorage.setItem(likeQueueKey, JSON.stringify(queue));
// };

export const enqueueTask = <T>(queueKey: string, id: string, payload: T) => {
  const queue = JSON.parse(localStorage.getItem(queueKey) || "{}");
  queue[id] = { payload, timestamp: Date.now() };
  localStorage.setItem(queueKey, JSON.stringify(queue));
};

let isSyncing: Record<string, boolean> = {}; // Track sync status per queue key

export const processQueue = async <T>(
  authStatus: string,
  queueKey: string,
  apiCall: (id: string, payload: T) => Promise<void>,
) => {
  // 1. Guards: Don't sync if unauthorized or if THIS specific queue is already running
  if (isSyncing[queueKey] || authStatus !== "AUTHENTICATED") return;

  const getQueue = (): GenericQueue =>
    JSON.parse(localStorage.getItem(queueKey) || "{}");

  const items = Object.keys(getQueue());
  if (!items.length) return;

  isSyncing[queueKey] = true;

  try {
    for (const id of items) {
      const currentQueue = getQueue();
      const task = currentQueue[id];

      if (!task) continue;

      try {
        // Execute the generic API call passed by the caller
        await apiCall(id, task.payload);

        // Success: Remove item from storage
        const updatedQueue = getQueue();
        delete updatedQueue[id];
        localStorage.setItem(queueKey, JSON.stringify(updatedQueue));

        // Optional: Small throttle
        await new Promise((r) => setTimeout(r, 50));
      } catch (err: any) {
        console.error(`[Queue: ${queueKey}] Failed for ${id}:`, err);

        // If the error is an Auth error, stop the entire queue immediately
        if (err.status === 401) break;
      }
    }
  } finally {
    isSyncing[queueKey] = false;
  }
};
