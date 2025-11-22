"use client";

import { Login } from "@/app/auth/login/Login";
import { useTheme } from "@mui/material/styles";
import { useAppContext } from "@/app/AppContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const theme = useTheme();
  const { loginStatus, currentPage } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (loginStatus === "AUTHENTICATED") {
      router.replace("/");
    }
  });

  return <Login redirectTo={currentPage} />;
}
