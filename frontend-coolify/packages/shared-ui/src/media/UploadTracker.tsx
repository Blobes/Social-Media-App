import { Stack, Typography } from "@mui/material";
import { MediaProcessingProgress } from "@repo/core";
import { ProgressIcon } from "../LoadingUIs";

interface UploadTrackerProps {
  uploadStates: Record<string, MediaProcessingProgress>;
}
/**
 * Renders real-time media upload metrics directly inside the shared snackbar container.
 */
export const MediaUploadTracker: React.FC<UploadTrackerProps> = ({
  uploadStates,
}) => {
  return (
    <Stack sx={{ gap: "8px", minWidth: "240px" }}>
      {Object.entries(uploadStates).map(([trackingId, state]) => {
        const status = state.status;
        return (
          <Stack
            key={trackingId}
            sx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}>
            <Typography variant="body3" sx={{ color: "inherit" }}>
              <strong>{state.fileName || "File"}:</strong>{" "}
              {status === "UPLOADING"
                ? "uploading in progress"
                : status === "SUCCESS"
                  ? "successfully uploaded"
                  : state.error || "failed, something went wrong"}
            </Typography>
            <ProgressIcon
              variant="determinate"
              value={state.progress}
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
            />
          </Stack>
        );
      })}
    </Stack>
  );
};
