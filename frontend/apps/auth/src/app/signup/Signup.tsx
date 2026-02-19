"use client";

import { CircularProgress, Stack, Typography } from "@mui/material";
import { useGlobalContext } from "@funstakes/shared-state";
import { AppButton, TextInput } from "@funstakes/shared-ui";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { validateEmail } from "@funstakes/helpers";
import { useEffect, useState } from "react";
import { GenericObject } from "@funstakes/types";
import { useEmail } from "../login/hooks/useEmail";

interface InfoProps {
  step?: string;
  setStep?: (step: string) => void;
  existingEmail?: string;
  setEmailProp?: (email: string) => void;
  style?: {
    headline?: GenericObject<string>;
    tagline?: GenericObject<string>;
  };
}

export const Signup: React.FC<InfoProps> = ({
  step,
  setStep,
  existingEmail,
  setEmailProp,
  style = {},
}) => {
  const { handleSubmit, } = useEmail({ existingEmail, setStep, setEmailProp });
  const { isAuthLoading, setAuthLoading } = useGlobalContext();
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



  return (
    <>
      <Stack>
        <Typography
          component="h3"
          variant="h5"
          sx={{ textAlign: "center", ...style.headline }}>
          Sign up to FunStakes, and stake higher.
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
