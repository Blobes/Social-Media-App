"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  IUser,
  SnackBarMsg,
  LoginStatus,
  ModalContent,
  SavedPage,
} from "@/types";
import { defaultPage } from "@/helpers/info";

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
  lastPage: SavedPage;
  setPage: React.Dispatch<React.SetStateAction<SavedPage>>;
  modalContent: ModalContent | null;
  setModalContent: React.Dispatch<React.SetStateAction<ModalContent | null>>;
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
  const [lastPage, setPage] = useState<SavedPage>(defaultPage);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);

  useEffect(() => {
    const savedPage = localStorage.getItem("saved_page");
    if (savedPage) {
      setPage(JSON.parse(savedPage) as SavedPage);
    }
  }, []);

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
        lastPage: lastPage,
        setPage,
        modalContent,
        setModalContent,
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
