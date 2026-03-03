"use client"

import { formatDate } from "@repo/helpers";
import { DateType } from "@repo/types";
import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import { useMemo } from "react";

interface SmartDateProps extends Omit<TypographyProps, "children"> {
    timestamp: string | number;
    dateType?: DateType;
    adaptiveTime: (time: string | number) => string
}

export const SmartDate = ({ timestamp, dateType = "shortened", adaptiveTime, ...props }: SmartDateProps) => {
    const shortened = dateType === "SHORTENED"
    // Use our adaptive hook
    const display = adaptiveTime(timestamp);

    // If the user wants the "complete" version, we skip the hook and just memoize
    const date = useMemo(() => {
        return !shortened ? formatDate(timestamp, dateType) : null;
    }, [timestamp, dateType]);

    return (
        <Typography
            title={formatDate(timestamp, dateType)}
            {...props}>
            {!shortened ? date : display}
        </Typography>
    );
};