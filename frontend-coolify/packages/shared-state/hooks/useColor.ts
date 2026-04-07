"use client";

import { useState, useEffect } from "react";
import ColorThief from "colorthief";

export const useImageColors = (imgSrc: string) => {
  const [gradient, setGradient] = useState("");
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    if (!imgSrc) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgSrc;

    img.onload = () => {
      const ColorThiefCtor = ColorThief as unknown as {
        new (): { getPalette: (image: HTMLImageElement, colorCount?: number) => number[][] };
      };
      const colorThief = new ColorThiefCtor();
      const palette = colorThief.getPalette(img, 5); // Grab 5 colors to have more options

      // Function to make a color "minimalist-friendly" (Light & Desaturated)
      const processColor = (rgb: number[]) => {
        // Simple brightening: mix with white (255, 255, 255)
        const r = Math.round((rgb[0] + 255) / 2);
        const g = Math.round((rgb[1] + 255) / 2);
        const b = Math.round((rgb[2] + 255) / 2);
        return `rgb(${r}, ${g}, ${b})`;
      };

      const filteredPalette = palette.filter(
        (color) => color[0] + color[1] + color[2] > 200,
      );
      // Pick two distinct colors from the palette
      const color1 = processColor(filteredPalette[0] || palette[0]);
      const color2 = processColor(filteredPalette[1] || palette[1]);

      setGradient(`linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`);

      // Determine image orientation
      setIsPortrait(img.naturalHeight > img.naturalWidth);
    };
  }, [imgSrc]);

  return { gradient, isPortrait };
};
