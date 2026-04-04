"use client"

import { MediaProps } from "../../../_types";
import { DoubleTap } from "../DoubleTap";
import { MediaRenderer } from "./MediaRenderer";


export const Media = (props: MediaProps) => {
    const { url, onSingleTap, onDoubleTap, useMedia,
        style, ...mediaData } = props;


    return (
        <DoubleTap
            onSingleTap={() => onSingleTap && onSingleTap(props)}
            onDoubleTap={() => onDoubleTap && onDoubleTap(props)}
        >
            <MediaRenderer
                media={{ ...mediaData, url }}
                style={style}
                useRender={useMedia}
            />
        </DoubleTap>
    );
};