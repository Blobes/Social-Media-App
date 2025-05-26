"use client";

import { Box, Stack } from "@mui/material";
import { BlurEffect } from "../shared/components/BlurEffect";
import { Header } from "@/shared/components/Header";
import { FeedbackSnackBar } from "@/shared/components/SnackBars";
import { useAppContext } from "./AppContext";
import { Footer } from "@/shared/components/Footer";

export const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const { feedback } = useAppContext();

  return (
    <Stack sx={{ position: "fixed", height: "100vh", width: "100%", gap: 0 }}>
      <BlurEffect />
      <Header />
      {feedback.message.timed && <FeedbackSnackBar />}
      {children}
      <Footer />
    </Stack>
  );
};
