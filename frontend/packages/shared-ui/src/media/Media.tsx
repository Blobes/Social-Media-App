"use client"

import { IMedia } from "@repo/types";
import { DoubleTap } from "../DoubleTap";
import { MediaRenderer } from "./MediaRenderer";

export interface UseMedia {
    useImageColors: (src: string) => { isPortrait: boolean };
    useMisc: () => { isDesktop: boolean };
}

export interface MediaStyle {
    container?: { base?: any; smallScreen?: any };
    content?: any;
}

export interface MediaProps extends IMedia {
    style?: MediaStyle;
    onSingleTap?: (media?: IMedia) => void;
    onDoubleTap?: (media?: IMedia) => void;
    useMedia?: UseMedia;
}

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