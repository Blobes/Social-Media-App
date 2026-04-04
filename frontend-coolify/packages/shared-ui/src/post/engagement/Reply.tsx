"use client"

import { IconButton, SxProps, Theme } from "@mui/material";
import { MessageCircle } from "lucide-react";

export interface ReplyProps {
    onClick?: () => void;
    size?: number;
    sx?: SxProps<Theme>;
}

export const ReplyButton = ({ onClick, size = 24, sx }: ReplyProps) => (
    <IconButton
        onClick={onClick}
        sx={{
            padding: 0,
            borderRadius: 0,
            transition: "transform 0.3s ease-in-out",
            "&:hover": {
                transform: "scale(1.08)",
                background: "none"
            },
            ...sx
        }} >
        <MessageCircle size={size} />
    </IconButton>
);