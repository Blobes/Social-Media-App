"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IBGFadeSlideData } from "@repo/core";
import { NamedProgressBar } from "./Controls";
import { useBGFadeCarousel } from "./useBGFade";
import { CarouselStyle } from "./Linear";
import { StaticText } from "../Localize";

interface BGFadeCarouselProps {
  slides: IBGFadeSlideData[];
  interval?: number;
  autoPlay?: boolean;
  pauseOnHover?: boolean;
  style?: CarouselStyle;
}
/**
 * Interface layout applying absolute asset opacity crossfades paired with text visibility shifts.
 */
export const BGFadeCarousel = ({
  slides,
  interval = 5000,
  autoPlay = false,
  pauseOnHover = true,
  style,
}: BGFadeCarouselProps) => {
  const theme = useTheme();
  const itemsLength = slides.length;

  const { currentIndex, isPaused, goTo, setPauseState, renderMediaAsset } =
    useBGFadeCarousel(itemsLength, interval, autoPlay);

  if (!itemsLength) return null;

  return (
    <Box
      onMouseEnter={() => pauseOnHover && setPauseState(true)}
      onMouseLeave={() => setPauseState(false)}
      onTouchStart={() => pauseOnHover && setPauseState(true)}
      onTouchEnd={() => setPauseState(false)}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",
        borderRadius: theme.radius[6],
        flex: "none",
        bgcolor: "#000000",
        ...style?.container,
      }}>
      {/* Absolute Background Layer Stack */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}>
        {slides.map((slide, idx) =>
          renderMediaAsset(slide, idx === currentIndex),
        )}
        {/* Overlay dark gradient mask to protect text readability */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.5) 100%)",
            pointerEvents: "none",
          }}
        />
      </Box>

      {/* Foreground Content Stack Layer */}
      {slides.map((slide, idx) => {
        const isSelected = idx === currentIndex;
        return (
          <Box
            key={`content-panel-${slide.media._id}`}
            sx={{
              position: "relative",
              zIndex: 5,
              width: "90%",
              maxWidth: "600px",
              padding: theme.gap(12),
              paddingBottom: theme.gap(38),
              boxSizing: "border-box",
              pointerEvents: "none",
              display: isSelected ? "flex" : "none",
              flexDirection: "column",
              gap: theme.gap?.(3) || "12px",
              color: "#ffffff",
              animation: isSelected
                ? "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                : "none",
              "@keyframes fadeInUp": {
                "0%": { opacity: 0, transform: "translateY(10px)" },
                "100%": { opacity: 1, transform: "translateY(0)" },
              },
            }}>
            <StaticText
              i18nKey="slide_headline"
              variant="h5"
              component={"h5"}
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.02em",
                fontSize: { xs: 24, sm: 24 },
                lineHeight: 1.15,
              }}>
              {slide.headline}
            </StaticText>

            <StaticText
              i18nKey="slide_tagline"
              variant="body3"
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
              }}>
              {slide.tagline}
            </StaticText>
          </Box>
        );
      })}
      {/* Integrated Overlaid Action Progress Segment */}
      <NamedProgressBar
        slides={slides}
        current={currentIndex}
        onGoTo={goTo}
        interval={interval}
        autoPlay={autoPlay && !isPaused}
        style={{
          position: "absolute",
          bottom: 28,
          left: 22,
        }}
      />
    </Box>
  );
};
