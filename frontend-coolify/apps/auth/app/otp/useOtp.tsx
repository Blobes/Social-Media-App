"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGlobalStore, useSnackbar } from "@repo/shared-hooks";
import { Purpose, OtpTransitData, OtpChannel, IUser } from "@repo/core";
import { OtpRequest, OtpService } from "./service";
import { useMutation } from "@tanstack/react-query";
import { useFeedback } from "./useFeedback";

interface UseOtpOptions {
  dispatchOnload?: boolean;
}

/**
 * Manages OTP logic by decoupling the "Dumb" API calls from the "Smart" orchestration.
 */
export const useOtp = <P extends Purpose>(
  transitData?: OtpTransitData<P>,
  options: UseOtpOptions = { dispatchOnload: false },
) => {
  const { verifyOtp, verifyEmailOtp, verifyPhoneOtp, dispatchOtp } =
    OtpService();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const { setSBMessage } = useSnackbar();
  const { handleLoginOtpSuccess, onUpdateSuccess } = useFeedback();

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);

  // Cast transitData.channel to OtpChannel or fallback to EMAIL
  const [channel, setChannel] = useState<OtpChannel>(
    transitData?.channel || "EMAIL",
  );
  const [recipient, setRecipient] = useState(transitData?.identifier);
  const hasDispatchedOnLoad = useRef(false);

  /**
   * Hydrates state from transitData when available.
   */
  useEffect(() => {
    if (transitData) {
      setChannel(transitData.channel);
      setRecipient(transitData.identifier);
    }
  }, [transitData]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Auto-dispatch logic on load
  useEffect(() => {
    const canDispatch =
      options.dispatchOnload && transitData && !hasDispatchedOnLoad.current;
    if (canDispatch) {
      hasDispatchedOnLoad.current = true;
      queueMicrotask(() => {
        handleSendOtp();
      });
    }
  }, [transitData?.identifier, options.dispatchOnload]);

  /**
   * Execution Layer: Dumb Verification Mutation
   */
  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (params: {
      purpose: Purpose;
      method: () => Promise<any>;
    }) => {
      return await params.method();
    },
    onSuccess: (_, vars) => {
      if (vars.purpose === "LOGIN")
        handleLoginOtpSuccess(
          transitData?.payload as IUser,
          transitData?.onVerificationSuccess,
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
          duration: 10,
        },
      });
    },
    onError: (error: any) =>
      setInlineMsg(error.message || "Failed to send code."),
  });

  /**
   * Orchestration Layer: Verification
   */
  const handleVerify = useCallback(
    async (validationCode?: string) => {
      setInlineMsg(null);

      const finalCode = validationCode || code;

      if (!transitData) return setInlineMsg("Missing session data.");
      if (finalCode.length < 6) return;

      const { purpose, identifier } = transitData;

      const method = (() => {
        if (purpose === "LOGIN")
          return () => verifyOtp({ recipient: identifier, code: finalCode });
        if (purpose === "ACCOUNT_UPDATE") {
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
      transitData,
      code,
      channel,
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
      // Manual override (Highest flexibility)
      if (customRequest) {
        return executeDispatch(customRequest);
      }
      // State-based fallback (Strict check)
      if (!recipient || !channel || timer > 0) return;
      executeDispatch({
        recipient,
        purpose: transitData?.purpose ?? "LOGIN",
        channel,
      });
    },
    [recipient, channel, timer, transitData, executeDispatch],
  );

  /**
   * Switches the active channel and immediately triggers a new OTP.
   * This bypasses the 60s timer to allow immediate switching.
   */
  const switchChannel = useCallback(() => {
    if (!transitData?.payload) return;
    const nextChannel: OtpChannel = channel === "EMAIL" ? "PHONE" : "EMAIL";
    // Resolve the new destination based on the purpose
    const nextDest = (() => {
      if (transitData.purpose === "LOGIN") {
        // We know payload is IUser in LOGIN purpose
        const user = transitData.payload as any;
        return nextChannel === "PHONE" ? user.phoneNumber : user.email;
      }
      return undefined;
    })();

    // Error handling if the destination doesn't exist on the profile
    if (!nextDest) {
      setSBMessage({
        msg: {
          tagline: `No ${nextChannel.toLowerCase()} found on your profile.`,
          msgStatus: "ERROR",
        },
      });
      return;
    }

    // Reset timer and sync local state
    setTimer(0);
    setChannel(nextChannel);
    setRecipient(nextDest);

    // Trigger the decoupled resend logic with the new targets
    handleSendOtp({
      recipient: nextDest,
      purpose: transitData.purpose,
      channel: nextChannel,
    });
  }, [channel, transitData, handleSendOtp, setSBMessage]);

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
