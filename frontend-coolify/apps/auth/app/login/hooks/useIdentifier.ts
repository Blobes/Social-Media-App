"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useGlobalContext } from "@repo/shared-state";
import { LoginService } from "../service";
import {
  delay,
  formatPhoneNumber,
  getInputValidity,
  sanitizePhoneNumber,
} from "@repo/helpers";
import { AccountStatus, InputStatus, MenuRef } from "@repo/core";
import { StepName } from "../../types";

interface CredentialProps {
  existingInput?: string;
  setStep?: (step: StepName) => void;
  setIdentifier?: (credential: string) => void;
}

export const useIdentifier = ({
  existingInput,
  setStep,
  setIdentifier: setCredential,
}: CredentialProps) => {
  const { checkEmail, checkPhone, checkUsername } = LoginService();
  const { isAuthLoading, setAuthLoading, setInlineMsg } = useGlobalContext();
  const countryMenuRef = useRef<MenuRef>(null);

  // Local UI State
  const [input, setInput] = useState(existingInput ?? "");
  const [validity, setValidity] = useState<InputStatus>();
  const [validationMsg, setValidationMsg] = useState("");
  const [accStatus, setAccStatus] = useState<AccountStatus>();

  const inputValidity = getInputValidity(input);
  const isValidInput = inputValidity.status === "VALID";

  useEffect(() => {
    if (input !== "" && isValidInput) setValidity("VALID");
  }, [existingInput, isValidInput]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const isDeleting =
        (e.nativeEvent as any).inputType === "deleteContentBackward";
      let start = target.selectionStart || 0;
      let inputValue = target.value;

      const hasLetters = /[a-zA-Z]/.test(inputValue);
      const isPhoneAttempt = /^[0-9+\(]/.test(inputValue);

      if (isPhoneAttempt && !hasLetters && inputValue.length > 0) {
        // RESTORED: Trigger menu on first character
        if (inputValue.length < 3) {
          countryMenuRef.current?.openMenu(target);
        }

        const oldLen = inputValue.length;
        inputValue = formatPhoneNumber(inputValue);
        const newLen = inputValue.length;

        // Adjust cursor: If the formatter added characters (like brackets/spaces),
        // we move the pointer forward so the user stays on the digit they typed.
        if (!isDeleting) {
          start = start + (newLen - oldLen);
        }
      }

      // Update States
      setInput(inputValue);
      setAccStatus(undefined);

      // RESTORED: Pointer Management
      // We use requestAnimationFrame to ensure the DOM has updated with the
      // new 'inputValue' before we force the cursor position.
      window.requestAnimationFrame(() => {
        target.setSelectionRange(start, start);
      });

      // Validation Logic
      validateAndSet(inputValue);
    },
    [setInput, setValidity, setValidationMsg],
  );

  const validateAndSet = useCallback(
    (value: string) => {
      setInput(value);
      const result = getInputValidity(value);
      setValidity(result.status === "VALID" ? "VALID" : "INVALID");
      setValidationMsg(
        result.status === "INVALID" ? (result.message ?? "") : "",
      );
    },
    [setInput, setValidity, setValidationMsg],
  );

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;

    setAuthLoading(true);
    setInlineMsg(null);

    try {
      await delay();
      const inputType = inputValidity.type;

      // Transform if phone number " (080) 576-58540 " -> "+2348057658540"
      const cleaned =
        inputValidity.type === "PHONE" ? sanitizePhoneNumber(input) : input;

      // Passing "LOGIN" for username checks to ensure we get deactivated status
      const res = await (inputType === "EMAIL"
        ? checkEmail(cleaned)
        : inputType === "PHONE"
          ? checkPhone(cleaned)
          : checkUsername(cleaned, "LOGIN"));

      if (
        res.status === "SUCCESS" &&
        res.payload &&
        res.payload.accountStatus === "DEACTIVATED"
      ) {
        // setAccStatus("DEACTIVATED");
        setStep?.("RESTORE");
        // setInlineMsg(
        //   res.message ||
        //     "This account is deactivated. Please restore it to log in.",
        // );
        return;
      }

      // 2. Handle Existing User (Account found)
      if (res.status === "SUCCESS" && res.isExisting === true) {
        setCredential?.(input);
        setStep?.("PASSWORD");
      }
      // 3. Handle Credential Not Found
      else {
        setInlineMsg(
          `We couldn't find an account with the ${
            inputType?.toLowerCase() + (inputType === "PHONE" ? " number" : "")
          }.
         `,
        );
      }
    } catch (error: any) {
      setInlineMsg(error.message || "An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    input,
    setInput,
    // accStatus,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled: validity === "INVALID" || input === "" || isAuthLoading,
    countryMenuRef,
    validateAndSet,
  };
};
