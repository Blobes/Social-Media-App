import { useState, useEffect, useCallback } from "react";
import { useGlobalContext } from "@repo/shared-state";
import { LoginService } from "../service";
import { delay, getInputValidity } from "@repo/helpers";
import { AccountStatus, InputStatus } from "@repo/core";
import { StepName } from "../Login";

interface CredentialProps {
  existingInput?: string;
  setStep?: (step: StepName) => void;
  setCredential?: (credential: string) => void;
}

export const useCredential = ({
  existingInput,
  setStep,
  setCredential,
}: CredentialProps) => {
  const { checkEmail, checkUsername } = LoginService();
  const { isAuthLoading, setAuthLoading, setInlineMsg } = useGlobalContext();

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
      const value = e.target.value;
      setInput(value);
      setAccStatus(undefined);

      // Using your preferred function name
      const currentValidity = getInputValidity(value);

      if (currentValidity.status === "VALID") {
        setValidity("VALID");
        setValidationMsg("");
      } else {
        setValidity("INVALID");
        setValidationMsg(currentValidity.message || "");
      }
    },
    [isValidInput],
  );

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!isValidInput || !input) return;

    setAuthLoading(true);
    setInlineMsg(null);

    try {
      await delay();
      const inputType = inputValidity.type;

      // Passing "LOGIN" for username checks to ensure we get deactivated status
      const res = await (inputType === "EMAIL"
        ? checkEmail(input)
        : checkUsername(input, "LOGIN"));

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
      if (res.status === "SUCCESS" && res.isCredentialAvailable === false) {
        setCredential?.(input);
        setStep?.("PASSWORD");
      }
      // 3. Handle Credential Not Found
      else {
        setInlineMsg(
          `We couldn't find an account with that ${inputType?.toLowerCase()}.`,
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
    // accStatus,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled: validity === "INVALID" || input === "" || isAuthLoading,
  };
};
