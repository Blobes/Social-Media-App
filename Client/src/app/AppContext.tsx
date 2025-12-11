"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { IUser, SnackBarMsg, LoginStatus } from "@/types";

interface AppContextType {
  loginStatus: LoginStatus;
  setLoginStatus: React.Dispatch<React.SetStateAction<LoginStatus>>;
  authUser: IUser | null;
  setAuthUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  snackBarMsgs: SnackBarMsg;
  setSnackBarMsgs: React.Dispatch<React.SetStateAction<SnackBarMsg>>;
  inlineMsg: string | null;
  setInlineMsg: React.Dispatch<React.SetStateAction<string | null>>;
  isGlobalLoading: boolean;
  setGlobalLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: string;
  setPage: React.Dispatch<React.SetStateAction<string>>;
}

const context = createContext<AppContextType | null>(null);
export const ContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loginStatus, setLoginStatus] = useState<LoginStatus>("UNKNOWN");
  const [authUser, setAuthUser] = useState<IUser | null>(null);
  const [snackBarMsgs, setSnackBarMsgs] = useState<SnackBarMsg>({
    messgages: [],
    defaultDur: 5,
  });
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);
  const [isGlobalLoading, setGlobalLoading] = useState(false);
  const [isAuthLoading, setAuthLoading] = useState(false);
  const [currentPage, setPage] = useState<string>(() => {
    return localStorage.getItem("currentPage") || "";
  });

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  return (
    <context.Provider
      value={{
        loginStatus,
        setLoginStatus,
        authUser,
        setAuthUser,
        snackBarMsgs,
        setSnackBarMsgs,
        inlineMsg,
        setInlineMsg,
        isGlobalLoading,
        setGlobalLoading,
        isAuthLoading,
        setAuthLoading,
        currentPage,
        setPage,
      }}>
      {children}
    </context.Provider>
  );
};
// Custom hook for consuming the context
export const useAppContext = () => {
  const appContext = useContext(context);
  if (!appContext) {
    throw new Error("useAppContext must be used within a ContextProvider");
  }
  return appContext;
};
