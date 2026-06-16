"use client";

import { IBGFadeSlideData } from "@repo/core";
import { asset } from "./assetData";

export const BG_SLIDER_DATA: IBGFadeSlideData[] = [
  {
    name: "IMAGE",
    headline: "From idea to final image",
    tagline:
      "Complete image workflow: generation, editing, and upscaling with professional control.",
    media: {
      _id: "m1",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
      type: "IMAGE",
    },
  },
  {
    name: "VIDEO",
    headline: "Direct every frame",
    tagline:
      "Video generation and editing with full creative control, start to finish.",
    media: {
      _id: "m2",
      url: asset.video,
      type: "VIDEO",
    },
  },
  {
    name: "AUDIO",
    headline: "Generate audio for your projects",
    tagline:
      "A production of music, voiceovers, and sound effects with the quality your work needs.",
    media: {
      _id: "m3",
      url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      type: "IMAGE",
    },
  },
  {
    name: "3D",
    headline: "Generate assets in 3D",
    tagline:
      "Objects, scenes, and environments ready for any of your projects.",
    media: {
      _id: "m4",
      url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
      type: "IMAGE",
    },
  },
];
