"use client";

import { useAppContext } from "@/app/AppContext";
import { MsgType } from "@/types";
import { useEffect } from "react";

export const useSharedHooks = () => {
  const { snackBarMsgs, setSnackBarMsgs, setPage } = useAppContext();

  interface SBMessage {
    msg?: MsgType;
    delay?: number;
    override?: boolean;
  }

  const setSBMessage = ({ msg, delay = 0, override = false }: SBMessage) => {
    if (msg !== undefined) {
      setTimeout(() => {
        const newMsg = {
          ...msg,
          id: msg.id ?? Number((Math.random() * 1e6).toFixed(0)),
          type: msg.msgStatus ?? null,
          behavior: msg.behavior ?? "TIMED",
          hasClose: msg.hasClose ?? false,
          cta: msg.cta ?? undefined,
        };
        setSnackBarMsgs((prev) => ({
          ...prev,
          messgages: override ? [newMsg] : [...(prev.messgages ?? []), newMsg],
        }));
      }, delay);
    }
  };

  const setSBTimer = () => {
    if (!snackBarMsgs.messgages || snackBarMsgs.messgages.length === 0) return;

    const timers = snackBarMsgs.messgages.map((msg) => {
      let remaining = msg.duration ?? snackBarMsgs.defaultDur;

      if (msg.behavior === "TIMED") {
        const intervalId = setInterval(() => {
          remaining -= 1;

          if (remaining <= 0) {
            clearInterval(intervalId);

            setSnackBarMsgs((prev) => {
              const updatedMsgs =
                prev.messgages?.filter((m) => m.id !== msg.id) || [];

              return {
                ...prev,
                messgages: updatedMsgs,
              };
            });
          }
        }, 1000);
        return intervalId;
      }
    });
    // Cleanup
    return () => timers.forEach((id) => clearInterval(id));
  };

  const removeMessage = (id: number) => {
    setSnackBarMsgs((prev) => {
      const updatedMsgs = prev.messgages?.filter((m) => m.id !== id) || [];

      return {
        ...prev,
        messgages: updatedMsgs,
      };
    });
  };

  useEffect(() => {
    setSBTimer();
  }, [setSnackBarMsgs]);

  const setCurrentPage = (page: string) => {
    setPage(page);
    localStorage.setItem("currentPage", page);
  };

  return { setSBMessage, setSBTimer, removeMessage, setCurrentPage };
};
