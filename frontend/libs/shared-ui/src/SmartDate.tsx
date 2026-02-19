"use client"

import { formatDate } from "@funstakes/helpers";
import { useAdaptiveTime } from "@funstakes/hooks";
import { DateType } from "libs/type/type";
import { Typography } from "@mui/material";
import type { TypographyProps } from "@mui/material";
import { useMemo } from "react";

interface SmartDateProps extends Omit<TypographyProps, "children"> {
    timestamp: string | number;
    dateType?: DateType; // Optional: if you want to support both
}

export const SmartDate = ({ timestamp, dateType = "shortened", ...props }: SmartDateProps) => {
    const shortened = dateType === "shortened"
    // Use our adaptive hook
    const display = useAdaptiveTime(timestamp);

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