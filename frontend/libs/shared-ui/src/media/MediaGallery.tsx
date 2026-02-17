"use client"

import { useMemo } from 'react';
import { Box, ImageList, ImageListItem, Typography } from '@mui/material';
import { MediaStyle, MediaProps } from './Media';
import { useTheme } from "@mui/material/styles";
import { useStyles } from '@funstakes/hooks';
import { DoubleTap } from '../DoubleTap';
import Image from 'next/image';
import { MediaVideo } from './MediaVideo';


export interface GalleryProps {
    mediaList: MediaProps[];
    style?: MediaStyle
}

export const MediaGallery = ({ mediaList, style }: GalleryProps) => {
    const theme = useTheme();
    const { applyBGEffects } = useStyles();

    // 1. Define patterns to ensure the 4-column grid is always full
    const LAYOUT_PATTERNS: Record<number, { cols: number; rows: number }[]> = {
        1: [{ cols: 4, rows: 2 }],
        2: [{ cols: 2, rows: 2 }, { cols: 2, rows: 2 }],
        3: [{ cols: 4, rows: 2 }, { cols: 2, rows: 1 }, { cols: 2, rows: 1 }],
        4: [{ cols: 2, rows: 2 }, { cols: 2, rows: 1 }, { cols: 2, rows: 1 },
        { cols: 4, rows: 1 }],
        5: [{ cols: 2, rows: 2 }, { cols: 2, rows: 1 }, { cols: 2, rows: 1 },
        { cols: 2, rows: 1 }, { cols: 2, rows: 1 }],
        6: [{ cols: 2, rows: 2 }, { cols: 2, rows: 1 }, { cols: 2, rows: 1 },
        { cols: 1, rows: 1 }, { cols: 1, rows: 1 }, { cols: 2, rows: 1 }],
    };

    const displayMedia = useMemo(() => {
        const mediaItems = [...mediaList].sort((a, b) =>
            (a.id || a.src).localeCompare(b.id || b.src)
        );
        const count = Math.min(mediaItems.length, 5);
        const sliced = mediaItems.slice(0, count);
        const pattern = LAYOUT_PATTERNS[count];

        return sliced.map((item, index) => ({
            ...item,
            rows: pattern[index].rows,
            cols: pattern[index].cols,
        }));

        // Only re-run if the actual list of media changes (e.g., a new post)
    }, [mediaList]);

    const remainingCount = mediaList.length - 5;

    return (
        <ImageList
            sx={{
                width: '100%',
                height: 'auto',
                borderRadius: theme.radius[2],
                overflow: 'hidden',
                bgcolor: theme.palette.gray.trans[1],
                margin: 0,
                ...style?.container?.base,
                [theme.breakpoints.down("md")]: {
                    ...style?.container?.smallScreen
                },
            }}
            variant="quilted"
            cols={4}
            rowHeight={150}>

            {displayMedia.map((media, index) => {
                const isLastItem = index === 4 && remainingCount > 0;
                const { id, src, type, title, onSingleTap, onDoubleTap, cols, rows } = media;
                const mediaType = type ?? "image";

                return (
                    <ImageListItem
                        key={id}
                        cols={cols}
                        rows={rows}
                        sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            ...applyBGEffects.zoom("& video, & img")
                        }} >
                        <DoubleTap
                            onSingleTap={() => onSingleTap && onSingleTap()}
                            onDoubleTap={() => onDoubleTap && onDoubleTap()}
                            style={{ ...(!isLastItem && applyBGEffects.overlay) }}>

                            {mediaType === "video" ? (
                                <MediaVideo src={src} style={style?.content} />
                            ) : (
                                <Image
                                    src={src}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    loading="lazy"
                                    alt={title || "Post image"}
                                    style={{ ...style?.content }} />
                            )}
                            {isLastItem && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: theme.palette.gray.trans.overlay(0.6),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: "column",
                                        zIndex: 2,
                                        padding: theme.boxSpacing(4),
                                        color: theme.fixedColors.gray50
                                    }} >
                                    <Typography variant="h6" textAlign="center">
                                        +{remainingCount}
                                    </Typography>
                                </Box>
                            )}
                        </DoubleTap>
                    </ImageListItem>
                );
            })}
        </ImageList >
    );
};