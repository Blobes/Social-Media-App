"use client";

import React from "react";
import { useAuth } from "@/app/auth/authHooks";
import { Box, Typography } from "@mui/material";
import { useAppContext } from "@/app/AppContext";
import { CustomButton } from "@/shared/components/Buttons";

export const Login: React.FC = () => {
  const { handleLogin } = useAuth();
  const { setCurrentPage, feedback, isLoading } = useAppContext();

  const handleSubmit = () => {
    handleLogin({ email: "nick@gmail.com", password: "nick123" });
    setCurrentPage("home");
    localStorage.setItem("currentPage", "home");
  };
  return (
    <Box>
      <CustomButton
        variant="contained"
        label="Login"
        onClick={handleSubmit}
        style={{}}
        overrideStyle="full"
      />
      {feedback.message.fixed && (
        <Typography variant="body2">{feedback.message.fixed}</Typography>
      )}
    </Box>
  );
};
