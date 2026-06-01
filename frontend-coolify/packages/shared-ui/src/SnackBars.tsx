"use client";

import React, { useEffect, useState } from "react";
import { IconButton, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { ISnackBarMsgs } from "@repo/core";
import { AppButton } from "./Buttons";
import { Info, CircleCheck, CircleAlert, X } from "lucide-react";
import { GroupTransition, Transition } from "./Transition";
import { WordTrimmer } from "./WordTrimmer";

interface SnackbarProps {
  snackBarMsg: ISnackBarMsgs;
  removeMessage: (id: string) => void;
  setSBTimer: () => void;
}

/**
 * Handles snackbar display with a stable initial width and smooth expansion.
 */
export const SnackBars = ({
  snackBarMsg,
  removeMessage,
  setSBTimer,
}: SnackbarProps) => {
  if (!snackBarMsg.messages || snackBarMsg.messages.length === 0) {
    return null;
  }
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setSBTimer();
  }, [snackBarMsg.messages, setSBTimer]);

  return (
    <Stack
      sx={{
        position: "fixed",
        width: "fit-content",
        ...(snackBarMsg.dir === "up" ? { bottom: "10px" } : { top: "10px" }),
        right: "10px",
        zIndex: 2000,
        gap: theme.gap(2),
        pointerEvents: "none",
        alignItems: "flex-end",
      }}>
      <GroupTransition>
        {snackBarMsg.messages.map((msg) => {
          return (
            <Transition
              key={msg.id}
              type="slide"
              direction={snackBarMsg.dir}
              timeout={300}>
              <Paper
                variant="elevation"
                component={motion.div}
                sx={{
                  maxWidth: isExpanded ? "450px" : "400px",
                  [theme.breakpoints.down("sm")]: {
                    maxWidth: "98%",
                  },
                  pointerEvents: "auto",
                  padding: theme.boxSpacing(6, 8),
                  display: "flex",
                  alignItems: isExpanded ? "flex-start" : "center",
                  flexDirection: "row",
                  color:
                    msg.msgStatus !== "ERROR"
                      ? theme.palette.gray[0]
                      : theme.palette.error.dark,
                  backgroundColor:
                    msg.msgStatus !== "ERROR"
                      ? theme.palette.info.main
                      : theme.palette.error.light,
                  border:
                    msg.msgStatus !== "ERROR"
                      ? "none"
                      : `1px solid ${theme.palette.error.main}`,
                  borderRadius: theme.radius[3],
                  overflow: "hidden",
                  gap: theme.gap(10),
                  "& svg": {
                    stroke:
                      msg.msgStatus !== "ERROR"
                        ? theme.palette.gray[0]
                        : theme.palette.error.main,
                    width: "24px",
                    height: "24px",
                  },
                }}>
                {!isExpanded && (
                  <Stack
                    component={motion.span}
                    sx={{ width: "24px", height: "24px", flexShrink: 0 }}>
                    {msg.icon ??
                      (msg.msgStatus === "SUCCESS" ? (
                        <CircleCheck />
                      ) : msg.msgStatus === "INFO" ? (
                        !msg.icon ? (
                          <Info />
                        ) : (
                          msg.icon
                        )
                      ) : (
                        <CircleAlert />
                      ))}
                  </Stack>
                )}

                <Stack
                  sx={{
                    gap: theme.gap(1),
                    alignItems: "flex-start",
                    width: "100%",
                  }}>
                  {msg.headline && (
                    <Typography variant="body2" sx={{ fontWeight: 501 }}>
                      {msg.headline}
                    </Typography>
                  )}

                  {msg.tagline && (
                    <WordTrimmer
                      text={msg.tagline}
                      wordLimit={8}
                      onToggleClick={() => setIsExpanded(!isExpanded)}
                      style={{
                        btn: {
                          "&:hover": {
                            color:
                              msg.msgStatus !== "ERROR"
                                ? theme.palette.primary.main
                                : theme.palette.error.main,
                          },
                        },
                      }}>
                      {msg.cta && (
                        <AppButton
                          variant="text"
                          onClick={msg.cta.action}
                          style={{
                            fontSize: "14px",
                            padding: 0,
                            borderRadius: 0,
                            minWidth: "unset",
                            alignSelf: "unset",
                            "&:hover": {
                              color: theme.palette.gray[0],
                              backgroundColor: "transparent",
                            },
                          }}>
                          {msg.cta.label}
                        </AppButton>
                      )}
                    </WordTrimmer>
                  )}

                  {msg.customContent && msg.headline}
                </Stack>

                <Stack
                  sx={{
                    height: "fit-content",
                    width: "fit-content",
                    flexShrink: 0,
                  }}>
                  {msg.hasClose && msg.id && (
                    <IconButton
                      onClick={() => removeMessage(msg.id!)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor:
                          msg.msgStatus !== "ERROR"
                            ? theme.fixedColors.pTrans
                            : theme.palette.error.trans,
                        "&:hover": {
                          backgroundColor: theme.fixedColors.grayTrans,
                        },
                      }}>
                      <X
                        style={{
                          width: "16px",
                          height: "16px",
                          stroke: `${msg.msgStatus !== "ERROR" ? theme.palette.gray[0] : theme.palette.error.main}`,
                          strokeWidth: "2px",
                        }}
                      />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            </Transition>
          );
        })}
      </GroupTransition>
    </Stack>
  );
};
