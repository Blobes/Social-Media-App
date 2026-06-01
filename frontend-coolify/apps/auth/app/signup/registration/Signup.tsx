"use client";

import React from "react";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stepper } from "@repo/shared-ui";
import { PasswordStep } from "../../login/PasswordStep";
import { IStep, AuthStepName, StepperProps } from "@repo/core";
import { Stack } from "@mui/material";
import Image from "next/image";
import { asset } from "@repo/assets";

export const Signup: React.FC<StepperProps<AuthStepName>> = ({
  modalRef,
  redirectTo,
  style = {},
}) => {
  const theme = useTheme();
  const [credential, setCredential] = useState("");
  const [currStep, setCurrStep] = useState<AuthStepName>("PASSWORD");

  const steps: IStep<AuthStepName>[] = [
    {
      name: "PASSWORD",
      element: (
        <PasswordStep
          step={currStep}
          setStep={setCurrStep}
          credential={credential}
          redirectTo={redirectTo}
          style={{
            headline: style?.headline,
            tagline: style?.tagline,
          }}
        />
      ),
    },
  ];

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray[0],
        borderRadius: "12px",
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(12),
        flexShrink: 0,
        ...style.container,
      }}>
      <Image
        alt="logo"
        src={asset.logo}
        width={50}
        height={50}
        style={{ borderRadius: "500px" }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
