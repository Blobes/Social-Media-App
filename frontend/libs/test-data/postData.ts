"use client";

import { MediaProps } from "@/components/media/SingleMedia";
import { img } from "@/assets/exported";
import { IStake } from "@/types";

export const stakeData: IStake[] = [
  {
    _id: "stake1",
    authorId: "1",
    content: "Stake 1 content",
    media: img.pic3,
    createdAt: String(new Date("2026-01-12")),
  },
  {
    _id: "stake2",
    authorId: "2",
    content: "Stake 2 content",
    media: img.pic4,
    createdAt: String(new Date("2025-03-12")),
  },
  {
    _id: "stake3",
    authorId: "3",
    content: "Stake 3 content",
    media: img.pic1,
    createdAt: String(new Date("2025-09-12")),
  },
];

export const mediaData: MediaProps[] = [
  { src: img.pic1 },
  { src: img.pic2 },
  { src: img.video, type: "video" },
  { src: img.pic3 },
  { src: img.pic4 },
  { src: img.pic5 },
  { src: img.pic6 },
];
