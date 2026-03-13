"use client";

import { createContext, useContext, useState } from "react";
import {
  IUser, ISnackBarMsg, AuthStatus, IPage, NetworkStatus,
} from "@repo/types";
import { clientRoutes } from "@repo/helpers";
import { ModalProps, DrawerProps } from "@repo/shared-ui";

interface Context {
  authStatus: AuthStatus;
  setAuthStatus: React.Dispatch<React.SetStateAction<AuthStatus>>;
  authUser: IUser | null;
  setAuthUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  snackBarMsg: ISnackBarMsg;
  setSnackBarMsg: React.Dispatch<React.SetStateAction<ISnackBarMsg>>;
  inlineMsg: string | null;
  setInlineMsg: React.Dispatch<React.SetStateAction<string | null>>;
  isGlobalLoading: boolean;
  setGlobalLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthLoading: boolean;
  setAuthLoading: React.Dispatch<React.SetStateAction<boolean>>;
  lastPage: IPage;
  setPage: React.Dispatch<React.SetStateAction<IPage>>;
  drawerContent: DrawerProps | null;
  setDrawerContent: React.Dispatch<React.SetStateAction<DrawerProps | null>>;
  modalContent: ModalProps | null;
  setModalContent: React.Dispatch<React.SetStateAction<ModalProps | null>>;
  networkStatus: NetworkStatus;
  setNetworkStatus: React.Dispatch<React.SetStateAction<NetworkStatus>>;
  checkingSignal: boolean;
  setSignalCheck: React.Dispatch<React.SetStateAction<boolean>>;
  offlineMode: boolean;
  setOfflineMode: React.Dispatch<React.SetStateAction<boolean>>;
  defaultHeader: boolean;
  setDefaultHeader: React.Dispatch<React.SetStateAction<boolean>>;
}

const context = createContext<Context | null>(null);

export const ContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("PENDING");
  const [authUser, setAuthUser] = useState<IUser | null>(null);
  const [snackBarMsg, setSnackBarMsg] = useState<ISnackBarMsg>({
    messages: [],
    defaultDur: 5,
    dir: "UP"
  });
  const [inlineMsg, setInlineMsg] = useState<string | null>(null);
  const [isGlobalLoading, setGlobalLoading] = useState(false);
  const [isAuthLoading, setAuthLoading] = useState(false);
  const [lastPage, setPage] = useState<IPage>(clientRoutes.home);
  const [drawerContent, setDrawerContent] = useState<DrawerProps | null>(null);
  const [modalContent, setModalContent] = useState<ModalProps | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>("UNKNOWN");
  const [checkingSignal, setSignalCheck] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [defaultHeader, setDefaultHeader] = useState(true);

  const value = {
    authStatus,
    setAuthStatus,
    authUser,
    setAuthUser,
    snackBarMsg,
    setSnackBarMsg,
    inlineMsg,
    setInlineMsg,
    isGlobalLoading,
    setGlobalLoading,
    isAuthLoading,
    setAuthLoading,
    lastPage: lastPage,
    setPage,
    drawerContent,
    setDrawerContent,
    modalContent,
    setModalContent,
    networkStatus,
    setNetworkStatus,
    checkingSignal,
    setSignalCheck,
    offlineMode,
    setOfflineMode,
    defaultHeader,
    setDefaultHeader,
  }

  return (
    <context.Provider
      value={value}>
      {children}
    </context.Provider>
  );
};

export const useGlobalContext = () => {
  const globalContext = useContext(context);
  if (!globalContext) {
    throw new Error("useAppContext must be used within a ContextProvider");
  }
  return globalContext;
};
