"use client";

import { create } from "zustand";
import {
  IUser,
  ISnackBarMsg,
  AuthStatus,
  IPage,
  NetworkStatus,
  DrawerProps,
  ModalProps,
  CLIENT_ROUTES,
  IMessage,
} from "@repo/core";

/** * Defines the shape and actions of the global application store.
 */
interface GlobalState {
  // Auth State
  authStatus: AuthStatus;
  authUser: IUser | null;
  isAuthLoading: boolean;

  // UI State
  snackBarMsg: ISnackBarMsg;
  inlineMsg: React.ReactNode | null;
  isGlobalLoading: boolean;
  lastPage: IPage;
  drawerContent: DrawerProps | null;
  modalContent: ModalProps | null;
  defaultHeader: boolean;

  // System/Network State
  networkStatus: NetworkStatus;
  checkingSignal: boolean;
  offlineMode: boolean;
  transitData: any | null;

  // Time
  now: number;

  // Actions
  setAuthStatus: (status: AuthStatus) => void;
  setAuthUser: (user: IUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setSnackBarMsg: (msg: IMessage, override: boolean) => void;
  removeSnackBarMsg: (id?: string) => void;
  setInlineMsg: (node: React.ReactNode | null) => void;
  setGlobalLoading: (loading: boolean) => void;
  setPage: (page: IPage) => void;
  setDrawerContent: (content: DrawerProps | null) => void;
  setModalContent: (content: ModalProps | null) => void;
  setNetworkStatus: (status: NetworkStatus) => void;
  setSignalCheck: (checking: boolean) => void;
  setOfflineMode: (mode: boolean) => void;
  setDefaultHeader: (show: boolean) => void;
  updateNow: () => void;
  setTransitData: <T>(data: T | null) => void;
}

/** * Hook for accessing the global store.
 * Using a single store for global UI states.
 */
export const useGlobalStore = create<GlobalState>((set) => ({
  // Initial States
  authStatus: "PENDING",
  authUser: null,
  isAuthLoading: false,
  snackBarMsg: {
    messages: [],
    defaultDur: 5,
    dir: "up",
  },
  inlineMsg: null,
  isGlobalLoading: false,
  lastPage: CLIENT_ROUTES.home,
  drawerContent: null,
  modalContent: null,
  networkStatus: "UNKNOWN",
  checkingSignal: false,
  offlineMode: false,
  defaultHeader: true,
  now: Date.now(),
  transitData: null,

  // Action Implementations
  setAuthStatus: (authStatus) => set({ authStatus }),
  setAuthUser: (authUser) => set({ authUser }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

  setSnackBarMsg: (newMsg, override = false) =>
    set((state) => ({
      snackBarMsg: {
        ...state.snackBarMsg,
        messages: override
          ? [newMsg]
          : [...(state.snackBarMsg.messages || []), newMsg],
      },
    })),
  removeSnackBarMsg: (id) =>
    set((state) => ({
      snackBarMsg: {
        ...state.snackBarMsg,
        messages: state.snackBarMsg.messages?.filter((m) => m.id !== id),
      },
    })),

  setInlineMsg: (inlineMsg) => set({ inlineMsg }),
  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),
  setPage: (lastPage) => set({ lastPage }),

  setDrawerContent: (update) =>
    set((state) => {
      if (!state.drawerContent && !update) return state;
      if (state.drawerContent === update) return state;
      return { drawerContent: update };
    }),

  setModalContent: (update) =>
    set((state) => {
      if (!state.modalContent && !update) return state;
      if (state.modalContent === update) return state;
      return { modalContent: update };
    }),
  setNetworkStatus: (networkStatus) => set({ networkStatus }),
  setSignalCheck: (checkingSignal) => set({ checkingSignal }),
  setOfflineMode: (offlineMode) => set({ offlineMode }),
  setDefaultHeader: (defaultHeader) => set({ defaultHeader }),
  updateNow: () => set({ now: Date.now() }),

  setTransitData: (data) => set({ transitData: data }),
}));
