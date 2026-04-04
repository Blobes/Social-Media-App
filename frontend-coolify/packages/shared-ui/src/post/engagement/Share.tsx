"use client"

import { IconButton, SxProps, Theme } from "@mui/material";
import { Send } from "lucide-react";

export interface ShareProps {
    onClick?: () => void;
    size?: number;
    sx?: SxProps<Theme>;
}

export const ShareButton = ({ onClick, size = 24, sx }: ShareProps) => (
    <IconButton
        onClick={onClick}
        sx={{
            padding: 0,
            transition: "transform 0.2s ease-in-out",
            "&:hover": { transform: "scale(1.1)", background: "none" },
            ...sx
        }} >
        <Send size={size} />
    </IconButton>
);