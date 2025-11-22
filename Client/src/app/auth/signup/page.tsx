"use client";

import { useAuth } from "../authHooks";
import { AppButton } from "@/components/Buttons";
import { useTheme } from "@mui/material/styles";

export default function SignUpPage() {
  const { handleLogout } = useAuth();
  const theme = useTheme();
  return (
    <>
      <AppButton
        onClick={async () => {
          await handleLogout();
        }}>
        Logout
      </AppButton>
    </>
  );
}
