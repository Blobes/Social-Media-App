"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { stripToNumbers } from "@repo/helpers";

interface UseOtpOptions {
  dispatchOnload?: boolean;
}

/**
 * Manages OTP logic by decoupling the "Dumb" API calls from the "Smart" orchestration.
 */
export const useOtp = <P extends TransitPurpose>(
  transitData?: OtpTransitData<P>[],
  options: UseOtpOptions = { dispatchOnload: false },
) => {
  const {
    verifyOtp,
    finalizeEmailUpdateOtp,
    finalizePhoneUpdateOtp,
    dispatchOtp,
    verifyTFA,
  } = OtpService();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const { setSBMessage } = useSnackbar();
  const { handleAuthOtpSuccess, onUpdateSuccess, handlePassSuccess } =
    useFeedback();
  const { translateTxtString } = useStaticTranslation();

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);

  // Primary operational fallback values prioritized by active flow instance
  const activeTransit = transitData?.[0];

  const [channel, setChannel] = useState<OtpChannel>(
    activeTransit?.channel || "EMAIL",
  );
  const [recipient, setRecipient] = useState(activeTransit?.identifier);
  const hasDispatchedOnLoad = useRef(false);

  /**
   * Action map strategy execution routing.
   */
  const verificationStrategies: {
    [K in TransitPurpose]: (payload: any, onSuccessCb?: () => void) => void;
  } = {
    ACCOUNT_VERIFICATION: (payload, onSuccessCb) =>
      handleAuthOtpSuccess(payload, onSuccessCb),
    ACCOUNT_UPDATE: () => onUpdateSuccess(),
    IDENTIFIER_UPDATE: () => onUpdateSuccess(),
    PASSWORD_RESET: () => handlePassSuccess(recipient),
  };

  let isAuthPurpose =
    activeTransit?.purpose === "ACCOUNT_VERIFICATION" ||
    activeTransit?.purpose === "PASSWORD_RESET";

  /**
   * Hydrates state from transitData when available.
   */
  useEffect(() => {
    if (activeTransit) {
      setChannel(activeTransit.channel);
      setRecipient(activeTransit.identifier);
    }
  }, [activeTransit]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setInlineMsg(null);
    }
  }, [timer]);

  // Auto-dispatch logic on load
  useEffect(() => {
    const canDispatch =
      options.dispatchOnload && activeTransit && !hasDispatchedOnLoad.current;
    if (canDispatch) {
      hasDispatchedOnLoad.current = true;
      queueMicrotask(() => {
        handleSendOtp();
      });
    }
  }, [activeTransit?.identifier, options.dispatchOnload]);

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
    onSuccess: (_, vars) => {
      if (!activeTransit) return;

      const executeStrategy = verificationStrategies[vars.purpose];
      if (executeStrategy) {
        executeStrategy(
          activeTransit.payload,
          activeTransit?.onVerificationSuccess,
        );
      }
    },
    onError: (error: ApiError) =>
      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(AUTH_FEEDBACK.otp_invalid_code),
      ),
  });

  /**
   * Execution Layer: Dumb Dispatch Mutation
   */
  const { mutate: executeDispatch, isPending: isSending } = useMutation({
    mutationFn: async (request: OtpRequest) => dispatchOtp(request),
    onSuccess: (_, vars) => {
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

      const { purpose, identifier } = activeTransit;

      const method = (() => {
        if (channel === "AUTHENTICATOR") {
          const tFAPurpose: TFAPurpose = isAuthPurpose
            ? "AUTHENTICATE"
            : "TFA_SETUP";
          return () =>
            verifyTFA({
              purpose: tFAPurpose,
              token: finalCode,
              identifier,
            });
        }
        if (isAuthPurpose)
          return () => verifyOtp({ recipient: identifier, code: finalCode });
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
      executeVerify,
      verifyOtp,
      finalizeEmailUpdateOtp,
      finalizePhoneUpdateOtp,
      verifyTFA,
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
        return executeDispatch(customRequest);
      }
      if (!recipient || !channel) return;
      executeDispatch({
        recipient,
        purpose: activeTransit?.purpose ?? "ACCOUNT_VERIFICATION",
        channel,
      });
    },
    [recipient, channel, timer, activeTransit, executeDispatch],
  );

  /**
   * Switches the active channel and immediately triggers a new OTP.
   * This bypasses the 60s timer to allow immediate switching.
   */
  const switchChannel = useCallback(() => {
    if (!activeTransit?.payload) return;
    const nextChannel: OtpChannel = channel === "EMAIL" ? "PHONE" : "EMAIL";

    const nextDest = (() => {
      if (isAuthPurpose) {
        const user = activeTransit.payload as any;
        return nextChannel === "PHONE" ? user.phoneNumber : user.email;
      }
      return undefined;
    })();

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
  }, [channel, activeTransit, isAuthPurpose, handleSendOtp, setSBMessage]);

  /**
   * Explicitly switches the verification channel into Authenticator device mode.
   */
  const switchToAuthenticator = useCallback(() => {
    setTimer(0);
    setChannel("AUTHENTICATOR");
    setInlineMsg(null);
  }, []);

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
