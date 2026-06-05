"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { IMedia, PostStepName, StepperProps } from "@repo/core";
import { IsolatedMedia } from "@repo/shared-ui";

export interface CreatePostMediaPreviewProps {
  stagedFiles: File[];
  isDesktop?: boolean;
  initialIndex?: number;
}

/**
 * Renders an immersive isolated media preview mode for raw staged files during composition.
 */
export const CreatePostMediaPreview: React.FC<CreatePostMediaPreviewProps> = ({
  stagedFiles = [],
  isDesktop = false,
  initialIndex = 0,
}) => {
  const generatedUrlsRef = useRef<string[]>([]);

  // Convert raw browser files into compliant media list entities with tracking garbage collection
  const parsedMediaList = useMemo(() => {
    // Revoke old object URLs from past renderings to release system memory blocks
    generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const trackedUrls: string[] = [];

    const models = stagedFiles.map((file, idx) => {
      const blobedUrl = URL.createObjectURL(file);
      trackedUrls.push(blobedUrl);

      const isVideo = file.type.startsWith("video/");
      const trackingId = (file as any).trackingId || `${idx}-${file.name}`;

      return {
        _id: trackingId,
        url: blobedUrl,
        type: isVideo ? "VIDEO" : "IMAGE",
        alt: file.name,
      } as IMedia;
    });

    generatedUrlsRef.current = trackedUrls;
    return models;
  }, [stagedFiles]);

  // Ensure remaining blob references get explicitly purged from the client cache on teardown
  useEffect(() => {
    return () => {
      generatedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <IsolatedMedia
      mediaList={parsedMediaList}
      initialIndex={initialIndex}
      isDesktop={isDesktop}
      sourceType="GIST"
      style={{
        width: "100%",
        height: "100svh",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
      }}
    />
  );
};
