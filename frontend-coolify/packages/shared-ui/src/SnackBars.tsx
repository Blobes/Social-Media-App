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
      component={motion.div}
      layout
      transition={{ type: "tween" }}
      sx={{
        position: "fixed",
        ...(snackBarMsg.dir === "up" ? { bottom: "10px" } : { top: "10px" }),
        right: "10px",
        zIndex: 2000,
        width: "94%",
        [theme.breakpoints.up("sm")]: {
          maxWidth: isExpanded ? "400px" : "350px",
        },
        gap: theme.gap(2),
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
                sx={{
                  width: "100%",
                  padding: theme.boxSpacing(6, 8),
                  display: "flex",
                  alignItems: "center",
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
                  <motion.span
                    layout="position"
                    style={{ width: "24px", height: "24px" }}>
                    {msg.icon ??
                      (msg.msgStatus === "SUCCESS" ? (
                        <CircleCheck />
                      ) : msg.msgStatus === "INFO" ? (
                        <Info />
                      ) : (
                        <CircleAlert />
                      ))}
                  </motion.span>
                )}

                <Stack
                  sx={{
                    gap: theme.gap(1),
                    alignItems: "flex-start",
                    width: "100%",
                  }}>
                  {msg.headline && (
                    <Typography
                      component={motion.span}
                      layout="position"
                      variant="body2"
                      sx={{ fontWeight: 501 }}>
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
                </Stack>

                {/* Close element */}
                <motion.span
                  layout="position"
                  style={{ height: "fit-content", width: "fit-content" }}>
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
                          width: "14px",
                          height: "14px",
                          stroke: `${msg.msgStatus !== "ERROR" ? theme.palette.gray[0] : theme.palette.error.main}`,
                          strokeWidth: "2px",
                        }}
                      />
                    </IconButton>
                  )}
                </motion.span>
              </Paper>
            </Transition>
          );
        })}
      </GroupTransition>
    </Stack>
  );
};
