import { useMutation } from "@tanstack/react-query";
import { useDebounce, useGlobalStore } from "@repo/shared-hooks";
import { useCallback, useEffect, useState } from "react";
import { validateInputs, validateUsername } from "@repo/helpers";
import { OnboardingService } from "../../service";
import { LoginService } from "../../../login/service";

/**
 * Manages Identity logic using the updated bulk validator.
 */
export const useIdentity = (onSuccess?: () => void) => {
  const { checkUsername } = LoginService();
  const { syncIdentity, updateProgress } = OnboardingService();
  const setInlineMsg = useGlobalStore((state) => state.setInlineMsg);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
  });

  const [usernameStatus, setUsernameStatus] = useState<{
    status: "IDLE" | "CHECKING" | "TAKEN" | "AVAILABLE";
    suggestions?: string[];
  }>({ status: "IDLE" });

  const debouncedUsername = useDebounce(formData.username, 500);

  useEffect(() => {
    const checkAvailability = async () => {
      // Local format check before API call
      const isInvalid = validateUsername(debouncedUsername);
      if (isInvalid) return;

      setUsernameStatus({ status: "CHECKING" });
      const res = await checkUsername(debouncedUsername, "SIGNUP");

      if (res.isExisting) {
        setUsernameStatus({ status: "TAKEN", suggestions: res.suggestions });
      } else {
        setUsernameStatus({ status: "AVAILABLE" });
      }
    };

    if (debouncedUsername) checkAvailability();
  }, [debouncedUsername, checkUsername]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Reset availability status when handle changes
      if (name === "username") setUsernameStatus({ status: "IDLE" });
    },
    [],
  );

  // Perform bulk check on all local identity fields
  const isLocalValid = !validateInputs([
    { value: formData.firstName, type: "NAME" },
    { value: formData.lastName, type: "NAME" },
    { value: formData.username, type: "USERNAME" },
  ]);

  const isFormValid =
    isLocalValid &&
    (usernameStatus.status === "AVAILABLE" || usernameStatus.status === "IDLE");

  const { mutate: submitIdentity, isPending } = useMutation({
    mutationFn: async () => {
      // Persist identity data to DB
      await syncIdentity(formData);
      // Advance user state to demographics step in
      return await updateProgress("DEMOGRAPHICS", false);
    },
    onSuccess: () => {
      setInlineMsg(null);
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setInlineMsg(err.message || "An error occurred during sync");
      setUsernameStatus({ status: "IDLE" });
    },
  });

  return {
    formData,
    handleChange,
    submitIdentity,
    isPending,
    isFormValid,
    usernameStatus,
    setFormData,
  };
};
