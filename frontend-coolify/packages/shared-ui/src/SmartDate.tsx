"use client";

import React, { useMemo } from "react";
import { formatDate } from "@repo/helpers";
import { DateType } from "@repo/core";
import type { SxProps } from "@mui/material";
import { Theme, useTheme } from "@mui/material/styles";
import { TransText } from "./Text";

interface SmartDateProps {
  timestamp: string | number;
  dateType?: DateType;
  adaptiveTime: (time: string | number) => string;
  suffix?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const SmartDate = ({
  timestamp,
  dateType = "SHORTENED",
  adaptiveTime,
  suffix,
  sx,
  ...props
}: SmartDateProps) => {
  const shortened = dateType === "SHORTENED";
  const display = adaptiveTime(timestamp);
  const theme = useTheme();

  // If the user wants the "complete" version, we skip the hook and just memoize
  const date = useMemo(() => {
    return !shortened ? formatDate(timestamp, dateType) : null;
  }, [timestamp, dateType]);

  return (
    <TransText
      // component="span"
      /*title={formatDate(timestamp, dateType)}*/ sx={{
        display: "inline-flex",
        flex: "none",
        gap: theme.gap(2),
        ...sx,
      }}
      {...props}>
      {!shortened ? date : display} {suffix && suffix}
    </TransText>
  );
};
