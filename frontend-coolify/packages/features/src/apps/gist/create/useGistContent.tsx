"use client";

import React, {
  useState,
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  MediaUploadPayload,
  MenuRef,
  PostStepName,
  StepperProps,
  TrackedFile,
} from "@repo/core";
import { uploadMediaToCloud } from "@repo/helpers";
import {
  useGlobalStore,
  useMediaUploadProgress,
  useSnackbar,
} from "@repo/shared-hooks";
import { useMutation } from "@tanstack/react-query";
import { GistService } from "../gistService";
import { useTopics } from "../../post/hooks/useTopics";
import { MediaUploadTracker, ProgressIcon } from "@repo/shared-ui";
import { useSocketListener } from "@repo/shared-hooks"; // Assumed path for your real-time socket hook

export interface Content extends StepperProps<PostStepName> {
  caption: string;
  setCaption: (val: string) => void;
  topics: string[];
  setTopics: (val: string[]) => void;
  hasSensitiveGraphic?: boolean;
  setHasSensitiveGraphic?: (val: boolean) => void;
}

export interface FilesProps {
  stagedFiles: File[];
  setStagedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

/**
 * Handles form states, trust boundary bypass logic, and upload serialization for a Gist post.
 */
export const useGistContent = ({
  setStep,
  caption,
  setCaption,
  stagedFiles,
  setStagedFiles,
  topics,
  setTopics,
  hasSensitiveGraphic = false,
  setHasSensitiveGraphic,
}: Content & FilesProps) => {
  const { createGist } = GistService();
  const { setSBMessage, removeSBMessages } = useSnackbar();

  const topicsMenuRef = useRef<MenuRef>(null);

  // Extract the authorization user block from the global state container
  const authUser = useGlobalStore((state) => state.authUser);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inlineErrMsg, setInlineErrMsg] = useState<string | null>(null);

  // Tracks the ID of the gist currently undergoing background async moderation processing
  const [moderationTrackingId, setModerationTrackingId] = useState<
    string | null
  >(null);

  // Monitors the finalized staged files via native window listeners
  const { uploadStates } = useMediaUploadProgress(stagedFiles);

  // Integrate the isolated topic domain hook
  const topicOperations = useTopics({ topics, setTopics });

  /**
   * Listens for real-time moderation processing updates broadcasted by the backend worker architecture.
   */
  useSocketListener("GIST_STATUS_UPDATE", (data: any) => {
    if (!moderationTrackingId || data.payload?.gistId !== moderationTrackingId)
      return;

    const { status, hasSensitiveGraphic: sensitive } = data.payload;

    if (status === "PUBLISHED" || status === "SHADOWBANNED") {
      setSBMessage({
        msg: {
          msgStatus: "SUCCESS",
          headline: "Processing Complete",
          tagline:
            status === "SHADOWBANNED"
              ? "Your gist has been successfully processed."
              : "Gist published successfully.",
          behavior: "TIMED",
          duration: 5,
          hasClose: true,
        },
      });
      // Clear tracking state to close the background lifecycle session
      setModerationTrackingId(null);
    }
  });

  /**
   * Listens for real-time content violation rejections broadcasted by the backend safety pipeline.
   */
  useSocketListener("CONTENT_REJECTED", (data: any) => {
    if (!moderationTrackingId || data.postId !== moderationTrackingId) return;

    setSBMessage({
      msg: {
        msgStatus: "ERROR",
        headline: "Content Rejected",
        tagline:
          data.reason ||
          "Your content violated automated community guidelines.",
        behavior: "TIMED",
        duration: 6,
        hasClose: true,
      },
    });
    setModerationTrackingId(null);
  });

  /**
   * Dispatches validation and infrastructure failures directly to the snackbar tray.
   */
  useEffect(() => {
    if (errorMessage) {
      setSBMessage({
        msg: {
          id: `gist-err-${Date.now()}`,
          msgStatus: "ERROR",
          tagline: errorMessage || "Gist Creation Failed",
          behavior: "TIMED",
          hasClose: true,
        },
      });
    }
  }, [errorMessage, setSBMessage]);

  /**
   * Evaluates background upload stream ticks to provide real-time UI metrics via progress indicator inline injection.
   */
  useEffect(() => {
    // Shunt asset progress overlays if the hook has transitioned into background safety verification mode
    if (moderationTrackingId) return;

    const stateEntries = Object.entries(uploadStates);
    if (stateEntries.length === 0) return;
    const hasActiveUploads = stateEntries.some(
      ([_, state]) => state.status === "UPLOADING",
    );
    setSBMessage({
      msg: {
        id: "media-upload",
        msgStatus: "INFO",
        headline: "Transfer in Progress",
        customContent: <MediaUploadTracker uploadStates={uploadStates} />,
        behavior: hasActiveUploads ? "FIXED" : "TIMED",
        duration: hasActiveUploads ? undefined : 4,
      },
    });
  }, [uploadStates, moderationTrackingId, setSBMessage]);

