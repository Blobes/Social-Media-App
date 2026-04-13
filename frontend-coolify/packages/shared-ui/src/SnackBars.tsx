"use client";

import React, { useEffect, useState } from "react";
import { IconButton, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { ISnackBarMsg } from "@repo/core";
import { AppButton } from "./Buttons";
import { Info, CircleCheck, CircleAlert, X } from "lucide-react";
import { GroupTransition, Transition } from "./Transition";
import { WordTrimmer } from "./WordTrimmer";

interface SnackbarProps {
  snackBarMsg: ISnackBarMsg;
  removeMessage: (id: number) => void;
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
        zIndex: 1000,
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
                    width: "26px",
                    height: "26px",
                  },
                }}>
                {!isExpanded && (
                  <motion.span layout="position">
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
                  {msg.title && (
                    <Typography
                      component={motion.span}
                      layout="position"
                      variant="body1"
                      sx={{ fontWeight: 501 }}>
                      {msg.title}
                    </Typography>
                  )}

                  {msg.content && (
                    <WordTrimmer
                      text={msg.content}
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
                        <AppButton variant="text" onClick={msg.cta.action}>
                          {msg.cta.label}
                        </AppButton>
                      )}
                    </WordTrimmer>
                  )}
                </Stack>

                {/* Close element */}
                <motion.span layout="position">
                  {msg.hasClose && msg.id && (
                    <IconButton
                      onClick={() => removeMessage(msg.id!)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: theme.fixedColors.pTrans,
                        "&:hover": {
                          backgroundColor: theme.fixedColors.grayTrans,
                        },
                      }}>
                      <X
                        style={{
                          width: "18px",
                          height: "18px",
                          stroke: `${theme.palette.gray[0]}`,
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
