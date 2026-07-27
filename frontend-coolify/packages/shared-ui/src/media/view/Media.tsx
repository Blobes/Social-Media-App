"use client";

import React from "react";
import { ElementTap } from "../../ElementTap";
import { CustomizedMediaRenderer, MediaRenderer } from "./MediaRenderer";
import { MediaProps } from "@repo/core";

export const Media = (props: MediaProps) => {
  const {
    url,
    onSingleTap,
    onDoubleTap,
    includeCustomizations = false,
    style,
    ...mediaData
  } = props;

  return (
    <ElementTap
      onSingleTap={() => onSingleTap && onSingleTap(props)}
      onDoubleTap={() => onDoubleTap && onDoubleTap(props)}>
      {includeCustomizations && mediaData.customizations ? (
        <CustomizedMediaRenderer media={{ ...mediaData, url }} style={style} />
      ) : (
        <MediaRenderer media={{ ...mediaData, url }} style={style} />
      )}
    </ElementTap>
  );
};
