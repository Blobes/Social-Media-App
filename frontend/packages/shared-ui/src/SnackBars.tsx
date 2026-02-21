"use client";

import { IconButton, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ISnackBarMsg } from "@repo/types";
import { AppButton } from "./Buttons";
import { Info, CircleCheck, CircleAlert, X } from "lucide-react";
import { useEffect } from "react";
import { GroupTransition, Transition } from "./Transition";
import { zIndexes } from "@repo/helpers";


interface SnackbarProps {
  snackBarMsg: ISnackBarMsg;
  removeMessage: (id: number) => void;
  setSBTimer: () => void;
}

export const SnackBars = ({ snackBarMsg, removeMessage, setSBTimer }: SnackbarProps) => {
  const theme = useTheme();

  if (!snackBarMsg.messages || snackBarMsg.messages.length === 0) {
    return null
  };

  useEffect(() => {
    setSBTimer();
  }, [snackBarMsg.messages, setSBTimer]); // Dependency on the messages, not the setter

  return (
    <Stack
      sx={{
        position: "fixed",
        ...(snackBarMsg.dir === "up" ? { bottom: "10px" } : { top: "10px" }),
        right: "10px",
        zIndex: zIndexes.maximum,
        width: "94%",
        maxWidth: "400px",
        gap: theme.gap(2),
      }}
    >
      <GroupTransition>
        {snackBarMsg.messages.map((msg) => {
          return (
            <Transition
              key={msg.id}
              type="slide"
              direction={snackBarMsg.dir}
              timeout={300}
            >
              <Paper
                variant="elevation"
                sx={{
                  width: "100%",
                  padding: theme.boxSpacing(6),
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "row",
                  backgroundColor:
                    msg.msgStatus === "SUCCESS"
                      ? theme.palette.info.main
                      : theme.palette.info.light,
                  border: `1px solid ${theme.palette.gray.trans[2]}`,
                  borderRadius: theme.radius[3],
                  overflow: "hidden",
                  gap: theme.gap(10),
                  "& > svg": {
                    stroke: `${theme.palette.gray[300]}`,
                    marginTop:
                      msg.title && msg.content && msg.cta && theme.boxSpacing(4),
                    width: "28px",
                    height: "28px",
                  },
                }}>
                {msg.msgStatus === "SUCCESS" ? (
                  <CircleCheck />
                ) : msg.msgStatus === "INFO" ? (
                  <Info />
                ) : (
                  <CircleAlert />
                )}

                <Stack
                  sx={{
                    gap: theme.gap(1),
                    alignItems: "flex-start",
                    width: "100%",
                  }}>
                  {msg.title && (
                    <Typography
                      variant="body1"
                      sx={{ maxWidth: "360px", fontWeight: 600 }}>
                      {msg.title}
                    </Typography>
                  )}

                  {msg.content && (
                    <Typography variant="body2" sx={{ width: "100%" }}>{msg.content}
                      {msg.cta && (
                        <AppButton variant="text" onClick={msg.cta.action}>
                          {msg.cta.label}
                        </AppButton>
                      )}</Typography>
                  )}
                </Stack>

                {/* Close element */}
                {msg.hasClose && msg.id && (
                  <IconButton
                    onClick={() => removeMessage(msg.id!)}
                    sx={{ cursor: "pointer" }}>
                    <X style={{
                      width: "20px", height: "20px",
                      stroke: `${theme.palette.gray[300]}`
                    }} />
                  </IconButton>
                )}
              </Paper>
            </Transition>
          );
        })}
      </GroupTransition>
    </Stack>
  );
};
