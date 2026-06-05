"use client";

import React from "react";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AlertCircle } from "lucide-react";

interface MsgProps {
  msg: React.ReactNode;
  type?: "SUCCESS" | "ERROR";
}

export const InlineMsgUI: React.FC<MsgProps> = ({ msg, type = "ERROR" }) => {
  const theme = useTheme();

  if (!msg) return null;

  return (
    <Typography
      variant="body3"
      component="div" // Ensures we don't nest <div> inside <p>
      sx={{
        width: "100%",
        p: theme.boxSpacing(4, 5),
        borderRadius: theme.radius[3],
        border: `1px solid ${type === "SUCCESS" ? theme.palette.gray.trans[1] : theme.palette.error.trans}`,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: theme.gap(6),
        color:
          type === "SUCCESS"
            ? theme.palette.gray[300]
            : theme.palette.error.main,
        backgroundColor:
          type === "SUCCESS"
            ? theme.palette.info.main
            : theme.palette.error.trans,
      }}>
      <AlertCircle
        size={20}
        style={{
          stroke:
            type === "SUCCESS"
              ? theme.palette.primary.main
              : theme.palette.error.main,
        }}
      />
      {msg}
    </Typography>
  );
};
