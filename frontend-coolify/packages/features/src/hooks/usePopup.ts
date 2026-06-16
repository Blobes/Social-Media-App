"use client";

import { useDragClose, useMisc } from "@repo/shared-hooks";
import { POPUP_CONFIG, PopupName } from "../constants/popups";
import { useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { dragToCloseConfig } from "@repo/helpers";

/**
 * Handles presentation logic layer routing parameters across modalities like dialog modals or drawers.
 */
export const usePopup = () => {
  const { openModal, openDrawer, closeModal, closeDrawer } = useMisc();
  const theme = useTheme();

  /**
   * Dispatches window visibility changes matching target configurations.
   */
  const openPopup = useCallback(
    (
      popupName: PopupName,
      popupContent?: React.ReactNode,
      popupHeader?: React.ReactNode,
    ) => {
      const activeConfig = POPUP_CONFIG({
        content: popupContent,
        header: popupHeader,
        closeModal,
        closeDrawer,
        dragConfig: () => useDragClose(dragToCloseConfig()),
        theme,
      });

      const config = activeConfig[popupName];
      if (!config) return;

      const isModalTarget =
        config.type.baseScreen === "MODAL" ||
        config.type.smallScreen === "MODAL";
      const isDrawerTarget =
        config.type.baseScreen === "DRAWER" ||
        config.type.smallScreen === "DRAWER";

      if (isModalTarget && config.modal) openModal(config.modal);
      if (isDrawerTarget && config.drawer) openDrawer(config.drawer);
    },
    [openModal, openDrawer, closeModal, closeDrawer, theme],
  );

  return { openPopup };
};
