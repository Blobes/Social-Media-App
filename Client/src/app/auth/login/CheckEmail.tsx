"use client";

import { useAuth } from "@/app/auth/login/authHooks";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAppContext } from "@/app/AppContext";
import { AppButton } from "@/components/Buttons";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { ModalRef } from "@/components/Modal";
import { validateEmail } from "@/helpers/input-validation";
import { useEffect, useState } from "react";
import { TextInput } from "@/components/InputFields";
import { GenericObject } from "@/types";
import { delay } from "@/helpers/others";

interface CheckProps {
  modalRef?: React.RefObject<ModalRef>;
  step?: string;
  setStep?: (step: string) => void;
  existingEmail?: string;
  setEmailProp?: (email: string) => void;
  style?: {
    headline?: GenericObject<string>;
    tagline?: GenericObject<string>;
  };
}

export const CheckEmail: React.FC<CheckProps> = ({
  modalRef,
  step,
  setStep,
  existingEmail,
  setEmailProp,
  style = {},
}) => {
  const { checkEmail } = useAuth(modalRef);
  const { isAuthLoading, setAuthLoading } = useAppContext();
  const [validity, setValidity] = useState<"valid" | "invalid">();
  const [msg, setMsg] = useState("");
  const [email, setEmail] = useState(existingEmail ?? "");
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (existingEmail && existingEmail !== "") {
      const validation = validateEmail(existingEmail);
      if (validation.status === "valid") {
        setValidity("valid");
        setMsg("");
      }
    }
  }, [step]);

  const onEmailChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setEmail(e.target.value);
    const validation = validateEmail(e.target.value);
    if (validation.status === "valid") {
      setValidity("valid");
      setMsg("");
    } else {
      setValidity("invalid");
      setMsg(validation.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setAuthLoading(true);

    await delay();

    const res = await checkEmail(email);
    if (res) {
      if (res.emailNotTaken === false) {
        setEmailProp?.(email);
        setStep?.("login");
      } else {
        modalRef?.current?.closeModal(); // Close drawer
        router.push(`/auth/signup?email=${email}`);
      }
    }

    setAuthLoading(false);
  };

  return (
    <>
      <Stack>
        <Typography
          component="h3"
          variant="h5"
          sx={{ textAlign: "center", ...style.headline }}>
          Blobes Socials, A Place For Nigerians
        </Typography>
        <Typography
          component="p"
          variant="body2"
          sx={{
            color: theme.palette.gray[200],
            paddingBottom: theme.boxSpacing(8),
            textAlign: "center",
            ...style.tagline,
          }}>
          Enter your email address to continue.
        </Typography>
      </Stack>

      <Stack
        sx={{ gap: theme.gap(8) }}
        component="form"
        onSubmit={handleSubmit}>
        <TextInput
          defaultValue={existingEmail}
          label="Email"
          placeholder="Enter your email address"
          onChange={onEmailChange}
          helperText={msg}
          error={email !== "" && validity === "invalid"}
        />
        <AppButton
          variant="contained"
          {...(isAuthLoading && { iconLeft: <CircularProgress size={25} /> })}
          //  action={handleSubmit}
          submit
          style={{
            fontSize: "16px",
            padding: theme.boxSpacing(3, 8),
            width: "100%",
          }}
          options={{
            disabled: validity === "invalid" || email === "",
          }}>
          {!isAuthLoading && "Continue"}
        </AppButton>
      </Stack>
    </>
  );
};