  /**
   * Manages the persistent visibility contract for posts routed to asynchronous backend analysis workers.
   */
  useEffect(() => {
    if (!moderationTrackingId) return;

    setSBMessage({
      msg: {
        id: `moderation-${moderationTrackingId}`,
        msgStatus: "INFO",
        headline: "Verifying Content Safeties",
        behavior: "FIXED",
        customContent: (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ProgressIcon
              variant="indeterminate"
              style={{ width: "24px", height: "24px" }}
            />
            <span>Analyzing text and attachments against system rules...</span>
          </div>
        ),
      },
    });
  }, [moderationTrackingId, setSBMessage]);

  /**
   * Automatically array maps selected files with tracking IDs directly into state vectors.
   */
  const handleFileSelection = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      const filesArray = Array.from(e.target.files).map((file) => {
        const trackedFile = file as TrackedFile;
        if (!trackedFile.trackingId) {
          trackedFile.trackingId = Math.random().toString(36).substring(2, 9);
        }
        return trackedFile;
      }) as File[];

      setStagedFiles?.((prev) => [...prev, ...filesArray]);
      setErrorMessage(null);
    },
    [setStagedFiles],
  );

  /**
   * Slices out item vectors from state indexes when triggered by overlay remove elements.
   */
  const handleRemoveFile = (targetIndex: number) => {
    setStagedFiles((prev) => prev.filter((_, index) => index !== targetIndex));
  };

  /**
   * TanStack Query mutation configuration handling asset extraction and remote record entry.
   */
  const userHasFlags = authUser?.hasFlaggedPost ?? false;
  const userWindowCount = authUser?.postCountWindow ?? 0;
  const skipModeration = !userHasFlags && userWindowCount >= 6;

  const { mutate, isPending: isMutationLoading } = useMutation({
    mutationFn: async () => {
      const hasMedia = stagedFiles?.length > 0;
      let uploadedAssets: MediaUploadPayload[] = [];

      if (hasMedia) {
        uploadedAssets = await uploadMediaToCloud(stagedFiles);
        console.log(
          "Cloud asset transfers completed successfully:",
          uploadedAssets,
        );
      }

      const serverPayload = {
        caption: caption.trim().length > 0 ? caption.trim() : undefined,
        media: hasMedia ? uploadedAssets : undefined,
        topics: topics.length > 0 ? topics : undefined,
        hasSensitiveGraphic,
        skipModeration,
      };

      return await createGist(serverPayload);
    },
    onSuccess: (result: any) => {
      console.log("Gist record structural entry committed:", result);

      if (skipModeration) {
        setSBMessage({
          msg: {
            id: `gist-success-${Date.now()}`,
            msgStatus: "SUCCESS",
            tagline: "Gist published successfully",
            behavior: "TIMED",
            duration: 5,
            hasClose: true,
          },
        });
      } else {
        // Enqueue tracking sequence using the assigned database record identifier for socket stream mapping
        if (result?._id) {
          setModerationTrackingId(result._id);
        }
      }

      setStagedFiles([]);
      setTopics([]);
      setHasSensitiveGraphic?.(false);
      setCaption("");
      setStep?.("CONTENT");
    },
    onError: (error: any) => {
      console.error("Post publication failed:", error);
      setInlineErrMsg(
        error.message || "An error occurred during asset processing.",
      );
    },
  });

  /**
   * Evaluates minimum composition metrics before executing mutations or step routing.
   */
  const handleGistPublish = useCallback(
    (e: React.SubmitEvent) => {
      e.preventDefault();
      const hasCaption = caption.trim().length > 0;
      const hasMedia = stagedFiles.length > 0;

      if (!hasCaption && !hasMedia) {
        setErrorMessage("Gist must contain either text content or media.");
        return;
      }
      setErrorMessage(null);
      mutate();
    },
    [caption, stagedFiles, mutate],
  );

  /**
   * Advances form state mapping step forward into setting fields.
   */
  const handleNext = useCallback(() => {
    const hasCaption = caption.trim().length > 0;
    const hasMedia = stagedFiles.length > 0;

    if (!hasCaption && !hasMedia) {
      setErrorMessage("Gist must contain either text content or media.");
      return;
    }
    setErrorMessage(null);
    setStep?.("SETTINGS");
  }, [caption, stagedFiles, setStep]);

  return {
    caption,
    setCaption,
    stagedFiles,
    topics,
    setTopics,
    hasSensitiveGraphic,
    setHasSensitiveGraphic,
    isProcessing: isMutationLoading || !!moderationTrackingId,
    inlineErrMsg,
    uploadStates,
    handleFileSelection,
    handleRemoveFile,
    handleGistPublish,
    handleNext,
    topicsMenuRef,
    ...topicOperations,
  };
};
