"use client";

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { MediaProcessingProgress, TrackedFile } from "@repo/core";
import { checkDeviceCapability, compressVideoAsync } from "@repo/helpers";

export interface UseFileProcessingProps {
  stagedFiles: File[];
  setStagedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setErrorMessage: (msg: string | null) => void;
  shouldCompress?: boolean;
}

/**
 * Manages local raw file staging pipelines with integrated, unified event progression metrics.
 */
export const useFileProcessing = ({
  stagedFiles,
  setStagedFiles,
  setErrorMessage,
  shouldCompress = false,
}: UseFileProcessingProps) => {
  const [compressingIds, setCompressingIds] = useState<string[]>([]);

  // Leverage the progression hook internally to monitor event channels
  const { processingStates } = useFileProcessingProgress(stagedFiles);

  /**
   * Processes raw inputs, attaches tracking variables, and pushes video streams to background workers when flag criteria are met.
   */
  const handleFileSelection = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;

      const rawFiles = Array.from(e.target.files);
      const processedFiles: File[] = [];

      for (const file of rawFiles) {
        const trackedFile = file as TrackedFile;
        if (!trackedFile.trackingId) {
          trackedFile.trackingId = Math.random().toString(36).substring(2, 9);
        }
        processedFiles.push(trackedFile);
      }

      setStagedFiles((prev) => [...prev, ...processedFiles]);
      setErrorMessage(null);

      const highPerformanceAvailable = checkDeviceCapability();

      processedFiles.forEach(async (file) => {
        if (
          file.type.startsWith("video") &&
          shouldCompress &&
          highPerformanceAvailable
        ) {
          const tId = (file as TrackedFile).trackingId;

          setCompressingIds((prev) => [...prev, tId]);

          const initEvent = new CustomEvent(
            `media-compression-progress-${tId}`,
            {
              detail: { status: "LOADING_ENGINE", progress: 0 },
            },
          );
          window.dispatchEvent(initEvent);

          try {
            const compressedBlob = await compressVideoAsync(file, tId);
            const compressedFile = new File([compressedBlob], file.name, {
              type: "video/mp4",
            }) as TrackedFile;
            compressedFile.trackingId = tId;

            setStagedFiles((prev) =>
              prev.map((f) =>
                (f as TrackedFile).trackingId === tId ? compressedFile : f,
              ),
            );
          } catch (compressionError) {
            console.warn(
              "Local optimization aborting, reverting to uncompressed stream:",
              compressionError,
            );
          } finally {
            setCompressingIds((prev) => prev.filter((id) => id !== tId));
          }
        }
      });
    },
    [setStagedFiles, setErrorMessage, shouldCompress],
  );

  /**
   * Removes tracking instances and purges active compression jobs.
   */
  const handleRemoveFile = useCallback(
    (targetIndex: number) => {
      const targetFile = stagedFiles[targetIndex] as TrackedFile;
      if (targetFile?.trackingId) {
        const tId = targetFile.trackingId;
        setCompressingIds((prev) => prev.filter((id) => id !== tId));
      }
      setStagedFiles((prev) =>
        prev.filter((_, index) => index !== targetIndex),
      );
    },
    [stagedFiles, setStagedFiles],
  );

  return {
    compressingIds,
    processingStates, // Directly exposes your structured processing states down to consumption layers
    handleFileSelection,
    handleRemoveFile,
  };
};

/**
 * Subscribes to global window events tracking local compression loops and network storage uploads.
 */
export const useFileProcessingProgress = (files: File[]) => {
  const [processingStates, setProcessingStates] = useState<
    Record<
      string,
      {
        upload?: MediaProcessingProgress;
        compression?: MediaProcessingProgress;
      }
    >
  >({});

  useEffect(() => {
    const activeListeners: Array<{
      eventName: string;
      handler: (e: Event) => void;
    }> = [];

    // Pre-initialize tracking structures for newly appended files in a single pass
    setProcessingStates((prev) => {
      let currentMapHasChanges = false;
      const updatedMap = { ...prev };

      files.forEach((file) => {
        const trackingId = (file as any).trackingId;
        if (trackingId && !updatedMap[trackingId]) {
          updatedMap[trackingId] = {
            compression: undefined,
            upload: undefined,
          };
          currentMapHasChanges = true;
        }
      });

      return currentMapHasChanges ? updatedMap : prev;
    });

    // Attach native event listeners to capture isolated pipeline steps per tracking ID
    files.forEach((file) => {
      const trackingId = (file as any).trackingId;
      if (!trackingId) return;

      const channels = [
        {
          name: `media-compression-progress-${trackingId}`,
          key: "compression" as const,
        },
        { name: `media-upload-progress-${trackingId}`, key: "upload" as const },
      ];

      channels.forEach(({ name, key }) => {
        const handler = (event: Event) => {
          const customEvent = event as CustomEvent<MediaProcessingProgress>;

          setProcessingStates((prev) => {
            const currentRecord = prev[trackingId] || {};
            return {
              ...prev,
              [trackingId]: {
                ...currentRecord,
                [key]: {
                  fileName: file.name,
                  ...customEvent.detail,
                },
              },
            };
          });
        };

        window.addEventListener(name, handler);
        activeListeners.push({ eventName: name, handler });
      });
    });

    return () => {
      activeListeners.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, [files]);

  return { processingStates };
};
