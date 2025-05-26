"use client";

import { useAppContext } from "@/app/AppContext";
import { Feedback } from "@/shared/types";
import { useEffect } from "react";

export const useFeedback = () => {
  const { feedback, setFeedback } = useAppContext();

  const setFbMessage = (
    {
      fixedMessage,
      timedMessage,
    }: { fixedMessage?: string | null; timedMessage?: string | null },
    type: Feedback["type"] = null,
    delay = 0
  ) => {
    if (fixedMessage !== undefined) {
      setFeedback((prev) => ({
        ...prev,
        message: { ...prev.message, fixed: fixedMessage },
        type,
      }));
    }
    if (timedMessage !== undefined) {
      setTimeout(() => {
        setFeedback((prev) => ({
          ...prev,
          message: { ...prev.message, timed: timedMessage },
          type,
        }));
      }, delay);
    }
  };

  const useFbTimer = () => {
    useEffect(() => {
      if (!feedback.message.timed) return;
      const intervalId = setInterval(() => {
        setFeedback((prev) => {
          const nextSec = prev.progress.seconds - 1;
          const nextWidth = prev.progress.width - 30;

          if (nextSec < 1) {
            clearInterval(intervalId);
            setTimeout(() => {
              setFeedback((state) => ({
                ...state,
                message: { ...state.message, timed: null },
                progress: { seconds: 5, width: 100 },
              }));
            }, 300);
            return prev;
          }
          return {
            ...prev,
            progress: { seconds: nextSec, width: nextWidth },
          };
        });
      }, 1000);

      return () => clearInterval(intervalId);
    }, [feedback.message.timed, setFeedback]);
  };

  return { setFbMessage, useFbTimer };
};
