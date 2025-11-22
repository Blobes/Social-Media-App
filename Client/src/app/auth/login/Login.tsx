"use client";

import { useAuth } from "@/app/auth/authHooks";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { useAppContext } from "@/app/AppContext";
import { AppButton } from "@/components/Buttons";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { ModalRef } from "@/components/Modal";
import { setCookie } from "@/helpers/others";
import { useEffect, useState } from "react";
import { useSharedHooks } from "@/hooks";
import { ResponseStatus } from "@/types";

interface LoginProps {
  modalRef?: React.RefObject<ModalRef>;
  redirectTo?: string;
}

export const Login: React.FC<LoginProps> = ({ modalRef, redirectTo }) => {
  const {
    handleLogin,
    loginAttempts,
    MAX_ATTEMPTS,
    lockTimestamp,
    startLockCountdown,
  } = useAuth(modalRef);
  const {
    inlineMsg,
    setInlineMsg,
    isGlobalLoading,
    setGlobalLoading,
    setAuthUser,
    setLoginStatus,
  } = useAppContext();
  const { setSBMessage, setCurrentPage } = useSharedHooks();
  const [inlineStatus, setInlineStatus] = useState<ResponseStatus>(null);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    startLockCountdown(Number(lockTimestamp));
  }, []);

  const handleSubmit = async () => {
    setGlobalLoading(true);
    const res = await handleLogin({
      email: "nick@gmail.co",
      password: "nick123",
    });
    if (res) {
      const { payload, message: timedMsg, fixedMsg, status } = res;

      if (payload && status === "SUCCESS") {
        setLoginStatus("AUTHENTICATED");
        setAuthUser(res.payload);

        !isGlobalLoading &&
          setSBMessage({
            msg: { content: timedMsg, msgStatus: status },
          });

        const page =
          redirectTo === undefined || redirectTo === null || redirectTo === "/"
            ? "home"
            : redirectTo.split("/").filter(Boolean).pop() || "";
        setCurrentPage(page);
        setCookie("user", JSON.stringify(res), 60 * 24);

        // Close drawer
        modalRef?.current?.closeModal();
        router.push(redirectTo || "");
      } else {
        setInlineMsg(fixedMsg ?? null);
        setInlineStatus(status);
      }
    }
    setGlobalLoading(false);
  };

  return (
    <Stack
      sx={{
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.gap(12),
      }}>
      <Typography component="h4" variant="h6">
        You are logged currently out!
      </Typography>
      {inlineMsg && <Typography variant="body2">{inlineMsg}</Typography>}
      <AppButton
        variant="contained"
        {...(isGlobalLoading && { iconLeft: <CircularProgress size={40} /> })}
        onClick={handleSubmit}
        style={{ fontSize: "16px", padding: theme.boxSpacing(2, 8) }}
        options={{ disabled: loginAttempts >= MAX_ATTEMPTS }}>
        Login
      </AppButton>
    </Stack>
  );
};
