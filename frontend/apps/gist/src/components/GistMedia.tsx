"use client"

import { useTheme } from "@mui/material/styles";
import { Typography } from "@mui/material";
import { useMisc } from "@funstakes/hooks";
import { GalleryProps, MediaGallery, Media } from "@funstakes/shared-ui";
import { useCallback, useMemo } from "react";

interface GistMediaProps extends GalleryProps {
    likedByMe: boolean;
    handleLike: () => void;
}

export const GistMedia = ({ mediaList, style, likedByMe, handleLike }: GistMediaProps) => {
    const theme = useTheme();
    const { openModal } = useMisc()

    const mediaStyle = useMemo(() => ({
        container: {
            base: { borderRadius: theme.radius[3] },
            smallScreen: { borderRadius: 0 },
            ...style?.container
        },
        content: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...style?.content
        },
    }), [style]);

    const handleMedia = useCallback((id?: string) => {
        if (!id) return;
        openModal({ content: <Typography>Media id: {id}</Typography> });
    }, [openModal]);

    const mappedList = useMemo(() => {
        return mediaList.map((media, index) => {
            const mediaId = media.id || `${index}-${media.src}`;
            return {
                ...media,
                id: mediaId,
                onSingleTap: () => handleMedia(mediaId),
                ...(!likedByMe && { onDoubleTap: handleLike })
            }
        })
    }, [mediaList, handleMedia]);

    const singleMedia = mappedList[0];

    return mediaList.length < 2 ? <Media {...singleMedia}
        style={{ container: mediaStyle.container }} /> : (
        <MediaGallery mediaList={mappedList} style={{ ...mediaStyle }} />)
}