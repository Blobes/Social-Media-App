"use client";

import React from "react";
import { ElementTap } from "../ElementTap";
import { MediaRenderer } from "./MediaRenderer";
import { MediaProps } from "@repo/core";

export const Media = (props: MediaProps) => {
  const { url, onSingleTap, onDoubleTap, useMedia, style, ...mediaData } =
    props;

  return (
    <ElementTap
      onSingleTap={() => onSingleTap && onSingleTap(props)}
      onDoubleTap={() => onDoubleTap && onDoubleTap(props)}>
      <MediaRenderer
        media={{ ...mediaData, url }}
        style={style}
        useRender={useMedia}
      />
    </ElementTap>
  );
};
