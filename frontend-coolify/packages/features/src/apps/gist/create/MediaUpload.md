"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { X } from "lucide-react";
import {
  MediaGrid,
  MediaScroll,
  Media,
  ProgressIcon,
  TransText,
} from "@repo/shared-ui";
import { applyBGEffects } from "@repo/helpers";
import {
  MediaProps,
  MediaProcessingProgress,
  PostStepName,
  StepperProps,
  COMMON_MEDIA,
} from "@repo/core";
import { useMisc } from "@repo/shared-hooks";

interface GistMediaUploadProps extends StepperProps<PostStepName> {
  stagedFiles: File[];
  processingStates: Record<
    string,
    { upload?: MediaProcessingProgress; compression?: MediaProcessingProgress }
  >;
  onRemoveFile: (index: number) => void;
}

/**
 * Maps raw staged browser files into media preview nodes with individual remove overlays and optimization feedback.
 */
export const GistMediaUpload: React.FC<GistMediaUploadProps> = ({
  setStep,
  stagedFiles,
  processingStates,
  onRemoveFile,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const previousUrlsRef = useRef<string[]>([]);

  // Map files to local URLs while tracking references to prevent memory bloat
  const formattedMediaList = useMemo(() => {
    previousUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));

    const newUrls: string[] = [];
    const mediaMapped = stagedFiles.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      newUrls.push(objectUrl);

      const isVideo = file.type.startsWith("video/");

      return {
        _id: `${index}-${file.name}`,
        url: objectUrl,
        type: isVideo ? "VIDEO" : "IMAGE",
        alt: file.name,
        onSingleTap: () => {
          setStep?.("MEDIA_PREVIEW");
          console.log("Reveal media modal projection for path:", objectUrl);
        },
      } as MediaProps;
    });

    previousUrlsRef.current = newUrls;
    return mediaMapped;
  }, [stagedFiles]);

  useEffect(() => {
    return () => {
      previousUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const mediaStyle = useMemo(
    () => ({
      container: {
        base: { borderRadius: theme.radius[3] },
        smallScreen: { borderRadius: 0 },
      },
      content: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
      },
    }),
    [theme],
  );

  /**
   * Evaluates if a file compression loop is active and returns the percentage markup overlay.
   */
  const renderCompressionOverlay = (file: File) => {
    const trackingId = (file as any).trackingId;
    if (!trackingId) return null;

    const compressionState = processingStates[trackingId]?.compression;
    if (!compressionState || compressionState.status === "SUCCESS") return null;

    const isIdle =
      compressionState.status === "IDLE" ||
      compressionState.status === "LOADING_ENGINE";
    const currentProgress = compressionState.progress || 0;

    return (
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          backgroundColor: theme.palette.gray.trans.overlay(0.75),
          backdropFilter: "blur(6px)",
          borderRadius: "inherit",
        }}>
        <ProgressIcon
          variant={isIdle ? "indeterminate" : "determinate"}
          value={isIdle ? undefined : currentProgress}
          style={{ width: "24px", height: "24px", flexShrink: 0 }}
        />
        <TransText
          {...COMMON_MEDIA.track_upload_progress(currentProgress)}
          sx={{
            ...theme.typography.body3,
            color: theme.fixedColors.gray50,
            fontWeight: 500,
          }}
        />
      </Box>
    );
  };

  /**
   * Helper utility rendering a floating delete choice and processing metrics directly above layout slots.
   */
  const renderWithDeleteAction = (node: React.ReactNode, index: number) => {
    const file = stagedFiles[index];
    if (!file) return null;

    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: theme.radius[3],
          overflow: "hidden",
        }}>
        {node}
        {renderCompressionOverlay(file)}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRemoveFile(index);
          }}
          sx={{
            position: "absolute",
            top: "8px",
            right: "8px",
            zIndex: 10,
            backgroundColor: theme.palette.gray.trans.overlay(0.6),
            color: theme.fixedColors.gray50,
            backdropFilter: "blur(4px)",
            padding: "6px",
            "&:hover": {
              backgroundColor: theme.palette.gray.trans.overlay(0.8),
              color: theme.palette.error.main,
            },
          }}>
          <X size={16} />
        </IconButton>
      </Box>
    );
  };

  if (stagedFiles.length === 0) return null;

  if (stagedFiles.length === 1) {
    return renderWithDeleteAction(
      <Media
        {...formattedMediaList[0]}
        style={{ container: mediaStyle.container }}
        useMedia={{ useMisc }}
      />,
      0,
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {isSmallScreen ? (
        <MediaScroll
          mediaList={formattedMediaList.map((media, idx) => ({
            ...media,
          }))}
          style={mediaStyle}
          bgEffects={() => ({
            ...applyBGEffects(theme),
            overlay: {
              children: formattedMediaList.map((_, index) =>
                renderWithDeleteAction(null, index),
              ),
            },
          })}
        />
      ) : (
        <MediaGrid
          mediaList={formattedMediaList.map((media, index) => ({
            ...media,
            // Inject individual item card updates within layout generation
            customContainerWrapper: (node: React.ReactNode) =>
              renderWithDeleteAction(node, index),
          }))}
          style={mediaStyle}
          bgEffects={() => ({
            ...applyBGEffects(theme),
            zoom: (selector: string) => ({
              ...applyBGEffects(theme).zoom(selector),
              "& .MuiImageListItem-item": {
                position: "relative",
              },
            }),
          })}
        />
      )}
    </Box>
  );
};
