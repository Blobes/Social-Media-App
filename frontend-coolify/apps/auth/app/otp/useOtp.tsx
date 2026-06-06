"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGlobalStore, useSnackbar } from "@repo/shared-hooks";
import { TransitPurpose, OtpTransitData, OtpChannel, IUser } from "@repo/core";
import { OtpRequest, OtpService } from "./service";
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
  const { verifyOtp, verifyEmailOtp, verifyPhoneOtp, dispatchOtp } =
    OtpService();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const { setSBMessage } = useSnackbar();
  const { handleAuthOtpSuccess, onUpdateSuccess } = useFeedback();

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);

  // if (!transitData) return;

  // Extract separate operations by filtering against their specific flow types
  const authTransitData = transitData?.find(
    (item) =>
      item.purpose === "LOGIN_VERIFICATION" ||
      item.purpose === "SIGNUP_VERIFICATION",
  );

  const updateTransitData = transitData?.find(
    (item) =>
      item.purpose === "ACCOUNT_UPDATE" || item.purpose === "IDENTIFIER_UPDATE",
  );

  // Primary operational fallback values prioritized by active flow instance
  const activeTransit =
    authTransitData || updateTransitData || transitData?.[0];

  const [channel, setChannel] = useState<OtpChannel>(
    activeTransit?.channel || "EMAIL",
  );
  const [recipient, setRecipient] = useState(activeTransit?.identifier);
  const hasDispatchedOnLoad = useRef(false);

  let isAuthPurpose =
    activeTransit?.purpose === "LOGIN_VERIFICATION" ||
    activeTransit?.purpose === "SIGNUP_VERIFICATION";

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
      isAuthPurpose =
        vars.purpose === "LOGIN_VERIFICATION" ||
        vars.purpose === "SIGNUP_VERIFICATION";
      if (isAuthPurpose)
        handleAuthOtpSuccess(
          authTransitData?.payload as IUser,
          authTransitData?.onVerificationSuccess,
        );
      if (vars.purpose === "ACCOUNT_UPDATE") onUpdateSuccess();
    },
    onError: (err: any) => setInlineMsg(err.message || "Invalid code."),
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
          tagline: `A new code has been sent to your ${vars.channel?.toLowerCase()}.`,
          msgStatus: "SUCCESS",
          duration: 6,
        },
      });
    },
    onError: (error: any) => {
      const seconds = stripToNumbers(error.message);
      setTimer(seconds);
      setInlineMsg(error.message || "Failed to send code.");
    },
  });

  /**
   * Orchestration Layer: Verification
   */
  const handleVerify = useCallback(
    async (validationCode?: string) => {
      setInlineMsg(null);

      const finalCode = validationCode || code;

      if (!activeTransit) return setInlineMsg("Missing session data.");
      if (finalCode.length < 6) return;

      const { purpose, identifier } = activeTransit;

      const method = (() => {
        if (isAuthPurpose)
          return () => verifyOtp({ recipient: identifier, code: finalCode });
        if (purpose === "IDENTIFIER_UPDATE") {
          return channel === "EMAIL"
            ? () => verifyEmailOtp(finalCode)
            : () => verifyPhoneOtp(finalCode);
        }
        return null;
      })();

      if (!method) return setInlineMsg("Unsupported verification method.");
      await executeVerify({ purpose, method });
    },
    [
      activeTransit,
      code,
      channel,
      isAuthPurpose,
      executeVerify,
      verifyOtp,
      verifyEmailOtp,
      verifyPhoneOtp,
    ],
  );

  /**
   * Orchestration Layer: Resend/Send
   */
  const handleSendOtp = useCallback(
    (customRequest?: OtpRequest) => {
      setInlineMsg(null);
      if (customRequest) {
        return executeDispatch(customRequest);
      }
      if (!recipient || !channel) return;
      executeDispatch({
        recipient,
        purpose: activeTransit?.purpose ?? "LOGIN_VERIFICATION",
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
          tagline: `No ${nextChannel.toLowerCase()} found on your profile.`,
          msgStatus: "ERROR",
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
    recipient,
    setRecipient,
    inlineMsg,
  };
};
