"use client";

import React from "react";
import { useAuth } from "@/app/auth/hooks/useAuth";
import { Button, Box, Typography } from "@mui/material";
import { useAppContext } from "@/app/AppContext";

export const Login: React.FC = () => {
  const { handleLogin } = useAuth();
  const { setCurrentPage, feedback: message, isLoading } = useAppContext();

  const handleSubmit = () => {
    handleLogin("1");
    setCurrentPage("home");
    localStorage.setItem("currentPage", "home");
  };
  return (
    <Box>
      <Button variant={"contained"} onClick={handleSubmit} disabled={isLoading}>
        Login
      </Button>
      {message && <Typography variant="body2">{message.content}</Typography>}
    </Box>
  );
};
