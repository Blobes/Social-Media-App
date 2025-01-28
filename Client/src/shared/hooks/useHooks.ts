"use client";

import { useAppContext } from "@/app/AppContext";
import { Feedback } from "@/shared/types";

export const useHooks = () => {
  const { setFeedback } = useAppContext();

  const setFeedbackMessage = (
    message: string | null,
    type: "SUCCESS" | "ERROR" | "INFO" | "WARNING" | null,
    delay: number = 0
  ) => {
    setTimeout(
      () => setFeedback((prev) => ({ ...prev, message: message, type: type })),
      delay
    );
  };

  const progressBarState = (
    seconds: number,
    width: number,
    prevState?: Feedback //The previous state, if the progressBarState() function is called WITHIN the setFeedback() function
  ): Feedback => {
    let newState;
    setFeedback((prev) => {
      newState = {
        ...(prevState ? prevState : prev),
        progressBar: { seconds: seconds, width: width > 0 ? width : 0 },
      };
      return newState;
    });
    return newState!;
  };
  return { setFeedbackMessage, progressBarState };
};
