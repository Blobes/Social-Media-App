"use client";

import React from "react";
import { IsolatedMedia } from "@repo/shared-ui";
import { useMediaFileTransform } from "@repo/shared-hooks";

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
  // Convert raw browser files into compliant media list entities with tracking garbage collection
  const parsedMediaList = useMediaFileTransform({
    files: stagedFiles,
  });

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
