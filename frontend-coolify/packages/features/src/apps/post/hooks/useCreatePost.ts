"use client";

import React, { useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { useMisc } from "@repo/shared-hooks";

export const useCreatePost = () => {
  const { openModal, closeModal } = useMisc();
  const theme = useTheme();

  const openCreatePost = useCallback(
    (element: React.ReactNode) => {
      openModal({
        content: element,
        onClose: closeModal,
        style: {
          base: {
            overlay: { padding: theme.boxSpacing(6), display: "none" },
            content: { height: "100%", borderRadius: "0px" },
          },
          smallScreen: {
            overlay: { padding: theme.boxSpacing(0), display: "flex" },
          },
          header: {
            justifyContent: "space-between",
            padding: theme.boxSpacing(5, 8),
          },
        },
      });
    },
    [openModal, closeModal, theme],
  );

  return { openCreatePost };
};
