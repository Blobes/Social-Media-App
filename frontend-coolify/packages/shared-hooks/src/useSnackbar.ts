"use client";

import { useCallback } from "react";
import { useGlobalStore } from "./store/useGlobalStore";
import { IMessage } from "@repo/core";

/**
 * Optimized snackbar hook.
 * Uses atomic selectors and stable callbacks to prevent re-render loops.
 */
export const useSnackbar = () => {
  // Atomic selectors: only subscribe to what is absolutely necessary
  const messages = useGlobalStore((state) => state.snackBarMsg.messages);
  const defaultDur = useGlobalStore((state) => state.snackBarMsg.defaultDur);
  const setSnackBarMsg = useGlobalStore((state) => state.setSnackBarMsg);
  const removeSnackBarAction = useGlobalStore(
    (state) => state.removeSnackBarMsg,
  );

  interface SBMessage {
    msg?: IMessage;
    delay?: number;
    override?: boolean;
  }

  /**
   * Sets a snackbar message with optional delay and override behavior.
   */
  const setSBMessage = useCallback(
    ({ msg, delay = 0, override = true }: SBMessage) => {
      if (msg === undefined) return;

      const newMsg = {
        ...msg,
        id: msg.id ?? Date.now().toString(),
        type: msg.msgStatus ?? null,
        behavior: msg.behavior ?? "TIMED",
        hasClose: msg.hasClose ?? false,
        cta: msg.cta ?? undefined,
      };

      if (delay > 0) {
        setTimeout(() => {
          setSnackBarMsg(newMsg, override);
        }, delay);
      } else {
        setSnackBarMsg(newMsg, override);
      }
    },
    [setSnackBarMsg],
  );

  /**
   * Manages message expiration timers.
   * Logic is stable to prevent interval stacking.
   */
  const setSBTimer = useCallback(() => {
    if (!messages || messages.length === 0) return;

    const timers = messages
      .map((msg: any) => {
        if (msg.behavior !== "TIMED") return null;

        let remaining = msg.duration ?? defaultDur;

        const intervalId = setInterval(() => {
          remaining--;
          if (remaining <= 0 && msg.id) {
            removeSnackBarAction(msg.id);
            clearInterval(intervalId);
          }
        }, 1000);

        return intervalId;
      })
      .filter((id): id is NodeJS.Timeout => id !== null);

    return () => timers.forEach((id) => clearInterval(id));
  }, [messages, defaultDur, removeSnackBarAction]);

  /**
   * Removes a specific message or clears all if no ID is provided.
   */
  const removeSBMessage = useCallback(
    async (id?: string) => {
      if (id) {
        removeSnackBarAction(id);
      } else {
        setSnackBarMsg([] as unknown as IMessage, true);
      }
    },
    [removeSnackBarAction, setSnackBarMsg],
  );

  /**
   * Clears the snackbar queue.
   */
  const clearSBMessages = useCallback(() => {
    setSnackBarMsg([] as unknown as IMessage, true);
  }, [setSnackBarMsg]);

  return { setSBMessage, setSBTimer, removeSBMessage, clearSBMessages };
};
