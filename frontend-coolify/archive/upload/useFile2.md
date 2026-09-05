"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  useMemo,
  useRef,
} from "react";
import {
  COMMON_MEDIA,
  MediaProcessingProgress,
  MenuRef,
  QUEUE_KEYS,
  TrackedFile,
  IMedia,
  CustomizedMedia,
  MediaProps,
} from "@repo/core";
import { checkDeviceCapability, compressVideoAsync } from "@repo/helpers";
import { useStaticTranslation } from "./useTrans";

export interface UseFileProcessingProps {
  stagedFiles: File[];
  setStagedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setErrorMessage: (msg: string | null) => void;
  shouldCompress?: boolean;
}
export interface MockMediaFile {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  name: string;
  rawFile?: File;
}
export interface MediaFolder {
  id: string;
  name: string;
  files: MockMediaFile[];
}
interface UseMediaFileSelectorProps {
  initialMaximized?: boolean;
  allowDrag?: boolean;
  onFilesSelected?: (files: MockMediaFile[]) => void;
}

interface UseMediaTransform {
  files: File[];
  customizationsMap?: Record<string, CustomizedMedia>;
  onSingleTap?: (media: IMedia, index: number) => void;
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

  const { processingStates } = useFileProcessingProgress(stagedFiles);

  /**
   * Processes raw inputs, attaches tracking variables, and pushes video streams to background workers when flag criteria are met.
   */
  const handleSelectedFiles = useCallback(
    async (input: ChangeEvent<HTMLInputElement> | File[]) => {
      let rawFiles: File[] = [];

      if (Array.isArray(input)) {
        rawFiles = input;
      } else if (input?.target?.files) {
        rawFiles = Array.from(input.target.files);
      } else {
        return;
      }

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
          if (!tId) return;

          setCompressingIds((prev) => [...prev, tId]);

          const initEvent = new CustomEvent(
            `${QUEUE_KEYS.MEDIA_COMPRESSION}-${tId}`,
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
    processingStates,
    handleSelectedFiles,
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

  // Stable dependency mapping by extracting tracking details explicitly
  const fileTrackers = useMemo(() => {
    return files
      .map((f) => ({
        trackingId: (f as any).trackingId as string | undefined,
        fileName: f.name,
      }))
      .filter((f): f is { trackingId: string; fileName: string } =>
        Boolean(f.trackingId),
      );
  }, [files]);

  const trackerKey = useMemo(() => {
    return fileTrackers.map((t) => t.trackingId).join(",");
  }, [fileTrackers]);

  useEffect(() => {
    const activeListeners: Array<{
      eventName: string;
      handler: (e: Event) => void;
    }> = [];

    // Pre-initialize tracking records for active IDs in a single pass
    setProcessingStates((prev) => {
      let currentMapHasChanges = false;
      const updatedMap = { ...prev };

      fileTrackers.forEach(({ trackingId }) => {
        if (!updatedMap[trackingId]) {
          updatedMap[trackingId] = {
            compression: undefined,
            upload: undefined,
          };
          currentMapHasChanges = true;
        }
      });

      return currentMapHasChanges ? updatedMap : prev;
    });

    // Register active event listeners explicitly with clean removal handlers
    fileTrackers.forEach(({ trackingId, fileName }) => {
      const channels = [
        {
          name: `${QUEUE_KEYS.MEDIA_COMPRESSION}-${trackingId}`,
          key: "compression" as const,
        },
        {
          name: `${QUEUE_KEYS.MEDIA_UPLOAD}-${trackingId}`,
          key: "upload" as const,
        },
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
                  fileName,
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

    // Guaranteed teardown cleanup function
    return () => {
      activeListeners.forEach(({ eventName, handler }) => {
        window.removeEventListener(eventName, handler);
      });
    };
  }, [trackerKey, fileTrackers]);

  return { processingStates };
};

/**
 * Handles internal state matrices for asset isolation, current directory tracking, toggles, and swipe gestures.
 */
export const useMediaFileSelector = ({
  initialMaximized = false,
  allowDrag = true,
  onFilesSelected,
}: UseMediaFileSelectorProps) => {
  const { translateTxtString } = useStaticTranslation();
  const [folders, setFolders] = useState<MediaFolder[]>([
    {
      id: "gallery",
      name: translateTxtString(COMMON_MEDIA.gallery_default_name),
      files: [],
    },
  ]);
  const [currentFolderId, setCurrentFolderId] = useState<string>("gallery");
  const [selectedFiles, setSelectedFiles] = useState<MockMediaFile[]>([]);
  const [isMaximized, setIsMaximized] = useState(initialMaximized);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<
    PermissionState | "unrequested"
  >("unrequested");

  const dragConstraintsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<MenuRef>(null);
  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null);

  const currentFolder = useMemo(() => {
    return folders.find((f) => f.id === currentFolderId) || folders[0] || null;
  }, [folders, currentFolderId]);

  const minimizedMediaList = useMemo(() => {
    if (!currentFolder) return [];
    return currentFolder.files.slice(0, 9);
  }, [currentFolder]);

  /**
   * Scans a system directory handle recursively to resolve media asset records into state.
   */
  const readDirectoryAssets = async (dirHandle: FileSystemDirectoryHandle) => {
    try {
      const discoveredFiles: MockMediaFile[] = [];

      for await (const entry of dirHandle.values()) {
        if (entry.kind === "file") {
          const file = await entry.getFile();
          const isImage = file.type.startsWith("image/");
          const isVideo = file.type.startsWith("video/");

          if (isImage || isVideo) {
            discoveredFiles.push({
              id: `${file.name}-${file.size}`,
              url: URL.createObjectURL(file),
              type: isVideo ? "VIDEO" : "IMAGE",
              name: file.name,
              rawFile: file,
            });
          }
        }
      }

      setFolders([
        {
          id: "gallery",
          name: translateTxtString(COMMON_MEDIA.gallery_default_name),
          files: discoveredFiles,
        },
      ]);
      setPermissionStatus("granted");
    } catch {
      setPermissionStatus("denied");
    }
  };

  /**
   * Triggers an explicit system prompt asking the user to designate a working media folder directory.
   */
  const handleRequestPermission = async () => {
    try {
      if (!window.showDirectoryPicker) {
        handleTriggerNativeBrowse();
        return;
      }

      const handle = await window.showDirectoryPicker({
        mode: "read",
      });

      directoryHandleRef.current = handle;
      await readDirectoryAssets(handle);
    } catch {
      setPermissionStatus("denied");
    }
  };

  /**
   * Attempts to verify if system storage folder access privileges persist on initial mount execution.
   */
  useEffect(() => {
    const checkExistingPermissions = async () => {
      if (!window.showDirectoryPicker || !directoryHandleRef.current) {
        setPermissionStatus("unrequested");
        return;
      }

      try {
        const status = await directoryHandleRef.current.queryPermission({
          mode: "read",
        });
        setPermissionStatus(status);

        if (status === "granted") {
          await readDirectoryAssets(directoryHandleRef.current);
        }
      } catch {
        setPermissionStatus("unrequested");
      }
    };

    checkExistingPermissions();
  }, []);

  const handleOpenFolderMenu = (event: React.MouseEvent<HTMLElement>) => {
    menuRef.current?.openMenu(event.currentTarget);
    setIsMenuOpen(true);
  };

  const handleCloseFolderMenu = () => {
    menuRef.current?.closeMenu();
    setIsMenuOpen(false);
  };

  const handleSelectFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
    handleCloseFolderMenu();
  };

  const handleToggleSelectFile = (file: MockMediaFile) => {
    setSelectedFiles((prev) => {
      const isAlreadySelected = prev.some((item) => item.id === file.id);
      if (isAlreadySelected) {
        return prev.filter((item) => item.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleConfirmSelection = () => {
    if (onFilesSelected) {
      onFilesSelected(selectedFiles);
    }
  };

  /**
   * Spawns a clean file input window in the background to access local storage media paths.
   */
  const handleTriggerNativeBrowse = () => {
    handleCloseFolderMenu();

    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*,video/*";

    input.onchange = (e: Event) => {
      const filesList = (e.target as HTMLInputElement).files;
      if (!filesList) return;

      const filesArray = Array.from(filesList);
      const mappedFiles: MockMediaFile[] = filesArray.map((file, idx) => ({
        id: `${file.name}-${idx}-${Date.now()}`,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video") ? "VIDEO" : "IMAGE",
        name: file.name,
        rawFile: file,
      }));

      setFolders((prevFolders) => {
        return prevFolders.map((folder) => {
          if (folder.id === currentFolderId) {
            return {
              ...folder,
              files: [...mappedFiles, ...folder.files],
            };
          }
          return folder;
        });
      });
      setPermissionStatus("granted");
    };

    input.click();
  };

  /**
   * Evaluates mechanical swipe limits on targeted interface panels to expand layout views.
   */
  const handleDragEnd = (_event: any, info: any) => {
    if (!allowDrag) return;
    if (info.offset.y < -60) {
      setIsMaximized(true);
    }
  };

  return {
    folders,
    isMaximized,
    setIsMaximized,
    currentFolder,
    minimizedMediaList,
    selectedFiles,
    isMenuOpen,
    menuRef,
    dragConstraintsRef,
    permissionStatus,
    handleOpenFolderMenu,
    handleCloseFolderMenu,
    handleSelectFolder,
    handleToggleSelectFile,
    handleConfirmSelection,
    handleTriggerNativeBrowse,
    handleRequestPermission,
    handleDragEnd,
  };
};

/**
 * Transforms raw browser File objects into structural IMedia models with automatic Object URL memory cleanup.
 */
export const useMediaFileTransform = ({
  files,
  customizationsMap = {},
  onSingleTap,
}: UseMediaTransform): MediaProps[] => {
  const previousUrlsRef = useRef<string[]>([]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previousUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const transformedMediaList = useMemo(() => {
    // Revoke previous URLs before generating new ones to prevent memory bloat
    previousUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));

    const newUrls: string[] = [];

    const mediaObjects = files.map((file, index) => {
      const trackingId = (file as any).trackingId || `${index}-${file.name}`;
      const objectUrl = URL.createObjectURL(file);
      newUrls.push(objectUrl);

      const isVideo = file.type.startsWith("video/");

      const media: MediaProps = {
        _id: trackingId,
        url: objectUrl,
        type: isVideo ? "VIDEO" : "IMAGE",
        alt: file.name,
        customizations: customizationsMap[trackingId],
      };

      if (onSingleTap) {
        media.onSingleTap = () => onSingleTap(media, index);
      }
      return media;
    });

    previousUrlsRef.current = newUrls;
    return mediaObjects;
  }, [files, customizationsMap, onSingleTap]);

  return transformedMediaList;
};
