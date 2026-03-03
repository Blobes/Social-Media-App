"use client"

import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import Image from "next/image";
import { IMedia } from "@repo/types";
import { DoubleTap } from "../DoubleTap";

export interface MediaStyle {
    container?: { base?: any; smallScreen?: any };
    content?: any;
}

export interface MediaHooks {
    useImageColors: (src: string) => { isPortrait: boolean };
    useMisc: () => { isDesktop: boolean };
}

export interface MediaProps extends IMedia {
    style?: MediaStyle;
    onSingleTap?: (media?: IMedia) => void;
    onDoubleTap?: (media?: IMedia) => void;
    hooks?: MediaHooks;
}

export const Media = ({ _id, url, type, alt, onSingleTap,
    onDoubleTap, style, viewMode = "ISOLATED", dimensions, hooks }: MediaProps) => {

    const theme = useTheme();
    const mediaType = type ?? "IMAGE"

    const isPortrait = hooks?.useImageColors
        ? hooks.useImageColors(url).isPortrait
        : false; // Fallback to false (landscape/square) if no hook provided

    const isDesktop = hooks?.useMisc
        ? hooks.useMisc().isDesktop
        : true; // Fallback to true if no hook provided

    const contentStyle = {
        height: isPortrait ? "80svh" : "auto",
        width: isPortrait ? "auto" : "100%",
        maxHeight: "80svh",
        maxWidth: "100%",
        objectFit: "contain",
        zIndex: 4,
        // Responsive Breakpoints
        ...(!isDesktop && {
            width: "100%",
            height: isPortrait ? "auto" : "unset",
            maxHeight: isPortrait ? "none" : "60svh",
        }),
        ...style?.content,
    }

    return (
        <DoubleTap
            onSingleTap={() => onSingleTap && onSingleTap()}
            onDoubleTap={() => onDoubleTap && onDoubleTap()}>
            <Box
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: theme.palette.gray.trans[1],
                    cursor: "pointer",
                    ...style?.container?.base,
                    [theme.breakpoints.down("md")]: {
                        ...style?.container?.smallScreen
                    },
                }}>
                {/* Blurred backround */}
                <Image
                    src={url}
                    alt=""
                    fill
                    style={{
                        objectFit: 'cover',
                        filter: 'blur(8px)',
                        opacity: 1
                    }}
                    priority={false}
                />
                {mediaType === "IMAGE" ? (
                    < Image
                        src={url}
                        width={dimensions?.width || 0}
                        height={dimensions?.height || 0}
                        sizes="100vw"
                        loading="lazy"
                        alt={alt || "Post image"}
                        style={{ ...contentStyle }} />
                ) : (
                    <Box
                        component="video" src={url}
                        autoPlay loop muted playsInline
                        controls
                        sx={{ ...contentStyle }} />
                )}
            </Box >
        </DoubleTap >
    );
};