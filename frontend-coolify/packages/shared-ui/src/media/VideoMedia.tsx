"use client"

import { IMedia } from "../../../_types";
import { Box } from "@mui/material";
import { Play } from "lucide-react";
import { useRef, useState } from "react";

interface VideoProps extends IMedia {
    style?: any,
    setIsLoaded?: (loaded: boolean) => void;
    autoPlay?: boolean;
    loop?: boolean;
    muted?: boolean;
    playsInline?: boolean;
    controls?: boolean;

}

export const VideoMedia = ({ url, setIsLoaded, style, viewMode = "LIST", ...props }: VideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(props.autoPlay || false);

    const handlePlay = (e: React.MouseEvent) => {
        // Stop propagation if this is inside a DoubleTap to avoid conflict
        e.stopPropagation();
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    return (
        <Box
            onClick={handlePlay}
            sx={{
                position: "relative",
                width: "100%",
                height: "100%"
            }}>
            {/* 1. The Video Element */}
            <Box
                component="video"
                src={url}
                muted
                playsInline
                onLoadedData={() => setIsLoaded && setIsLoaded(true)}
                {...props}
                sx={{ ...style }} />
            {/* 2. The Play Icon Overlay */}
            {(!isPlaying || viewMode === "LIST") &&
                (<Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        // Glassmorphism effect
                        bgcolor: "rgba(0, 0, 0, 0.02)",
                        borderRadius: "50%",
                        width: 44,
                        height: 44,
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        pointerEvents: "none"
                    }} >
                    < Play size={24} style={{ stroke: "white", fill: "white", marginLeft: 4 }} />
                </Box>)
            }
        </Box>
    );
};