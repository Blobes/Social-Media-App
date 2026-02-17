import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@shared-state";
import { useLoginService } from "../service";
import { validateEmail, delay } from "@helpers";

interface EmailProps {
  existingEmail?: string;
  setStep?: (step: string) => void;
  setEmailProp?: (email: string) => void;
}

export const useEmail = ({
  existingEmail,
  setStep,
  setEmailProp,
}: EmailProps) => {
  const router = useRouter();
  const { checkEmail } = useLoginService();
  const { isAuthLoading, setAuthLoading, setInlineMsg } = useGlobalContext();

  // Local UI State
  const [email, setEmail] = useState(existingEmail ?? "");
  const [validity, setValidity] = useState<"valid" | "invalid">();
  const [validationMsg, setValidationMsg] = useState("");

  // Validate existing email on mount (if user moves back from password step)
  useEffect(() => {
    if (existingEmail) {
      const validation = validateEmail(existingEmail);
      if (validation.status === "valid") {
        setValidity("valid");
      }
    }
  }, [existingEmail]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setEmail(value);

      const validation = validateEmail(value);
      if (validation.status === "valid") {
        setValidity("valid");
        setValidationMsg("");
      } else {
        setValidity("invalid");
        setValidationMsg(validation.message);
      }
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validity !== "valid" || !email) return;

    setAuthLoading(true);
    setInlineMsg(null); // Clear previous errors

    try {
      await delay(); // Visual buffer if needed
      const res = await checkEmail(email);

      if (res.emailNotTaken === false) {
        // User exists -> Go to Login (Password step)
        setEmailProp?.(email);
        setStep?.("login");
      } else {
        // User doesn't exist -> Redirect to Signup
        router.replace(`/signup?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      setInlineMsg(error.message || "An error occurred. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    email,
    validity,
    validationMsg,
    isAuthLoading,
    handleChange,
    handleSubmit,
    isSubmitDisabled: validity === "invalid" || email === "" || isAuthLoading,
  };
};
