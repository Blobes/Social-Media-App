"use client";

import React, { useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import { VideoMedia } from "./VideoMedia";
import { AnalyzedImage, IMedia, MediaStyle, UseMedia } from "@repo/core";
import { analyzeImage } from "@repo/helpers";

export interface RendererProps {
  media: IMedia;
  style?: MediaStyle;
  useRender?: UseMedia;
}

export const MediaRenderer = ({ media, style, useRender }: RendererProps) => {
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [analyzedImg, setAnalyzedImg] = useState<AnalyzedImage>();

  const { _id, url, type, alt, dimensions, blurHash } = media;
  const mediaType = type ?? "IMAGE";
  const { width, height, aspectRatio } = dimensions || {};

  const isPortrait = useMemo(() => {
    if (aspectRatio !== undefined) return aspectRatio < 1;
    if (height && width) return height > width;
    return analyzedImg?.isPortrait;
  }, [aspectRatio, height, width]);

  // Handles the image load event to check dimensions only if metadata was insufficient.
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);

    if (aspectRatio !== undefined || (height && width)) return;
    const img = e.currentTarget;
    const analyzed = analyzeImage(img);
    if (analyzed && analyzed !== analyzedImg) {
      setAnalyzedImg(analyzed);
    }
  };

  const isDesktop = useRender?.useMisc ? useRender.useMisc().isDesktop : true;

  // Your existing dynamic style logic
  const contentStyle = {
    height: isPortrait ? "80svh" : "auto",
    width: isPortrait ? "auto" : "100%",
    maxHeight: "80svh",
    maxWidth: "100%",
    objectFit: "contain" as const,
    zIndex: 4,
    position: "relative" as const,
    transition: "opacity 0.4s ease-in-out",
    opacity: isLoaded ? 1 : 0,
    // Responsive Breakpoints
    ...(!isDesktop && {
      width: "100%",
      height: isPortrait ? "auto" : "unset",
      maxHeight: isPortrait ? "none" : "60svh",
    }),
    ...style?.content,
  };

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: theme.palette.gray?.trans?.[1] || "grey.200",
        cursor: "pointer",
        // Maintain aspect ratio container if dimensions exist to prevent CLS
        aspectRatio: dimensions?.aspectRatio
          ? `${dimensions.aspectRatio}`
          : "auto",
        ...style?.container?.base,
        [theme.breakpoints.down("md")]: {
          ...style?.container?.smallScreen,
        },
      }}>
      {/* 1. Optimized Blurred Background */}
      {blurHash ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            filter: "blur(8px)",
            transform: "scale(1.1)", // Prevents white edges
          }}>
          <Blurhash
            hash={blurHash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
          />
        </Box>
      ) : (
        <Image
          src={url}
          alt=""
          fill
          style={{
            objectFit: "cover",
            filter: "blur(8px)",
            opacity: 0.6, // Slightly lower opacity for better contrast
          }}
          priority={false}
        />
      )}

      {/* 2. Main Media Content */}
      {mediaType === "IMAGE" ? (
        <Image
          src={url}
          width={dimensions?.width || analyzedImg?.width}
          height={dimensions?.height || analyzedImg?.height}
          sizes="100vw"
          loading="lazy"
          alt={alt || "Post image"}
          onLoad={handleImageLoad}
          style={contentStyle}
        />
      ) : (
        <VideoMedia
          _id={_id}
          url={url}
          autoPlay
          loop
          muted
          playsInline
          controls
          setIsLoaded={setIsLoaded}
          style={contentStyle}
        />
      )}
    </Box>
  );
};
