"use client";

import React from "react";
import { SxProps, Theme } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { summarizeNum } from "@repo/helpers";
import { Strip } from "@repo/shared-ui";

export interface Metric {
  label: string;
  count: number;
  plural?: string;
}

export interface MetricsProps {
  metrics: Metric[];
  sx?: SxProps<Theme>;
}

export const Metrics = ({ metrics, sx }: MetricsProps) => {
  const theme = useTheme();

  // Transform the raw metrics into the format expected by the Strip component
  const stripItems = metrics.map((item) => {
    const isPlural = item.count !== 1;
    const textLabel = isPlural ? item.plural || `${item.label}s` : item.label;

    return {
      text: ` ${textLabel}`,
      element: (
        <strong style={{ color: theme.palette.gray[300] as string }}>
          {summarizeNum(item.count)}
        </strong>
      ),
    };
  });

  if (!metrics.length) return null;

  return (
    <Strip
      items={stripItems}
      style={{
        ...theme.typography.text5,
        padding: theme.boxSpacing(4, 0),
        [theme.breakpoints.down("md")]: {
          padding: theme.boxSpacing(4, 6),
        },
        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,

        ...sx,
      }}
    />
  );
};
