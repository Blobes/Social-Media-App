"use client"

import { IMedia } from "@repo/types";
import { Box } from "@mui/material";
import { Play } from "lucide-react";
import { useState } from "react";

interface VideoProps extends IMedia {
    style?: any,
}

export const MediaVideo = ({ src, style, viewMode = "list" }: VideoProps) => {
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlay = () => {
        setIsPlaying(!isPlaying)
    }

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
                src={src}
                muted
                playsInline
                sx={{ ...style }} />
            {/* 2. The Play Icon Overlay */}
            {(!isPlaying || viewMode === "list") &&
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
                        // pointerEvents: "none" is CRITICAL so it doesn't block taps
                        pointerEvents: "none"
                    }} >
                    < Play size={24} style={{ stroke: "white", fill: "white", marginLeft: 4 }} />
                </Box>)
            }
        </Box>
    );
};