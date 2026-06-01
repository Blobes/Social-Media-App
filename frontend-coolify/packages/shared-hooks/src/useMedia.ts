"use client";

import { useState, useEffect } from "react";
import { MediaUploadProgress } from "@repo/core";

/**
 * Subscribes to global window events tracking local compression loops and network storage uploads.
 */
export const useMediaUploadProgress = (files: File[]) => {
  const [uploadStates, setUploadStates] = useState<
    Record<string, MediaUploadProgress>
  >({});

  useEffect(() => {
    const activeListeners: Array<{
      eventName: string;
      handler: (e: Event) => void;
    }> = [];

    // Pre-initialize tracking states for newly appended files in a single pass
    setUploadStates((prev) => {
      let currentMapHasChanges = false;
      const updatedMap = { ...prev };

      files.forEach((file) => {
        const trackingId = (file as any).trackingId;
        if (trackingId && !updatedMap[trackingId]) {
          updatedMap[trackingId] = {
            fileName: file.name,
            status: "IDLE",
            progress: 0,
          };
          currentMapHasChanges = true;
        }
      });

      return currentMapHasChanges ? updatedMap : prev;
    });

    // Attach native event listeners to capture generalized media pipeline milestones
    files.forEach((file) => {
      const trackingId = (file as any).trackingId;
      if (!trackingId) return;

      const eventName = `media-progress-${trackingId}`;
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent<MediaUploadProgress>;
        const { fileName, status, progress, error } = customEvent.detail;

        setUploadStates((prev) => ({
          ...prev,
          [trackingId]: { fileName, status, progress, error },
        }));
      };

      window.addEventListener(eventName, handler);
      activeListeners.push({ eventName, handler });
    });

    return () => {
      activeListeners.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, [files]);

  return { uploadStates };
};
