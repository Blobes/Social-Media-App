"use client";

import { useState, useEffect, useCallback } from "react";
import { useGlobalStore, useSnackbar } from "@repo/shared-hooks";
import { InputType, Purpose, OtpTransitData } from "@repo/core";
import { OtpService } from "./service";
import { useMutation } from "@tanstack/react-query";
import { useFeedback } from "./useFeedback";

/**
 * Manages OTP verification logic and transit data hydration.
 */
export const useOtp = <P extends Purpose>(transitData: OtpTransitData<P>) => {
  const { verifyOtp, verifyEmailOtp, verifyPhoneOtp, sendOtp } = OtpService();
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const { setSBMessage } = useSnackbar();
  const { onLoginSuccess, onUpdateSuccess } = useFeedback();

  const isLoginTransit = (
    data: OtpTransitData,
  ): data is OtpTransitData<"LOGIN"> => {
    return data.purpose === "LOGIN";
  };

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(60);

  // Initialize state based on transitData once it rehydrates
  const [channel, setChannel] = useState<InputType | undefined>(
    transitData?.channel || "EMAIL",
  );
  const [destination, setDestination] = useState(
    transitData?.identifier || "nick@gmail.co",
  );

  /**
   * Sync local state when transitData is rehydrated from cache.
   */
  useEffect(() => {
    if (transitData && !channel) {
      setChannel(transitData.channel);
      setDestination(transitData.identifier);
    }
  }, [transitData, channel]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  /**
   * Core verification mutation.
   */
  const { mutate: handleVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (otpCode: string) => {
      if (!transitData) throw new Error("Missing session data.");
      const { identifier, purpose } = transitData;

      if (purpose === "LOGIN") {
        return await verifyOtp(identifier, otpCode);
      }

      if (purpose === "ACCOUNT_UPDATE") {
        if (channel === "EMAIL") return await verifyEmailOtp(otpCode);
        if (channel === "PHONE") return await verifyPhoneOtp(otpCode);
      }
      throw new Error("Unsupported verification purpose.");
    },
    onSuccess: (res) => {
      const purpose = transitData?.purpose;

      //Branching logic based on the intent of the verification
      if (purpose === "LOGIN") {
        onLoginSuccess();
      } else if (purpose === "ACCOUNT_UPDATE") {
        onUpdateSuccess();
      }
    },
    onError: (err: any) => {
      setInlineMsg(err.message || "Invalid verification code.");
    },
  });

  /**
   * Mutation to handle OTP resending.
   */
  const { mutate: resendOtp, isPending: isSending } = useMutation({
    mutationFn: async (vars: {
      dest: string;
      purp: Purpose;
      channel: InputType;
    }) => {
      return await sendOtp(vars.dest, vars.purp);
    },
    onSuccess: (_, vars) => {
      setTimer(60);
      setSBMessage({
        msg: {
          tagline: `A new code has been sent to your ${vars.channel === "EMAIL" ? "email" : "phone"}.`,
          msgStatus: "SUCCESS",
        },
      });
    },
    onError: (error: any) => {
      setInlineMsg(error.message || "Failed to send code. Please try again.");
    },
  });

  /**
   * Triggers the OTP resend logic. Orchestrates local state updates and triggers the mutation.
   */
  const handleResend = useCallback(
    (targetDest?: string, targetChannel?: InputType) => {
      const dest = targetDest ?? destination;
      const activeChannel = targetChannel ?? channel;
      const purp = transitData?.purpose ?? "LOGIN";

      // 1. Validation
      if (!dest || !activeChannel || timer > 0) return;

      // 2. Immediate state sync for channel switching
      if (targetDest) setDestination(targetDest);
      if (targetChannel) setChannel(targetChannel);

      // 3. Execute mutation
      resendOtp({ dest, purp, channel: activeChannel });
    },
    [destination, channel, timer, transitData, resendOtp],
  );

  /**
   * Switches the active communication channel and triggers a new OTP.
   */
  const switchChannel = () => {
    if (!transitData?.payload) return;
    const nextChannel = channel === "EMAIL" ? "PHONE" : "EMAIL";

    const nextDest = (() => {
      // Check if we are in the LOGIN flow where payload is IUser
      if (isLoginTransit(transitData)) {
        return nextChannel === "PHONE"
          ? transitData.payload.phoneNumber
          : transitData.payload.email;
      }
      // Fallback for other purposes that might store the user differently
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

    // Clear timer so the user doesn't have to wait 60s just because they switched channels
    setTimer(0);
    // Hand off to resend with the new targets
    handleResend(nextDest, nextChannel);
  };

  return {
    transitData,
    code,
    setCode,
    timer,
    isVerifying,
    handleVerify,
    handleResend: () => handleResend(),
    switchChannel,
    channel,
    destination,
    inlineMsg,
    isSending,
  };
};
