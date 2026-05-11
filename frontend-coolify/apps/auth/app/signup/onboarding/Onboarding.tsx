"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stepper } from "@repo/shared-ui";
import { IStep, OnboardingStep } from "@repo/core";
import { Stack } from "@mui/material";
import { StepperProps } from "../../types";
import { OnboardingIntro } from "./steps/Intro";
import { Identity } from "./steps/Identity"; // Import the identity step
import { useGlobalStore } from "@repo/shared-hooks";
import { WelcomeBack } from "./steps/WelcomeBack";

export const Onboarding: React.FC<StepperProps> = ({
  modalRef,
  redirectTo,
  style = {},
}) => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);
  const [currStep, setCurrStep] = useState<OnboardingStep>(
    authUser?.onboardingStep ? "WELCOME_BACK" : "INTRO",
  );

  const steps: IStep<OnboardingStep>[] = [
    {
      name: "INTRO",
      element: <OnboardingIntro onNext={() => setCurrStep("IDENTITY")} />,
    },
    {
      name: "WELCOME_BACK",
      element: (
        <WelcomeBack
          onNext={() => setCurrStep(authUser?.onboardingStep ?? "IDENTITY")}
        />
      ),
    },
    {
      name: "IDENTITY",
      element: <Identity onNext={() => setCurrStep("DEMOGRAPHICS")} />,
    },
  ];

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray[0],
        borderRadius: "12px",
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(16),
        [theme.breakpoints.down("sm")]: {
          width: "100%",
        },
        ...style.container,
      }}>
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
