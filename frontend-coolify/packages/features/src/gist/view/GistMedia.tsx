"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { useImageColors, useMisc } from "@repo/shared-state";
import { GalleryProps, MediaGallery, Media } from "@repo/shared-ui";
import { useCallback, useMemo } from "react";
import { applyBGEffects } from "@repo/helpers";
import { IGist, UIMode } from "@repo/core";
import { GistMediaView } from "./GMediaView";

export interface GistMediaProps extends GalleryProps {
  handleLike: () => void;
  gist: IGist;
  mode: UIMode;
  isLiking: boolean;
}

export const GistMedia = ({
  mediaList,
  style,
  handleLike,
  gist,
  mode,
  isLiking,
}: GistMediaProps) => {
  const theme = useTheme();
  const { openModal, closeModal } = useMisc();

  const mediaStyle = useMemo(
    () => ({
      container: {
        base: { borderRadius: theme.radius[3] },
        smallScreen: { borderRadius: 0 },
        ...style?.container,
      },
      content: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style?.content,
      },
    }),
    [style],
  );

  const handleMedia = useCallback(
    (index?: number) => {
      if (!index) return;
      openModal({
        content: (
          <GistMediaView
            gist={gist}
            like={{ handleLike: handleLike, isLiking }}
            initialIndex={index}
            mode={mode}
          />
        ),
        onClose: closeModal,
      });
    },
    [openModal],
  );

  const mappedList = useMemo(() => {
    return mediaList.map((media, index) => {
      const mediaId = media._id || `${index}-${media.url}`;
      return {
        ...media,
        id: mediaId,
        onSingleTap: () => handleMedia(index),
        ...(!gist.likedByMe && { onDoubleTap: handleLike }),
      };
    });
  }, [mediaList, handleMedia]);

  const singleMedia = mappedList[0];

  return mediaList.length < 2 ? (
    <Media
      {...singleMedia}
      style={{ container: mediaStyle.container }}
      useMedia={{ useImageColors, useMisc }}
    />
  ) : (
    <MediaGallery
      mediaList={mappedList}
      style={{ ...mediaStyle }}
      bgEffects={applyBGEffects}
    />
  );
};
