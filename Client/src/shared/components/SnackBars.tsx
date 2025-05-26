"use client";

import { Box, Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import { useFeedback } from "../sharedHooks";
import { CheckCircle, Info, Warning } from "@mui/icons-material";
import { fadeIn, fadeOut, moveIn, moveOut } from "../helpers/animations";

export const FeedbackSnackBar = ({
  entryDir = "RIGHT",
}: {
  entryDir?: "LEFT" | "RIGHT";
}) => {
  const theme = useTheme();
  const { feedback } = useAppContext();
  const { useFbTimer } = useFeedback();

  //Set the feedback timer
  useFbTimer();

  if (!feedback.message.timed) return null;

  const displayMsg = feedback.message.timed;
  const anim =
    feedback.progress.seconds > 1
      ? `${fadeIn} 0.3s linear forwards, ${moveIn(
          entryDir
        )} 0.3s linear forwards`
      : `${fadeOut} 0.3s linear forwards, ${moveOut(
          entryDir
        )} 0.3s linear forwards`;

  return (
    <Paper
      variant="elevation"
      sx={{
        position: "absolute",
        top: "20px",
        right: "10px",
        zIndex: 1000,
        padding: theme.boxSpacing(8),
        display: "flex",
        alignItems: "center",
        direction: "row",
        backgroundColor:
          feedback.type === "SUCCESS"
            ? theme.palette.success.light
            : theme.palette.error.light,
        border: `1px solid ${theme.palette.gray.trans[2]}`,
        borderRadius: theme.radius[3],
        overflow: "hidden",
        gap: theme.gap(6),
        animation: anim,
      }}>
      {feedback.type === "SUCCESS" ? (
        <CheckCircle />
      ) : feedback.type === "INFO" ? (
        <Info />
      ) : (
        <Warning />
      )}
      <Typography variant="body2" sx={{ ml: 1 }}>
        {displayMsg}
      </Typography>
      {feedback.message.timed && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 2,
            width: `${feedback.progress.width}%`,
            backgroundColor:
              feedback.type === "SUCCESS"
                ? theme.palette.success.main
                : theme.palette.error.main,
            transition: "width 1s linear",
          }}
        />
      )}
    </Paper>
  );
};
