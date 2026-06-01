"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { X } from "lucide-react";
import { MediaGrid, MediaScroll, Media } from "@repo/shared-ui";
import { applyBGEffects } from "@repo/helpers";
import { MediaProps } from "@repo/core";
import { useMisc } from "@repo/shared-hooks";

interface GistMediaUploadProps {
  stagedFiles: File[];
  onRemoveFile: (index: number) => void;
}

/**
 * Maps raw staged browser files into media preview nodes with individual remove overlays.
 */
export const GistMediaUpload: React.FC<GistMediaUploadProps> = ({
  stagedFiles,
  onRemoveFile,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const previousUrlsRef = useRef<string[]>([]);

  // Map files to local URLs while tracking references to prevent memory bloat
  const formattedMediaList = useMemo(() => {
    // Revoke previous URLs before generating new ones to prevent continuous accumulation
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
          console.log("Reveal media modal projection for path:", objectUrl);
        },
      } as MediaProps;
    });

    previousUrlsRef.current = newUrls;
    return mediaMapped;
  }, [stagedFiles]);

  // Clean up remaining blob references on unmount
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
   * Helper utility rendering a floating delete choice directly above layout slots.
   */
  const renderWithDeleteAction = (node: React.ReactNode, index: number) => (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {node}
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

  if (stagedFiles.length === 0) return null;

  // Single file viewport assignment
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

  // Multi-file grid or scroll container viewports
  return (
    <Box sx={{ width: "100%" }}>
      {isSmallScreen ? (
        <MediaScroll
          mediaList={formattedMediaList.map((media, idx) => ({
            ...media,
            onSingleTap: () => {},
          }))}
          style={mediaStyle}
          bgEffects={(t: any) => ({
            ...applyBGEffects(t),
            overlay: {
              children: formattedMediaList.map((_, index) =>
                renderWithDeleteAction(null, index),
              ),
            },
          })}
        />
      ) : (
        <MediaGrid
          mediaList={formattedMediaList}
          style={mediaStyle}
          bgEffects={(t: any) => ({
            ...applyBGEffects(t),
            zoom: (selector: string) => ({
              ...applyBGEffects(t).zoom(selector),
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
