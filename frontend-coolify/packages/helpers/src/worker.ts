"use client";

import { AllowedMimeType } from "@repo/core";

export const registerSW = () => {
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.error("SW registration failed:", err));
  }
};

export const unregisterSW = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
        console.log("Service Worker unregistered successfully");
      }
    });
  }
};

/**
 * Registers an operational background fetch task with the active Service Worker container context.
 */
export const queueBgUpload = async (
  uploadUrl: string,
  file: File | Blob,
  mimeType: AllowedMimeType,
): Promise<any | null> => {
  if (
    !("serviceWorker" in navigator) ||
    !("BackgroundFetchManager" in window)
  ) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const uniqueJobId = `media-upload-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

  const uploadRequest = new Request(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": mimeType,
    },
  });

  const bgFetch = await (registration as any).backgroundFetch.fetch(
    uniqueJobId,
    [uploadRequest],
    {
      title: "Uploading media to Funstakes...",
      downloadTotal: file.size,
    },
  );

  return bgFetch;
};
