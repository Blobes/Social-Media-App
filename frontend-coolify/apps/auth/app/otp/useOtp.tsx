"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import {
  TransitPurpose,
  OtpTransitData,
  OtpChannel,
  useGlobalStore,
  AUTH_FEEDBACK,
  ApiError,
} from "@repo/core";
import { OtpRequest, OtpService, TFAPurpose } from "./service";
import { useMutation } from "@tanstack/react-query";
import { useFeedback } from "./useFeedback";
import {
  getFromLocalStorage,
  saveToLocalStorage,
  stripToNumbers,
} from "@repo/helpers";
import {
  createVerificationStrategies,
  executeVerificationStrategy,
  resolveChannelRecipient,
} from "./strategies";

export interface OtpOptions<P extends TransitPurpose> {
  dispatchOnload?: boolean;
  setShouldRestrict?: (value: boolean) => void;
  transitData?: OtpTransitData<P>[];
}

const HOUR_IN_MS = 12 * 60 * 60 * 1000; // 12 hours
const LAST_DISPATCH_STORAGE_KEY = "otp_last_dispatch_time";

/**
 * Checks whether the required one-hour elapsed duration has passed since the last dispatch.
 */
const isDispatchAllowed = (): boolean => {
  const lastDispatchTime = getFromLocalStorage<number>({
    key: LAST_DISPATCH_STORAGE_KEY,
  });
  if (!lastDispatchTime) return true;
  const timeElapsed = Date.now() - Number(lastDispatchTime);
  return timeElapsed >= HOUR_IN_MS;
};

/**
 * Manages OTP logic by decoupling API mutations from orchestration strategies.
 */
