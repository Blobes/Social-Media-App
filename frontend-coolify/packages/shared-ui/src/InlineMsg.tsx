"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { AlertCircle } from "lucide-react";
import { TransText } from "./Text";

interface MsgProps {
  msg: React.ReactNode;
  type?: "SUCCESS" | "ERROR";
  scrollIntoView?: boolean;
}

export const InlineMsgUI: React.FC<MsgProps> = ({
  msg,
  type = "ERROR",
  scrollIntoView = false,
}) => {
  if (!msg) return null;
  const theme = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Monitor store messages to trigger viewport positioning recalculations
  useEffect(() => {
    if (scrollIntoView) {
      scrollRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [scrollIntoView]);

  return (
    <TransText
      component="div"
      isLiveAlert
      ref={scrollRef}
      sx={{
        ...theme.typography.text4,
        width: "100%",
        padding: theme.boxSpacing(4, 5),
        borderRadius: theme.radius[3],
        border: `1px solid ${type === "SUCCESS" ? theme.palette.gray.trans[1] : theme.palette.error.trans}`,
        scrollMarginTop: theme.gap(70),
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
    </TransText>
  );
};
