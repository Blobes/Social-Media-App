"use client";

import React, { useEffect } from "react";
import { Typography } from "@mui/material";
import { useGlobalStore } from "@repo/shared-hooks";

export default function OnboardingPage() {
  const user = useGlobalStore((state) => state.authUser);

  useEffect(() => {
    console.log(user);
  }, []);

  return <Typography>Onboarding page</Typography>;
}
