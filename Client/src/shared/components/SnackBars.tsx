"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import { useEffect } from "react";
import { useHooks } from "../hooks/useHooks";
import { CheckCircle, Info, Warning } from "@mui/icons-material";
import { fadeIn, fadeOut, moveIn, moveOut } from "../helpers/animations";

type FeedbackType = {
  entryDir: "LEFT" | "RIGHT";
};

export const FeedbackSnackBar = ({ entryDir = "RIGHT" }: FeedbackType) => {
  const { feedback, setFeedback } = useAppContext();
  const { setFeedbackMessage, progressBarState } = useHooks();
  const theme = useTheme();
  let newSeconds = feedback.progressBar.seconds;

  useEffect(() => {
    if (feedback.message !== null) {
      const intervalId = setInterval(() => {
        setFeedback((prevState) => {
          newSeconds = prevState.progressBar.seconds - 1;
          const newWidth = prevState.progressBar.width - 40;
          if (newSeconds < 1) {
            setTimeout(() => {
              setFeedbackMessage(null, null, 0);
              clearInterval(intervalId);
              return progressBarState(5, 100, prevState); // Reset the progress bar state with the previous state of the setFeedback function
            }, 300);
          }
          return progressBarState(newSeconds, newWidth, prevState); // Set the new state with the given values and the previous state of the setFeedback state update function
        });
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [feedback.message]);

  return (
    <Paper
      variant="elevation"
      sx={{
        position: "absolute",
        top: "20px",
        right: "10px",
        zIndex: 1000,
        padding: theme.boxSpacing(8, 8),
        backgroundColor:
          feedback.type === "SUCCESS"
            ? theme.palette.success.light
            : theme.palette.error.light,
        border: `1px solid ${theme.palette.gray.trans[2]}`,
        borderRadius: theme.radius[3],
        overflow: "hidden",
        display: "flex",
        direction: "row",
        gap: theme.gap(6),
        animation:
          newSeconds < 1
            ? `${fadeOut} 0.3s linear, ${moveOut(entryDir)} 0.3s linear`
            : `${fadeIn} 0.3s linear forwards, ${moveIn(
                entryDir
              )} 0.3s linear forwards`,
      }}>
      {feedback.type === "SUCCESS" ? (
        <CheckCircle sx={{ scale: 0.75 }} />
      ) : feedback.type === "INFO" ? (
        <Info sx={{ scale: 0.8 }} />
      ) : (
        <Warning sx={{ scale: 0.8 }} />
      )}
      <Typography variant="body2">{feedback.message}</Typography>
      <Box
        sx={{
          width: `${feedback.progressBar.width}%`,
          height: "1.5px",
          position: "absolute",
          bottom: "0px",
          left: "0px",
          backgroundColor:
            feedback.type === "SUCCESS"
              ? theme.palette.success.main
              : theme.palette.error.main,
          transition: feedback.message ? "width 2s linear 0s" : "unset",
        }}></Box>
    </Paper>
  );
};
