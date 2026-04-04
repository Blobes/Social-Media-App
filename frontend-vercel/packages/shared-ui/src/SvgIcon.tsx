"use client";

import React, { useEffect, useState } from "react";
import { Box, BoxProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ProgressIcon } from "./LoadingUIs";

interface SVGIconProps extends BoxProps {
    src: any;
    color?: string; // If provided, it forces the whole icon to this color
    size?: number | string;
    preserveColor?: boolean; // New prop: set to true for multi-color SVGs
}

export const SVGIcon = ({
    src,
    color,
    size = 24,
    preserveColor = false,
    sx,
    ...props
}: SVGIconProps) => {
    const [svgContent, setSvgContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const theme = useTheme();

    const url = typeof src === "object" ? src.src : src;

    useEffect(() => {
        if (!url) return;
        setLoading(true);
        fetch(url)
            .then((res) => res.text())
            .then((text) => {
                let cleaned = text
                    .replace(/width=".*?"/, 'width="100%"')
                    .replace(/height=".*?"/, 'height="100%"');

                // ONLY replace fills if we aren't preserving colors
                // and if a specific color was requested.
                if (!preserveColor && color) {
                    cleaned = cleaned.replace(/fill=".*?"/g, `fill="currentColor"`);
                }
                setSvgContent(cleaned);
                setLoading(false);
            })
            .catch((err) => {
                console.error("SVG Load Error:", err);
                setLoading(false);
            });
    }, [url, preserveColor, color]);

    const boxStyles = {
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: color || "inherit",
        "& svg": {
            width: "100%",
            height: "100%",
            display: "block",
            stroke: "none",
        },
        ...sx,
    };

    if (loading) {
        return (
            <Box {...props} sx={{
                backgroundColor: theme.palette.gray.trans[1],
                borderRadius: theme.radius.full,
                ...boxStyles
            }}>
                <ProgressIcon />
            </Box>
        );
    }

    return (
        <Box
            {...props}
            sx={boxStyles}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
};