export const useOtp = <P extends TransitPurpose>(
  options: OtpOptions<P> = {},
) => {
  const { transitData, dispatchOnload = true, setShouldRestrict } = options;

  const {
    verifyOtp,
    finalizeEmailUpdateOtp,
    finalizePhoneUpdateOtp,
    dispatchOtp,
    verifyTFA,
  } = OtpService();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const authUser = useGlobalStore((state) => state.authUser);
  const { setSBMessage } = useSnackbar();
  const { handleAuthOtpSuccess, onUpdateSuccess, handlePassResetSuccess } =
    useFeedback();
  const { translateTxtString } = useStaticTranslation();

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);

  const activeTransit = transitData?.[0];

  const [channel, setChannel] = useState<OtpChannel>(
    activeTransit?.channel || "EMAIL",
  );
  const [recipient, setRecipient] = useState<string | undefined>(
    activeTransit?.identifier,
  );

  const hasDispatchedOnLoad = useRef(false);
  const initialIdentifierRef = useRef(activeTransit?.identifier);
  const hasUserCtx =
    authUser && !authUser.isEmailVerified && !authUser.isPhoneVerified;

  /**
   * Strategy lookup object created with dependency scope.
   */
  const verificationStrategies = useMemo(
    () =>
      createVerificationStrategies({
        handleAuthOtpSuccess,
        onUpdateSuccess,
        handlePassResetSuccess,
        recipient: recipient || initialIdentifierRef.current,
      }),
    [handleAuthOtpSuccess, onUpdateSuccess, handlePassResetSuccess, recipient],
  );

  const isAuthPurpose =
    activeTransit?.purpose === "LOGIN_VERIFICATION" ||
    activeTransit?.purpose === "SIGNUP_VERIFICATION";
  activeTransit?.purpose === "PASSWORD_RESET";

  /**
   * Preserves initial identifier reference across modal state renders.
   */
  useEffect(() => {
    if (activeTransit?.identifier) {
      initialIdentifierRef.current = activeTransit.identifier;
    }
  }, [activeTransit?.identifier]);

  /**
   * Hydrates state from transitData without overriding user channel switches.
   */
  useEffect(() => {
    if (activeTransit?.identifier && !recipient) {
      setRecipient(activeTransit.identifier);
    }
    // Only hydrate channel if user has NOT switched to AUTHENTICATOR
    if (activeTransit?.channel && channel !== "AUTHENTICATOR") {
      setChannel(activeTransit.channel);
    }
  }, [activeTransit?.identifier, activeTransit?.channel, channel, recipient]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setInlineMsg(null);
    }
  }, [timer, setInlineMsg]);

  // Auto-dispatch logic on load
  useEffect(() => {
    if (hasDispatchedOnLoad.current) return;

    const canDispatch = dispatchOnload && (activeTransit || hasUserCtx);

    if (canDispatch) {
      hasDispatchedOnLoad.current = true;
      setShouldRestrict?.(false);
      if (isDispatchAllowed()) {
        queueMicrotask(() => {
          handleSendOtp();
        });
      }
    } else {
      setShouldRestrict?.(true);
    }
  }, [activeTransit, authUser, dispatchOnload, hasUserCtx, setShouldRestrict]);

  /**
   * Execution Layer: Dumb Dispatch Mutation
   */
  const { mutate: executeDispatch, isPending: isSending } = useMutation({
    mutationFn: async (request: OtpRequest) => dispatchOtp(request),
    onSuccess: (_, vars) => {
      saveToLocalStorage<number>(LAST_DISPATCH_STORAGE_KEY, Date.now());
      setTimer(60);
      setCode("");
      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.new_code_sent_tagline(
              vars.channel?.toLowerCase() || "email",
            ),
          ),
          msgStatus: "SUCCESS",
          duration: 6,
        },
      });
    },
    onError: (error: ApiError) => {
      const seconds = stripToNumbers(error.localizedErrMsg || "");
      setTimer(seconds);
      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(AUTH_FEEDBACK.otp_send_code_failed),
      );
    },
  });

  /**
   * Execution Layer: Dumb Verification Mutation
   */
  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (params: {
      purpose: TransitPurpose;
      method: () => Promise<any>;
    }) => {
      return await params.method();
    },
    onSuccess: () => {
      if (!activeTransit) return;
      executeVerificationStrategy(activeTransit, verificationStrategies);
    },
    onError: (error: ApiError) =>
      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(AUTH_FEEDBACK.otp_invalid_code),
      ),
  });

  /**
   * Orchestration Layer: Verification
   */
  const handleVerify = useCallback(
    async (verificationCode?: string) => {
      setInlineMsg(null);

      const finalCode = verificationCode || code;

      if (!activeTransit)
        return setInlineMsg(
          translateTxtString(AUTH_FEEDBACK.otp_missing_session),
        );
      if (finalCode.length < 6) return;

      const { purpose } = activeTransit;
      const targetIdentifier =
        activeTransit.identifier ||
        recipient ||
        initialIdentifierRef.current ||
        "";

      const method = (() => {
        if (channel === "AUTHENTICATOR") {
          const tFAPurpose: TFAPurpose = isAuthPurpose
            ? "AUTHENTICATE"
            : "TFA_SETUP";
          return () =>
            verifyTFA({
              purpose: tFAPurpose,
              token: finalCode,
              identifier: targetIdentifier,
            });
        }
        if (isAuthPurpose)
          return () =>
            verifyOtp({ recipient: targetIdentifier, code: finalCode });
        if (purpose === "IDENTIFIER_UPDATE") {
          return channel === "EMAIL"
            ? () => finalizeEmailUpdateOtp(finalCode)
            : () => finalizePhoneUpdateOtp(finalCode);
        }
        return null;
      })();

      if (!method)
        return setInlineMsg(
          translateTxtString(AUTH_FEEDBACK.unsupported_verification_method),
        );
      await executeVerify({ purpose, method });
    },
    [
      activeTransit,
      code,
      channel,
      isAuthPurpose,
      recipient,
      executeVerify,
      verifyOtp,
      finalizeEmailUpdateOtp,
      finalizePhoneUpdateOtp,
      verifyTFA,
      setInlineMsg,
      translateTxtString,
    ],
  );

  /**
   * Orchestration Layer: Resend/Send
   */
  const handleSendOtp = useCallback(
    (customRequest?: OtpRequest) => {
      if (channel === "AUTHENTICATOR") return;
      setInlineMsg(null);

      if (customRequest) {
        setRecipient(customRequest?.recipient);
        return executeDispatch(customRequest);
      }

      const targetRecipient =
        recipient ||
        activeTransit?.identifier ||
        initialIdentifierRef.current ||
        authUser?.email;
      if (!targetRecipient || !channel) return;

      executeDispatch({
        recipient: targetRecipient,
        purpose: activeTransit?.purpose ?? "LOGIN_VERIFICATION",
        channel,
      });
    },
    [recipient, channel, activeTransit, executeDispatch, setInlineMsg],
  );

  /**
   * Switches the active channel and immediately triggers a new OTP.
   */
  const switchChannel = useCallback(
    (targetChannel?: OtpChannel) => {
      if (!activeTransit || !hasUserCtx) {
        setInlineMsg(translateTxtString(AUTH_FEEDBACK.otp_send_code_failed));
        return;
      }

      const nextChannel: OtpChannel =
        targetChannel ||
        (channel === "AUTHENTICATOR"
          ? activeTransit.channel || "EMAIL"
          : channel === "EMAIL"
            ? "PHONE"
            : "EMAIL");

      const nextDest = resolveChannelRecipient(
        activeTransit,
        nextChannel,
        recipient || initialIdentifierRef.current,
      );

      if (!nextDest) {
        setSBMessage({
          msg: {
            tagline: translateTxtString(
              AUTH_FEEDBACK.no_email_or_phone(nextChannel.toLowerCase()),
            ),
          },
        });
        return;
      }

      setTimer(0);
      setChannel(nextChannel);
      setRecipient(nextDest);

      handleSendOtp({
        recipient: nextDest,
        purpose: activeTransit.purpose,
        channel: nextChannel,
      });
    },
    [
      channel,
      activeTransit,
      recipient,
      handleSendOtp,
      setSBMessage,
      translateTxtString,
      setInlineMsg,
    ],
  );

  /**
   * Explicitly switches the verification channel into Authenticator device mode.
   */
  const switchToAuthenticator = useCallback(() => {
    setTimer(0);
    setChannel("AUTHENTICATOR");
    setInlineMsg(null);
  }, [setInlineMsg]);

  return {
    code,
    setCode,
    timer,
    isVerifying,
    isSending,
    handleVerify,
    handleSendOtp,
    channel,
    switchChannel,
    switchToAuthenticator,
    recipient,
    setRecipient,
    inlineMsg,
  };
};
