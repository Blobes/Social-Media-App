"use client";

import React, { createContext, useContext, useState } from "react";
import { LoginStatus } from "@/app/auth/authTypes";
import { User } from "@/data/models";
import { Feedback } from "@/shared/types";

interface AppContextType {
  isLoggedIn: LoginStatus;
  setLoginStatus: React.Dispatch<React.SetStateAction<LoginStatus>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  feedback: Feedback;
  setFeedback: React.Dispatch<React.SetStateAction<Feedback>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
}

const context = createContext<AppContextType | null>(null);
export const ContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isLoggedIn, setLoginStatus] = useState<LoginStatus>(false);
  const [user, setUser] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({
    message: null,
    type: null,
    progressBar: { seconds: 5, width: 100 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>(() => {
    const savedPage = localStorage.getItem("currentPage") || "home";
    localStorage.setItem("currentPage", savedPage);
    return savedPage;
  });
  return (
    <context.Provider
      value={{
        isLoggedIn,
        setLoginStatus,
        user,
        setUser,
        feedback,
        setFeedback,
        isLoading,
        setIsLoading,
        currentPage,
        setCurrentPage,
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
