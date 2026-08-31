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
  ISinglePayload,
} from "@repo/core";
import {
  OtpRequest,
  OtpResponse,
  OtpService,
  TotpActionType,
  IdentifierChangeResult,
  TotpVerificationResponse,
} from "./service";
import { useMutation } from "@tanstack/react-query";
import { useFeedback } from "./useFeedback";
import {
  extractPayloadKeys,
  getFromLocalStorage,
  saveToLocalStorage,
} from "@repo/helpers";
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

type VerificationPayload =
  | OtpResponse
  | IdentifierChangeResult
  | TotpVerificationResponse;

const HOUR_IN_MS = 12 * 60 * 60 * 1000;
const LAST_DISPATCH_STORAGE_KEY = "otp_last_dispatch_time";

/**
 * Checks whether the required duration has elapsed since the last dispatch.
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
   * Creates verification strategy map scoped with current dependencies.
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
    activeTransit?.purpose === "SIGNUP_VERIFICATION" ||
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
    generatorMethod,
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
   * Dispatches an OTP request payload to the server.
   */
  const { mutate: executeDispatch, isPending: isSending } = useMutation({
    mutationFn: async (request: OtpRequest) => {
      return await dispatchMsgCode(request);
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
   * Handles orchestrating OTP generation and resend dispatching.
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
   * Verifies the provided verification code and updates account state using the backend payload.
   */
  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async (params: {
      purpose: TransitPurpose;
      method: () => Promise<ISinglePayload<VerificationPayload>>;
    }) => {
      const response = await params.method();
      const payloadData = response.payload;

      const { identifier, verificationToken, otpIdentifierType } =
        extractPayloadKeys(payloadData, [
          "identifier",
          "verificationToken",
          "otpIdentifierType",
        ]);

      // const identifier =
      //   payloadData && "identifier" in payloadData
      //     ? payloadData.identifier
      //     : undefined;

      // const verificationToken =
      //   payloadData && "verificationToken" in payloadData
      //     ? payloadData.verificationToken
      //     : undefined;

      // const otpIdentifierType =
      //   payloadData && "otpIdentifierType" in payloadData
      //     ? payloadData.otpIdentifierType
      //     : undefined;

      await commitAccountUpdate({
        identifier: identifier as string | undefined,
        purpose: params.purpose,
        otpIdentifierType: otpIdentifierType as IdentifierType | undefined,
        verificationToken: verificationToken as string | undefined,
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
   * Orchestrates verification processing for active security purpose.
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
   * Switches active delivery channel and dispatches new code.
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
   * Switches verification generator to Authenticator App mode if active.
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
