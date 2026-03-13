"use client"

import React, { useState } from "react";
import { Typography, Button, SxProps, Theme, Box } from "@mui/material";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { AppButton } from "../Buttons";

interface CaptionProps {
    caption: string;
    limit?: number;
    sx?: SxProps<Theme>;
}

export const PostCaption = ({ caption, limit = 150, sx }: CaptionProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const isTrimmable = caption.length > limit;

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    if (!caption) return null;

    return (
        <Box sx={{
            width: "100%", ...sx
        }}>
            <LayoutGroup>
                <Typography
                    variant="body2"
                    component={motion.p} // Animated paragraph
                    layout
                    sx={{
                        color: "text.primary",
                        lineHeight: 1.6,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        display: "inline", // Core fix for inline flow
                    }}
                >
                    {/* Base Text */}
                    <motion.span layout>
                        {!isExpanded && isTrimmable
                            ? `${caption.substring(0, limit)}...`
                            : caption}
                    </motion.span>

                    {/* Inline Action Button */}
                    {isTrimmable && (
                        <motion.span layout style={{ display: "inline-block", marginLeft: "4px" }}>
                            <AppButton
                                onClick={toggleExpand}
                                size="small"
                                disableRipple
                                sx={{
                                    p: 0,
                                    minWidth: "auto",
                                    fontSize: "inherit", // Matches Typography size exactly
                                    fontFamily: "inherit",
                                    textTransform: "none",
                                    fontWeight: 700,
                                    color: "primary.main",
                                    verticalAlign: "baseline", // Aligns with text bottom
                                    "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                                }}
                            >
                                {isExpanded ? "Show less" : "Show more"}
                            </AppButton>
                        </motion.span>
                    )}
                </Typography>
            </LayoutGroup>
        </Box>
    );
};