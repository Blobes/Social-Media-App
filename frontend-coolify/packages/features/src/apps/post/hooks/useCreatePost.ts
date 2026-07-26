"use client";

import { usePopup } from "@repo/features/src/popups/usePopup";
import React, { useCallback } from "react";

export const useCreatePost = () => {
  const { openPopup } = usePopup();

  const openCreatePost = useCallback(
    (element: React.ReactNode) => {
      openPopup("CREATE_POST", element);
    },
    [openPopup],
  );

  return { openCreatePost };
};
