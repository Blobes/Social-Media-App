"use client";

import React from "react";
import { useTheme } from "@mui/material/styles";
import { useMisc } from "@repo/shared-hooks";
import { GalleryProps, MediaGrid, Media } from "@repo/shared-ui";
import { useCallback, useMemo } from "react";
import { applyBGEffects } from "@repo/helpers";
import { IGist, UIMode } from "@repo/core";
import { GistMediaView } from "./GistMediaView";

export interface LikeState {
  likedByMe: boolean;
  likeCount: number;
  isLiking: boolean;
  handleLike: () => void;
  canInteract?: () => boolean;
}

export interface GistMediaProps extends GalleryProps {
  gist: IGist;
  mode: UIMode;
  likeState: LikeState;
}

export const GistMedia = ({
  mediaList,
  style,
  likeState,
  gist,
  mode,
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
      if (index === undefined || index === null) return;
      openModal({
        content: (
          <GistMediaView
            gist={gist}
            mediaList={mediaList}
            likeState={likeState}
            initialIndex={index}
            mode={mode}
          />
        ),
        onClose: closeModal,
      });
    },
    [openModal, closeModal, gist, mediaList, likeState, mode],
  );

  const mappedList = useMemo(() => {
    return mediaList.map((media, index) => {
      const mediaId = media._id || `${index}-${media.url}`;
      return {
        ...media,
        id: mediaId,
        onSingleTap: () => handleMedia(index),
        onDoubleTap: () => {
          if (!likeState.likedByMe && !likeState.isLiking) {
            likeState.handleLike();
          }
        },
      };
    });
  }, [mediaList, handleMedia, gist.likedByMe, likeState]);

  const singleMedia = mappedList[0];

  return mediaList.length < 2 ? (
    <Media
      {...singleMedia}
      style={{ container: mediaStyle.container }}
      useMedia={{ useMisc }}
    />
  ) : (
    <MediaGrid
      mediaList={mappedList}
      style={{ ...mediaStyle }}
      bgEffects={applyBGEffects}
    />
  );
};
