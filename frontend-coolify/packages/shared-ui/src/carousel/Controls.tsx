"use client";

import React from "react";
import { Box, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@mui/material/styles";

interface ArrowProps {
  onPrev: () => void;
  onNext: () => void;
}
export const CarouselArrows = ({ onPrev, onNext }: ArrowProps) => {
  const theme = useTheme();

  return (
    <>
      <IconButton
        onClick={onPrev}
        sx={{
          position: "absolute",
          left: 8,
          zIndex: 10,
          bgcolor: "rgba(255,255,255,0.3)",
        }}>
        <ChevronLeft />
      </IconButton>
      <IconButton
        onClick={onNext}
        sx={{
          position: "absolute",
          right: 8,
          zIndex: 10,
          bgcolor: "rgba(255,255,255,0.3)",
        }}>
        <ChevronRight />
      </IconButton>
    </>
  );
};

interface DotProps {
  length: number;
  current: number;
  onGoTo: (i: number) => void;
}

export const CarouselDots = ({ length, current, onGoTo }: DotProps) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 1, py: 1.5 }}>
      {Array.from({ length }).map((_, i) => (
        <Box
          key={i}
          onClick={() => onGoTo(i)}
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            cursor: "pointer",
            bgcolor:
              i === current
                ? theme.palette.primary.main
                : theme.palette.grey[400],
            transform: i === current ? "scale(1.2)" : "scale(1)",
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </Box>
  );
};
