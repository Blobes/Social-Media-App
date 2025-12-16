"use client";

import { useAuth } from "@/app/auth/login/authHooks";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAppContext } from "@/app/AppContext";
import { AppButton } from "@/components/Buttons";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { delay, getCookie } from "@/helpers/others";
import { useEffect, useState } from "react";
import { useSharedHooks } from "@/hooks";
import { PasswordInput } from "@/components/InputFields";
import { InlineMsg } from "@/components/InlineMsg";
import { Edit } from "@mui/icons-material";
import { BasicTooltip } from "@/components/Tooltips";
import { GenericObject } from "@/types";

interface LoginProps {
  email: string;
  step?: string;
  setStep?: (step: string) => void;
  redirectTo?: string;
  style?: {
    headline?: GenericObject<string>;
    tagline?: GenericObject<string>;
  };
}

export const Login: React.FC<LoginProps> = ({
  email,
  step,
  setStep,
  style = {},
}) => {
  const {
    handleLogin,
    loginAttempts,
    MAX_ATTEMPTS,
    lockTimestamp,
    startLockCountdown,
  } = useAuth();
  const {
    inlineMsg,
    setInlineMsg,
    isAuthLoading,
    setAuthLoading,
    loginStatus,
    lastPage,
  } = useAppContext();
  const { setSBMessage } = useSharedHooks();
  const [msg, setMsg] = useState("");
  const [passwordValidity, setPasswordValidity] = useState<
    "valid" | "invalid"
  >();
  const [password, setPassword] = useState("");
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    startLockCountdown(Number(lockTimestamp));
    setInlineMsg(null);
  }, [step, loginStatus]);

  const onPasswordChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (value.length >= 6) {
      setPassword(e.target.value);
      setPasswordValidity("valid");
      setMsg("");
    } else if (value.length === 0) {
      setPasswordValidity("invalid");
      setMsg("Password is required.");
    } else {
      setPasswordValidity(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    await delay();

    const res = await handleLogin({
      email: email,
      password: password,
    });
    if (res) {
      const { payload, message: timedMsg, fixedMsg, status } = res;

      if (payload && status === "SUCCESS") {
        !isAuthLoading &&
          setSBMessage({
            msg: { content: timedMsg, msgStatus: status },
          });
        setStep?.("email");
        router.push(lastPage.path);
      } else {
        setInlineMsg(fixedMsg ?? null);
      }
    }
    setAuthLoading(false);
  };

  return (
    <>
      <Stack>
        <Typography
          component="h4"
          variant="h5"
          sx={{ textAlign: "center", ...style.headline }}>
          Welcome back buzzer!
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
          Enter your password to login.
        </Typography>
      </Stack>

      {inlineMsg && <InlineMsg msg={inlineMsg} type="ERROR" />}

      <Stack
        sx={{ gap: theme.gap(8) }}
        component="form"
        onSubmit={handleSubmit}>
        <Stack direction="row">
          <Typography
            component="p"
            variant="body2"
            sx={{
              textAlign: "left",
              padding: theme.boxSpacing(4, 6),
              borderRadius: theme.radius[2],
              color: theme.palette.gray[200],
              border: `1px solid ${theme.palette.gray.trans[1]}`,
              backgroundColor: theme.palette.gray.trans[1],
              width: "100%",
            }}>
            {email}
          </Typography>
          <AppButton
            variant="outlined"
            style={{
              padding: theme.boxSpacing(3, 4),
              color: theme.palette.gray[200],
              borderColor: theme.palette.gray[100],
            }}
            onClick={() => {
              setStep?.("email");
            }}>
            <BasicTooltip title={"Change email"}>
              <Edit sx={{ width: "20px" }} />
            </BasicTooltip>
          </AppButton>
        </Stack>
        <PasswordInput
          label="Password"
          placeholder="Password"
          onChange={onPasswordChange}
          helperText={msg}
          error={password === "" && passwordValidity === "invalid"}
        />
        <AppButton
          variant="contained"
          {...(isAuthLoading && { iconLeft: <CircularProgress size={30} /> })}
          submit
          style={{
            fontSize: "16px",
            padding: theme.boxSpacing(3, 8),
            width: "100%",
          }}
          options={{
            disabled:
              passwordValidity === "invalid" ||
              password === "" ||
              loginAttempts >= MAX_ATTEMPTS,
          }}>
          {!isAuthLoading && "Login"}
        </AppButton>
      </Stack>
    </>
  );
};
