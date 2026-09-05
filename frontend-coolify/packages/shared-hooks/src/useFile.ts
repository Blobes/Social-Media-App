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
  TrackedFile,
  IMedia,
  CustomizedMedia,
  MediaProps,
  STORAGE_KEYS,
} from "@repo/core";
import { useStaticTranslation } from "./useTrans";

export interface UseFileProcessingProps {
  stagedFiles: File[];
  setStagedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setErrorMessage: (msg: string | null) => void;
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
 * Fast client-side image compression using Canvas and WebP conversion.
 */
const optimizeImageClientSide = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxDimension = 2048;
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const optimizedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".webp"),
            { type: "image/webp" },
          );
          resolve(optimizedFile);
        },
        "image/webp",
        0.85,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

/**
 * Lightweight client staging pipeline for preparing raw uploads to R2.
 */
export const useFileProcessing = ({
  stagedFiles,
  setStagedFiles,
  setErrorMessage,
}: UseFileProcessingProps) => {
  const [isProcessingLocal, setIsProcessingLocal] = useState<boolean>(false);
  const { processingStates } = useFileProcessingProgress(stagedFiles);

  /**
   * Assigns tracking IDs and optimizes images locally before staging.
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

      setIsProcessingLocal(true);
      setErrorMessage(null);

      try {
        const processedFiles: File[] = await Promise.all(
          rawFiles.map(async (file) => {
            const trackingId =
              Math.random().toString(36).substring(2, 9) +
              Date.now().toString(36);

            let finalFile = file;

            if (file.type.startsWith("image/")) {
              finalFile = await optimizeImageClientSide(file);
            }

            const trackedFile = finalFile as TrackedFile;
            trackedFile.trackingId = trackingId;
            return trackedFile;
          }),
        );

        setStagedFiles((prev) => [...prev, ...processedFiles]);
      } catch (err) {
        console.error("Failed to process selected files locally:", err);
        setErrorMessage("Failed to process media files. Please try again.");
      } finally {
        setIsProcessingLocal(false);
      }
    },
    [setStagedFiles, setErrorMessage],
  );

  /**
   * Removes tracking instances from staged file state.
   */
  const handleRemoveFile = useCallback(
    (targetIndex: number) => {
      setStagedFiles((prev) =>
        prev.filter((_, index) => index !== targetIndex),
      );
    },
    [setStagedFiles],
  );

  return {
    isProcessingLocal,
    processingStates,
    handleSelectedFiles,
    handleRemoveFile,
  };
};

/**
 * Subscribes strictly to window network upload events.
 */
export const useFileProcessingProgress = (files: File[]) => {
  const [processingStates, setProcessingStates] = useState<
    Record<string, { upload?: MediaProcessingProgress }>
  >({});

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

    setProcessingStates((prev) => {
      let currentMapHasChanges = false;
      const updatedMap = { ...prev };

      fileTrackers.forEach(({ trackingId }) => {
        if (!updatedMap[trackingId]) {
          updatedMap[trackingId] = { upload: undefined };
          currentMapHasChanges = true;
        }
      });

      return currentMapHasChanges ? updatedMap : prev;
    });

    fileTrackers.forEach(({ trackingId, fileName }) => {
      const eventName = `${STORAGE_KEYS.MEDIA_UPLOAD}-${trackingId}`;

      const handler = (event: Event) => {
        const customEvent = event as CustomEvent<MediaProcessingProgress>;

        setProcessingStates((prev) => ({
          ...prev,
          [trackingId]: {
            upload: {
              fileName,
              ...customEvent.detail,
            },
          },
        }));
      };

      window.addEventListener(eventName, handler);
      activeListeners.push({ eventName, handler });
    });

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

  useEffect(() => {
    return () => {
      previousUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const transformedMediaList = useMemo(() => {
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
