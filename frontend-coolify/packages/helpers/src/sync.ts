"use client";

import { QueueItem } from "@repo/core";

/**
 * Generic helper to manage pending/optimistic states in localStorage
 */
export const queueItem = <T extends QueueItem>(
  key: string,
  id: string,
  item: T,
) => {
  if (typeof window === "undefined") return;
  const queue = JSON.parse(localStorage.getItem(key) || "{}");
  queue[id] = {
    newValue: item.newValue,
    prevValue: item.prevValue,
    timestamp: Date.now(),
  } as T;
  localStorage.setItem(key, JSON.stringify(queue));
};

export const getQueueItem = <T extends QueueItem>(
  key: string,
  id: string,
): T | null => {
  if (typeof window === "undefined") return null;
  const queue = JSON.parse(localStorage.getItem(key) || "{}");
  return (queue[id] as T) ?? null;
};

export const removeQueueItem = (key: string, id: string) => {
  if (typeof window === "undefined") return;
  const queue = JSON.parse(localStorage.getItem(key) || "{}");
  if (queue[id] !== undefined) {
    delete queue[id];
    localStorage.setItem(key, JSON.stringify(queue));
  }
};

const getOrSetQueue = (key: string) => {
  if (typeof window === "undefined") return null;

  let queue = JSON.parse(localStorage.getItem(key) || "{}");
  const len = Object.keys(queue).length;
  if (len > 0) return queue;

  localStorage.setItem(key, JSON.stringify({}));
  queue = JSON.parse(localStorage.getItem(key) || "{}");
  return queue;
};

let isSyncing: Record<string, boolean> = {}; // Track sync status per queue key

export const processQueue = async <T extends QueueItem>(
  authStatus: string,
  key: string,
  apiCall: (id: string) => Promise<void>,
) => {
  // Guards: Don't sync if unauthorized or if THIS specific queue is already running
  if (isSyncing[key] || authStatus !== "AUTHENTICATED") return;

  const items = Object.keys(getOrSetQueue(key));
  if (!items.length) return;

  isSyncing[key] = true;

  try {
    for (const id of items) {
      const currentQueue = getOrSetQueue(key);
      const task: T = currentQueue[id];

      if (!task || task.newValue === task.prevValue) {
        removeQueueItem(key, id);
        continue;
      }

      try {
        await apiCall(id);
        // Success: Remove item from storage
        removeQueueItem(key, id);
        await new Promise((r) => setTimeout(r, 50));
      } catch (err: any) {
        console.error(`[Queue: ${key}] Failed for ${id}:`, err);
        if (err.status === 401) break;
      }
    }
  } finally {
    isSyncing[key] = false;
  }
};
