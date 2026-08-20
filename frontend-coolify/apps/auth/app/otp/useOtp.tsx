"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import {
  TransitPurpose,
  OtpTransitData,
  OtpMessageChannel,
  OtpGeneratorMethod,
  useGlobalStore,
  AUTH_FEEDBACK,
  ApiError,
  IdentifierType,
} from "@repo/core";
import { OtpRequest, OtpService, TotpActionType } from "./service";
import { useMutation } from "@tanstack/react-query";
import { useFeedback } from "./useFeedback";
import { getFromLocalStorage, saveToLocalStorage } from "@repo/helpers";
import {
  createVerificationStrategies,
  executeVerificationStrategy,
  resolveChannelRecipient,
} from "./strategies";
import { useAuthNavigation } from "@repo/features";

export interface OtpOptions<P extends TransitPurpose> {
  dispatchOnload?: boolean;
  setShouldRestrict?: (value: boolean) => void;
  transitData?: OtpTransitData<P>[];
  onRateLimitExceeded?: () => void;
  isBotChallengeAllowed?: () => boolean;
}

const HOUR_IN_MS = 12 * 60 * 60 * 1000;
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
 * Manages OTP state, dispatching, and verification mechanisms across messaging channels.
 */
export const useOtp = <P extends TransitPurpose>(
  options: OtpOptions<P> = {},
) => {
  const {
    transitData,
    dispatchOnload = true,
    setShouldRestrict,
    onRateLimitExceeded,
    isBotChallengeAllowed,
  } = options;

  const {
    verifyMsgCode,
    dispatchMsgCode,
    verifyTotpCode,
    finalizeEmailUpdateOtp,
    finalizePhoneUpdateOtp,
    commitAccountUpdate,
  } = OtpService();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const authUser = useGlobalStore((state) => state.authUser);
  const { setSBMessage } = useSnackbar();
  const { handleAuthOtpSuccess, onUpdateSuccess, handlePassResetSuccess } =
    useFeedback();
  const { translateTxtString } = useStaticTranslation();
  const { checkTotpConfiguration } = useAuthNavigation();

  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);

  const activeTransit = transitData?.[0];

  const [generatorMethod, setGeneratorMethod] = useState<OtpGeneratorMethod>(
    activeTransit?.otpGeneratorMethod || "MESSAGING_APP",
  );
  const [msgChannel, setMsgChannel] = useState<OtpMessageChannel>(
    activeTransit?.otpMessageChannel || "EMAIL",
  );
  const [recipient, setRecipient] = useState<string | undefined>(
    activeTransit?.identifier,
  );

  const hasDispatchedOnLoad = useRef(false);
  const initialIdentifierRef = useRef(activeTransit?.identifier);
  const hasUserCtx =
    authUser && !authUser.isEmailVerified && !authUser.isPhoneVerified;

  const hasTotpConfigured = checkTotpConfiguration(authUser);

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
    if (
      activeTransit?.otpMessageChannel &&
      generatorMethod === "MESSAGING_APP"
    ) {
      setMsgChannel(activeTransit.otpMessageChannel);
    }
    if (
      activeTransit?.otpGeneratorMethod &&
      generatorMethod === "AUTHENTICATOR_APP"
    ) {
      setGeneratorMethod(activeTransit.otpGeneratorMethod);
    }
  }, [
    activeTransit?.identifier,
    activeTransit?.otpMessageChannel,
    activeTransit?.otpGeneratorMethod,
    recipient,
  ]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setInlineMsg(null);
    }
  }, [timer, setInlineMsg]);

  /**
   * Execution Layer: Dumb Dispatch Mutation
   */
  const { mutate: executeDispatch, isPending: isSending } = useMutation({
    mutationFn: async (request: OtpRequest) => {
      const dispatchResponse = await dispatchMsgCode(request);

      const targetIdentifier =
        request.recipient ||
        recipient ||
        activeTransit?.identifier ||
        initialIdentifierRef.current;

      const currentPurpose =
        request.purpose ?? activeTransit?.purpose ?? "LOGIN_VERIFICATION";

      const currentOtpIdentifierType: IdentifierType =
        (request.messageChannel || msgChannel) === "EMAIL"
          ? "EMAIL"
          : "PHONE_NUMBER";

      await commitAccountUpdate({
        identifier: targetIdentifier,
        purpose: currentPurpose,
        otpIdentifierType: currentOtpIdentifierType,
      });

      return dispatchResponse;
    },
    onSuccess: (_, vars) => {
      saveToLocalStorage<number>(LAST_DISPATCH_STORAGE_KEY, Date.now());
      setTimer(60);
      setCode("");
      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.new_code_sent_tagline(
              vars.messageChannel?.toLowerCase() || "email",
            ),
          ),
          msgStatus: "SUCCESS",
          duration: 6,
        },
      });
    },
    onError: (error: ApiError) => {
      const errMsg =
        error.localizedErrMsg ||
        translateTxtString(AUTH_FEEDBACK.otp_send_code_failed);

      const retryAfter = error.retryAfter ?? error.payload?.retryAfter;

      if (typeof retryAfter === "number" && retryAfter > 0) {
        setTimer(retryAfter);
        setInlineMsg(errMsg);
        return;
      }

      if (error.httpStatus === 429) {
        const canTriggerChallenge = isBotChallengeAllowed
          ? isBotChallengeAllowed()
          : true;

        if (canTriggerChallenge) {
          onRateLimitExceeded?.();
        } else {
          setInlineMsg(errMsg);
        }
        return;
      }

      setInlineMsg(errMsg);
    },
  });

  /**
   * Orchestration Layer: Resend/Send
   */
  const handleSendOtp = useCallback(
    (customRequest?: OtpRequest) => {
      if (generatorMethod === "AUTHENTICATOR_APP") return;
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
      if (!targetRecipient || !msgChannel) return;

      executeDispatch({
        recipient: targetRecipient,
        messageChannel: msgChannel,
      });
    },
    [
      generatorMethod,
      recipient,
      msgChannel,
      activeTransit,
      authUser?.email,
      executeDispatch,
      setInlineMsg,
    ],
  );

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
  }, [
    activeTransit,
    authUser,
    dispatchOnload,
    hasUserCtx,
    setShouldRestrict,
    handleSendOtp,
  ]);

  /**
   * Execution Layer: Dumb Verification Mutation
   */
  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (params: {
      purpose: TransitPurpose;
      method: () => Promise<any>;
    }) => {
      const response = await params.method();

      await commitAccountUpdate({
        identifier: response.identifier,
        purpose: params.purpose,
        otpIdentifierType: response.otpIdentifierType,
        verificationToken: response.verificationToken,
      });

      return response;
    },
    onSuccess: () => {
      if (!activeTransit) return;
      executeVerificationStrategy(activeTransit, verificationStrategies);
    },
    onError: (error: ApiError) => {
      if (error.httpStatus === 429) {
        const canTriggerChallenge = isBotChallengeAllowed
          ? isBotChallengeAllowed()
          : true;

        if (canTriggerChallenge) {
          onRateLimitExceeded?.();
          return;
        }
      }
      setInlineMsg(
        error.localizedErrMsg ||
          translateTxtString(AUTH_FEEDBACK.otp_invalid_code),
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

      const { purpose } = activeTransit;
      const targetIdentifier =
        activeTransit.identifier ||
        recipient ||
        initialIdentifierRef.current ||
        "";

      const method = (() => {
        if (generatorMethod === "AUTHENTICATOR_APP") {
          const totpActionType: TotpActionType = isAuthPurpose
            ? "AUTHENTICATE"
            : "CONFIGURE";
          return () =>
            verifyTotpCode({
              actionType: totpActionType,
              token: finalCode,
              identifier: targetIdentifier,
            });
        }
        if (isAuthPurpose)
          return () =>
            verifyMsgCode({ recipient: targetIdentifier, code: finalCode });
        if (purpose === "IDENTIFIER_UPDATE") {
          return msgChannel === "EMAIL"
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
      generatorMethod,
      isAuthPurpose,
      recipient,
      msgChannel,
      executeVerify,
      verifyMsgCode,
      finalizeEmailUpdateOtp,
      finalizePhoneUpdateOtp,
      verifyTotpCode,
      setInlineMsg,
      translateTxtString,
    ],
  );

  /**
   * Switches the active channel directly to target channel and triggers a fresh OTP dispatch.
   */
  const switchChannel = useCallback(
    (targetChannel: OtpMessageChannel) => {
      if (!activeTransit || !hasUserCtx) {
        setInlineMsg(translateTxtString(AUTH_FEEDBACK.otp_send_code_failed));
        return;
      }

      const nextIdentifierType: IdentifierType =
        targetChannel === "EMAIL" ? "EMAIL" : "PHONE_NUMBER";

      const nextDest = resolveChannelRecipient(
        activeTransit,
        nextIdentifierType,
        recipient || initialIdentifierRef.current,
      );

      if (!nextDest) {
        setSBMessage({
          msg: {
            tagline: translateTxtString(
              AUTH_FEEDBACK.no_email_or_phone(targetChannel.toLowerCase()),
            ),
          },
        });
        return;
      }

      setTimer(0);
      setGeneratorMethod("MESSAGING_APP");
      setMsgChannel(targetChannel);
      setRecipient(nextDest);

      handleSendOtp({
        recipient: nextDest,
        purpose: activeTransit.purpose,
        messageChannel: targetChannel,
      });
    },
    [
      activeTransit,
      hasUserCtx,
      recipient,
      handleSendOtp,
      setSBMessage,
      translateTxtString,
      setInlineMsg,
    ],
  );

  /**
   * Explicitly switches the verification generator method into Authenticator App mode if configured.
   */
  const switchToAuthenticator = useCallback(() => {
    if (!hasTotpConfigured) {
      setSBMessage({
        msg: {
          tagline: translateTxtString(
            AUTH_FEEDBACK.authenticator_not_configured,
          ),
        },
      });
      return;
    }
    setTimer(0);
    setGeneratorMethod("AUTHENTICATOR_APP");
    setInlineMsg(null);
  }, [hasTotpConfigured, setSBMessage, setInlineMsg, translateTxtString]);

  return {
    code,
    setCode,
    timer,
    isVerifying,
    isSending,
    handleVerify,
    handleSendOtp,
    generatorMethod,
    msgChannel,
    switchChannel,
    switchToAuthenticator,
    hasTotpConfigured,
    recipient,
    setRecipient,
    inlineMsg,
  };
};
