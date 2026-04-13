"use client";

import React from "react";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AlertCircle } from "lucide-react";

interface MsgProps {
  msg: React.ReactNode;
  type?: "SUCCESS" | "ERROR";
}

export const InlineMsg: React.FC<MsgProps> = ({ msg, type = "ERROR" }) => {
  const theme = useTheme();

  if (!msg) return null;

  return (
    <Typography
      variant="body3"
      component="div" // Ensures we don't nest <div> inside <p>
      sx={{
        p: theme.boxSpacing(3, 5),
        borderRadius: theme.radius[2],
        border: `1px solid ${theme.palette.gray.trans[1]}`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.gap(6),
        backgroundColor:
          type === "SUCCESS"
            ? theme.palette.info.main
            : theme.palette.info.light,
      }}>
      <AlertCircle size={20} style={{ stroke: theme.palette.primary.main }} />
      {msg}
    </Typography>
  );
};
