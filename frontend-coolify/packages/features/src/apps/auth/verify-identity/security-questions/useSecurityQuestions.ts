"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  TransitPurpose,
  useGlobalStore,
  AUTH_FEEDBACK,
  ApiError,
  ITranslation,
  AUTH_SECURITY_QUESTIONS,
} from "@repo/core";
import { useSnackbar, useStaticTranslation } from "@repo/shared-hooks";
import { SelectOption } from "@repo/shared-ui";
import { VerifyIdentityService } from "../service";
import { useFeedback } from "../useFeedback";
import {
  createVerificationStrategies,
  executeVerificationStrategy,
} from "../helpers";
import { BaseVerificationProps } from "../useVerifyIdentity";

export const SECURITY_QUESTIONS = (
  translateTxtString: (transData: ITranslation) => string,
) =>
  [
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_1),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_2),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_3),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_4),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_5),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_6),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_7),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_8),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_9),
    translateTxtString(AUTH_SECURITY_QUESTIONS.question_10),
  ] as const;

type SecurityQuestion = ReturnType<typeof SECURITY_QUESTIONS>[number];

export interface SecurityQuestionState {
  question: SecurityQuestion | "";
  answer: string;
}

/**
 * Handles security questions verification logic, input state, filtering, and API submission.
 */
export const useSecurityQuestions = <P extends TransitPurpose>(
  props: BaseVerificationProps<P> = {},
) => {
  const {
    activeTransit,
    onRateLimitExceeded,
    isBotChallengeAllowed,
    onSuccess,
  } = props;

  const { verifySecurityQuestions, commitAccountUpdate } =
    VerifyIdentityService();

  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);
  const inlineMsg = useGlobalStore((state) => state.inlineMsg);
  const { setSBMessage } = useSnackbar();
  const {
    handleAuthSuccess,
    handleAccountUpdateSuccess,
    handlePassResetSuccess,
    handleMfaActivationSuccess,
  } = useFeedback();
  const { translateTxtString } = useStaticTranslation();

  const [questionStates, setQuestionStates] = useState<SecurityQuestionState[]>(
    [
      { question: "", answer: "" },
      { question: "", answer: "" },
      { question: "", answer: "" },
    ],
  );

  const targetIdentifier = activeTransit?.identifier || "";

  const verificationStrategies = useMemo(
    () =>
      createVerificationStrategies({
        handleAuthSuccess,
        handleAccountUpdateSuccess,
        handlePassResetSuccess,
        handleMfaActivationSuccess,
        recipient: targetIdentifier,
      }),
    [
      handleAuthSuccess,
      handleAccountUpdateSuccess,
      handlePassResetSuccess,
      handleMfaActivationSuccess,
      targetIdentifier,
    ],
  );

  /**
   * Computes available select options for a given index by excluding questions selected in other fields.
   */
  const getOptionsForIndex = useCallback(
    (index: number): SelectOption[] => {
      const selectedElsewhere = questionStates
        .filter((_, i) => i !== index)
        .map((qs) => qs.question)
        .filter((q): q is SecurityQuestion => Boolean(q));

      return SECURITY_QUESTIONS(translateTxtString)
        .filter((q) => !selectedElsewhere.includes(q))
        .map((q) => ({
          id: q,
          value: q,
          title: q,
        }));
    },
    [questionStates],
  );

  /**
   * Updates question selection at a specific index.
   */
  const handleQuestionChange = useCallback(
    (index: number, option: SelectOption) => {
      setQuestionStates((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          question: option.value as SecurityQuestion,
        };
        return updated;
      });
    },
    [],
  );

  /**
   * Updates answer value at a specific index.
   */
  const handleAnswerChange = useCallback((index: number, answer: string) => {
    setQuestionStates((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], answer };
      return updated;
    });
  }, []);

  /**
   * Clears selection and answer at a specific index.
   */
  const handleClear = useCallback((index: number) => {
    setQuestionStates((prev) => {
      const updated = [...prev];
      updated[index] = { question: "", answer: "" };
      return updated;
    });
  }, []);

  const isFormValid = useMemo(() => {
    return questionStates.every(
      (qs) => Boolean(qs.question) && qs.answer.trim().length > 0,
    );
  }, [questionStates]);

  const { mutateAsync: executeVerify, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const payload = {
        identifier: targetIdentifier,
        answers: questionStates.map((qs) => ({
          question: qs.question,
          answer: qs.answer.trim(),
        })),
      };

      const response = await verifySecurityQuestions(payload);

      if (activeTransit?.purpose) {
        await commitAccountUpdate({
          identifier: targetIdentifier,
          purpose: activeTransit.purpose,
        });
      }

      return response;
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
      if (activeTransit) {
        executeVerificationStrategy(activeTransit, verificationStrategies);
      }
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
          translateTxtString(
            AUTH_FEEDBACK.security_questions_verification_failed,
          ),
      );
    },
  });

  /**
   * Dispatches verification payload.
   */
  const handleVerify = useCallback(async () => {
    setInlineMsg(null);

    if (!activeTransit) {
      setInlineMsg(
        translateTxtString(
          AUTH_FEEDBACK.missing_verification_session("Security Questions"),
        ),
      );
      return;
    }

    if (!isFormValid) return;

    await executeVerify();
  }, [
    activeTransit,
    isFormValid,
    executeVerify,
    setInlineMsg,
    translateTxtString,
  ]);

  return {
    questionStates,
    getOptionsForIndex,
    handleQuestionChange,
    handleAnswerChange,
    handleClear,
    isFormValid,
    isVerifying,
    handleVerify,
    inlineMsg,
  };
};
