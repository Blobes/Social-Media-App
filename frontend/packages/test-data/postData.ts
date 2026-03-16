"use client";

import { img } from "@repo/assets";
import { IStake, MediaProps } from "@repo/types";

export const stakeData: IStake[] = [
  {
    _id: "stake1",
    authorId: "1",
    author: {
      _id: "1",
      username: "User1",
      firstName: "User1 First",
      lastName: "User1 Last",
      fullName: "User1 FullName",
    },
    content: "Stake 1 content",
    media: [{ _id: "1", url: img.pic3 }],
    createdAt: String(new Date("2026-01-12")),
  },
  {
    _id: "stake2",
    authorId: "2",
    author: {
      _id: "2",
      username: "User2",
      firstName: "User2 First",
      lastName: "User2 Last",
      fullName: "User2 FullName",
    },
    content: "Stake 2 content",
    media: [{ _id: "2", url: img.pic4 }],
    createdAt: String(new Date("2025-03-12")),
  },
  {
    _id: "stake3",
    authorId: "3",
    author: {
      _id: "3",
      username: "User3",
      firstName: "User3 First",
      lastName: "User3 Last",
      fullName: "User3 FullName",
    },
    content: "Stake 3 content",
    media: [{ _id: "3", url: img.pic1 }],
    createdAt: String(new Date("2025-09-12")),
  },
];

export const mediaData: MediaProps[] = [
  { _id: "media1", url: img.pic1 },
  { _id: "media2", url: img.pic2 },
  { _id: "media3", url: img.video, type: "VIDEO" },
  { _id: "media4", url: img.pic3 },
  { _id: "media5", url: img.pic4 },
  { _id: "media6", url: img.pic5 },
  { _id: "media7", url: img.pic6 },
];
