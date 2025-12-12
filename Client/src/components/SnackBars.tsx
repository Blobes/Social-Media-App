"use client";

import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useSharedHooks } from "../hooks";
import { CheckCircle, Close, Info, Warning } from "@mui/icons-material";
import {
  fadeIn,
  fadeOut,
  moveIn,
  moveOut,
  shrinkWidth,
} from "../helpers/animations";
import { SnackBarMsg } from "@/types";
import { AppButton } from "./Buttons";

interface SnackBarProps {
  entryDir?: "LEFT" | "RIGHT";
  snackBarMsg: SnackBarMsg;
}

export const SnackBars = ({
  entryDir = "RIGHT",
  snackBarMsg,
}: SnackBarProps) => {
  const theme = useTheme();
  const { setSBTimer, removeMessage } = useSharedHooks();

  if (!snackBarMsg.messgages || snackBarMsg.messgages.length === 0) return null;

  return (
    <>
      {snackBarMsg.messgages.map((msg, i) => {
        const isTimed = msg.behavior === "TIMED";

        //Set the snackbar timer
        setSBTimer();

        const progressDur = msg.duration
          ? msg.duration
          : snackBarMsg.defaultDur;

        const boxAnimation =
          progressDur > 0
            ? `${fadeIn} 0.3s linear forwards, ${moveIn(
                entryDir
              )} 0.3s linear forwards`
            : `${fadeOut} 0.3s linear forwards, ${moveOut(
                entryDir
              )} 0.3s linear forwards`;

        const progressWidthAnim = `${shrinkWidth} ${progressDur}s linear forwards`;

        return (
          <Paper
            key={i}
            variant="elevation"
            sx={{
              position: "absolute",
              top: `${20 + i * 80}px`, // offset for multiple snackbars
              right: "10px",
              zIndex: 1000,
              padding: theme.boxSpacing(8),
              display: "flex",
              alignItems: "flex-start",
              flexDirection: "row",
              backgroundColor:
                msg.msgStatus === "SUCCESS"
                  ? theme.palette.success.light
                  : msg.msgStatus === "INFO"
                  ? theme.palette.info.light
                  : theme.palette.error.light,
              border: `1px solid ${theme.palette.gray.trans[2]}`,
              borderRadius: theme.radius[3],
              overflow: "hidden",
              gap: theme.gap(10),
              animation: isTimed ? boxAnimation : "none",
            }}>
            {msg.msgStatus === "SUCCESS" ? (
              <CheckCircle sx={{ fill: theme.palette.success.main }} />
            ) : msg.msgStatus === "INFO" ? (
              <Info />
            ) : (
              <Warning />
            )}

            <Stack sx={{ gap: theme.gap(2), alignItems: "flex-start" }}>
              {msg.title && (
                <Typography
                  variant="body1"
                  sx={{ maxWidth: "360px", fontWeight: 500 }}>
                  {msg.title}
                </Typography>
              )}
              {msg.content && (
                <Typography variant="body2" sx={{ maxWidth: "360px" }}>
                  {msg.content}
                </Typography>
              )}
              {msg.cta && (
                <AppButton
                  style={{ fontSize: "14px", marginTop: theme.boxSpacing(8) }}
                  variant="outlined"
                  onClick={msg.cta.action}>
                  {msg.cta.label}
                </AppButton>
              )}
            </Stack>

            {msg.hasClose && msg.id && (
              <IconButton
                onClick={() => removeMessage(msg.id!)}
                sx={{ cursor: "pointer" }}>
                <Close sx={{ width: "20px", height: "20px" }} />
              </IconButton>
            )}

            {isTimed && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 2,
                  animation: progressWidthAnim,
                  backgroundColor:
                    msg.msgStatus === "SUCCESS"
                      ? theme.palette.success.main
                      : msg.msgStatus === "INFO"
                      ? theme.palette.info.main
                      : theme.palette.error.main,
                }}
              />
            )}
          </Paper>
        );
      })}
    </>
  );
};
