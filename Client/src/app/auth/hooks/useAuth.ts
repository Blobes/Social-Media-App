"use client";

import { useState } from "react";
import { login } from "../service/authApi";
import { useAppContext } from "@/app/AppContext";

export const useAuth = () => {
  const {
    setUser,
    setLoginStatus,
    setInfo: setMessage,
    setIsLoading,
  } = useAppContext();
  const handleLogin = async (credential: string) => {
    setIsLoading(true);

    const userData = login(credential);

    if (!userData) setMessage({ content: "Failed to login", type: "ERROR" });

    setUser(userData);
    setLoginStatus((prev) => !prev);
    setIsLoading(false);
  };

  const handleLogout = () => {
    setLoginStatus((prev) => !prev);
    setUser(null);
  };

  return { handleLogin, handleLogout };
};
