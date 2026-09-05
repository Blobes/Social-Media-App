"use client";

import React, { useMemo, useState } from "react";
import { useTheme, styled } from "@mui/material/styles";
import { Box } from "@mui/material";
import Image from "next/image";
import { Blurhash } from "react-blurhash";
import {
  AnalyzedImage,
  IMedia,
  MediaStyle,
  ColorType,
  FontType,
} from "@repo/core";
import { analyzeImage } from "@repo/helpers";
import { COLOR_CONFIGS, useMisc } from "@repo/shared-hooks";
import { VideoMedia } from "./VideoMedia";

export interface RendererProps {
  media: IMedia;
  excludeBlurHash?: boolean;
  width?: `${number}` | number;
  height?: `${number}` | number;
  style?: MediaStyle;
}

export const MediaRenderer = ({
  media,
  excludeBlurHash = false,
  width,
  height,
  style,
}: RendererProps) => {
  const { isDesktop } = useMisc();
  const theme = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [analyzedImg, setAnalyzedImg] = useState<AnalyzedImage>();

  const { _id, url, type, alt, dimensions, blurHash, thumbnailUrl } = media;
  const mediaType = type ?? "IMAGE";
  const {
    width: mediaWidth,
    height: mediaHeight,
    aspectRatio,
  } = dimensions || {};

  const isPortrait = useMemo(() => {
    if (aspectRatio !== undefined) return aspectRatio < 1;
    if (mediaHeight && mediaWidth) return mediaHeight > mediaWidth;
    return analyzedImg?.isPortrait;
  }, [aspectRatio, mediaHeight, mediaWidth]);

  // Handles the image load event to check dimensions only if metadata was insufficient.
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true);

    if (aspectRatio !== undefined || (mediaHeight && mediaWidth)) return;
    const img = e.currentTarget;
    const analyzed = analyzeImage(img);
    if (analyzed && analyzed !== analyzedImg) {
      setAnalyzedImg(analyzed);
    }
  };

  // Your existing dynamic style logic
  const contentStyle = {
    height: isPortrait ? (style?.content?.height ?? "80svh") : "auto",
    width: isPortrait ? "auto" : "100%",
    maxHeight: style?.content?.maxHeight ?? "80svh",
    maxWidth: "100%",
    objectFit: "contain" as const,
    zIndex: 4,
    position: "relative" as const,
    transition: "opacity 0.4s ease-in-out",
    opacity: isLoaded ? 1 : 0,
    // Responsive Breakpoints
    ...(!isDesktop && {
      width: "100%",
      height: isPortrait ? (style?.content?.height ?? "auto") : "unset",
      maxHeight: isPortrait ? (style?.content?.maxHeight ?? "none") : "60svh",
    }),
    ...(style?.content as React.CSSProperties),
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
      }}
    >
      {/* 1. Optimized Blurred Background */}
      {!excludeBlurHash &&
        (blurHash ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              filter: "blur(48px)",
              transform: "scale(1.1)", // Prevents white edges
            }}
          >
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
              filter: "blur(48px)",
              opacity: 0.6, // Slightly lower opacity for better contrast
            }}
            priority={false}
          />
        ))}

      {/* 2. Main Media Content */}
      {mediaType === "IMAGE" ? (
        <Image
          src={url}
          width={width || mediaWidth || analyzedImg?.width || 0}
          height={height || mediaHeight || analyzedImg?.height || 0}
          sizes="100vw"
          loading="lazy"
          alt={alt || "Image"}
          onLoad={handleImageLoad}
          style={contentStyle}
        />
      ) : (
        <VideoMedia
          _id={_id}
          url={url}
          posterUrl={thumbnailUrl}
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

const CanvasContainer = styled(Box)({
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
});

const LayerOverlay = styled(Box)({
  position: "absolute",
  inset: 0,
  zIndex: 5,
  pointerEvents: "none",
  overflow: "hidden",
});

/**
 * Displays customized media with static text, sticker, and filter overlays applied.
 */
export const CustomizedMediaRenderer = ({ media }: RendererProps) => {
  const theme = useTheme();
  const customizations = media.customizations;

  const filter = customizations?.filter || "ORIGINAL";
  const texts = customizations?.textsOnMedia || [];
  const stickers = customizations?.stickersOnMedia || [];

  const activeFilterStyle =
    filter !== "ORIGINAL" ? filter.toLowerCase() : "none";

  return (
    <CanvasContainer>
      <MediaRenderer
        media={media}
        style={{
          content: {
            // maxHeight: "100%",
            // height: "100%",
            // width: "100%",
            // objectFit: "contain",
            filter: activeFilterStyle,
          },
          // container: {
          //   base: {
          //     width: "100%",
          //     height: "100%",
          //     backgroundColor: "transparent",
          //   },
          // },
        }}
      />

      {/* Render Text Overlays */}
      {texts.length > 0 && (
        <LayerOverlay>
          {texts.map((item) => {
            const activeColorType: ColorType = item.colorType;
            const activeFontType: FontType = item.fontType;
            const colorCfg =
              COLOR_CONFIGS[activeColorType] || COLOR_CONFIGS.SOLID_LIGHT;

            return (
              <Box
                key={item.id}
                sx={{
                  position: "absolute",
                  left: `${item.position.x}%`,
                  top: `${item.position.y}%`,
                  borderRadius: theme.radius.base,
                  padding: theme.boxSpacing(1, 3),
                  backgroundColor: colorCfg.backgroundColor,
                }}
              >
                <span
                  style={{
                    display: "block",
                    color: colorCfg.color,
                    fontFamily: activeFontType,
                    fontSize: `${item.size}px`,
                    textAlign: item.textAlign || "center",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {item.content}
                </span>
              </Box>
            );
          })}
        </LayerOverlay>
      )}

      {/* Render Sticker Overlays */}
      {stickers.length > 0 && (
        <LayerOverlay>
          {stickers.map((item) => (
            <Box
              key={item.id}
              sx={{
                position: "absolute",
                left: `${item.position.x}%`,
                top: `${item.position.y}%`,
              }}
            >
              <span
                style={{
                  fontSize: `${item.size}px`,
                  userSelect: "none",
                }}
              >
                {item.content}
              </span>
            </Box>
          ))}
        </LayerOverlay>
      )}
    </CanvasContainer>
  );
};
