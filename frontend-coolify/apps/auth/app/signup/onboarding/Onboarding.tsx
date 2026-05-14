"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stepper, StepperProgress } from "@repo/shared-ui";
import { IStep, StepName } from "@repo/core";
import { Stack } from "@mui/material";
import { StepperProps } from "../../types";
import { OnboardingIntro } from "./steps/Intro";
import { Identity } from "./steps/Identity";
import { useGlobalStore } from "@repo/shared-hooks";
import { WelcomeBack } from "./steps/WelcomeBack";

/**
 * Main onboarding orchestration component.
 */
export const Onboarding: React.FC<StepperProps> = ({ style = {} }) => {
  const theme = useTheme();
  const authUser = useGlobalStore((state) => state.authUser);

  const [currStep, setCurrStep] = useState<StepName>(
    authUser?.onboardingStep ? "WELCOME_BACK" : "INTRO",
  );

  const steps: IStep<StepName>[] = [
    {
      name: authUser?.onboardingStep ? "WELCOME_BACK" : "INTRO",
      label: authUser?.onboardingStep ? "Resume" : "Start",
      revisitable: true,
      element: authUser?.onboardingStep ? (
        <WelcomeBack
          onNext={() => setCurrStep(authUser?.onboardingStep ?? "IDENTITY")}
        />
      ) : (
        <OnboardingIntro onNext={() => setCurrStep("IDENTITY")} />
      ),
    },
    {
      name: "IDENTITY",
      label: "Identity",
      revisitable: true,
      allowPrevious: true,
      element: (
        <Identity
          onNext={() => setCurrStep("DEMOGRAPHICS")}
          onPrev={() =>
            setCurrStep(authUser?.onboardingStep ? "WELCOME_BACK" : "INTRO")
          }
        />
      ),
    },
    {
      name: "DEMOGRAPHICS",
      label: "Demographics",
      revisitable: false,
      element: <WelcomeBack onNext={() => setCurrStep("COMPLETED")} />,
    },
  ];

  return (
    <Stack
      sx={{
        width: "50%",
        minWidth: "500px",
        backgroundColor: theme.palette.gray[0],
        borderRadius: theme.radius[5],
        justifyContent: "center",
        alignItems: "center",
        padding: theme.boxSpacing(12),
        gap: theme.gap(32),
        boxShadow: `-12px -12px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}, 
        18px 18px 30px 6px ${theme.palette.gray.trans.overlay(0.06, true)}`,
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          minWidth: "unset",
          padding: theme.boxSpacing(6, 6),
        },
        ...style.container,
      }}>
      {/* Visual Progress Tracker (Independent) */}
      <StepperProgress
        steps={steps}
        currStep={currStep}
        setCurrStep={setCurrStep}
      />

      {/* Step Content Content (Independent) */}
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
