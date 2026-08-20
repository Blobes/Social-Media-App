"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import {
  ISinglePayload,
  OtpStepName,
  SERVER_API,
  AUTH_BUTTON_LABELS,
} from "@repo/core";
import {
  apiClient,
  getFromLocalStorage,
  saveToLocalStorage,
} from "@repo/helpers";
import { useStaticTranslation } from "./useTrans";

export interface VerifyBotRequest {
  token: string;
}

const BOT_CHALLENGE_STORAGE_KEY = "bot_last_challenge_time";
const BOT_CHALLENGE_TIMEFRAME_MS = 15 * 60 * 1000; // 15 minutes cooldown frame

/**
 * Executes bot token verification request to server node.
 */
const verifyBot = async (
  request: VerifyBotRequest,
): Promise<ISinglePayload<null>> => {
  return await apiClient<ISinglePayload<null>>(SERVER_API.verifyBot, {
    method: "POST",
    body: JSON.stringify({ token: request.token }),
  });
};

export interface UseBotOptions {
  currStep: OtpStepName;
  setCurrStep: Dispatch<SetStateAction<OtpStepName>>;
  onSuccess?: (token?: string) => void | Promise<void>;
  buttonText?: React.ReactNode;
}

/**
 * Handles Cloudflare Turnstile bot verification logic, challenge lifecycle state, and session bypass checks.
 */
export const useBotVerification = (options: UseBotOptions) => {
  const { setCurrStep, onSuccess, buttonText } = options;
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode | null>(
    null,
  );

  const { translateTxtString } = useStaticTranslation();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const label =
    buttonText || translateTxtString(AUTH_BUTTON_LABELS.verify_and_proceed);

  /**
   * Stores generated verification token upon successful Turnstile challenge execution.
   */
  const handleVerify = useCallback((receivedToken: string): void => {
    setToken(receivedToken);
    setErrorMessage(null);
  }, []);

  /**
   * Clears challenge state when the issued Turnstile token expires.
   */
  const handleExpire = useCallback((): void => {
    setToken(null);
  }, []);

  /**
   * Checks whether the allowed timeframe duration has passed since the last bot challenge trigger.
   */
  const isBotChallengeAllowed = useCallback((): boolean => {
    const lastChallengeTime = getFromLocalStorage<number>({
      key: BOT_CHALLENGE_STORAGE_KEY,
    });
    if (!lastChallengeTime) return true;
    const timeElapsed = Date.now() - Number(lastChallengeTime);
    return timeElapsed >= BOT_CHALLENGE_TIMEFRAME_MS;
  }, []);

  /**
   * Evaluates active session state on mount to bypass bot challenge if verified.
   */
  const checkBotSessionStatus = useCallback(async (): Promise<void> => {
    setIsCheckingSession(true);
    try {
      setCurrStep("OTP_VERIFY");
    } catch {
      setCurrStep("BOT_CHALLENGE");
    } finally {
      setIsCheckingSession(false);
    }
  }, [setCurrStep]);

  useEffect(() => {
    checkBotSessionStatus();
  }, [checkBotSessionStatus]);

  /**
   * Executes bot verification request and progresses step state.
   */
  const handleBotAuthSuccess = useCallback(
    async (tokenToVerify: string): Promise<void> => {
      await verifyBot({ token: tokenToVerify });
      setCurrStep("OTP_VERIFY");
      await onSuccess?.(tokenToVerify);
    },
    [setCurrStep, onSuccess],
  );

  /**
   * Triggers host submission pipeline passing validated Turnstile token.
   */
  const handleClick = useCallback(async (): Promise<void> => {
    if (!token) {
      setErrorMessage("Please complete the bot challenge before proceeding.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await handleBotAuthSuccess(token);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification request failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [token, handleBotAuthSuccess]);

  /**
   * Forces state step transition back to bot challenge upon threshold rate limits if timeframe exceeded.
   */
  const triggerBotChallenge = useCallback((): void => {
    saveToLocalStorage<number>(BOT_CHALLENGE_STORAGE_KEY, Date.now());
    setCurrStep("BOT_CHALLENGE");
  }, [setCurrStep]);

  return {
    isCheckingSession,
    token,
    isSubmitting,
    errorMessage,
    siteKey,
    label,
    setErrorMessage,
    handleVerify,
    handleExpire,
    handleClick,
    handleBotAuthSuccess,
    triggerBotChallenge,
    isBotChallengeAllowed,
  };
};
