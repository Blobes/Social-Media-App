"use client";

import React from "react";
import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stepper } from "@repo/shared-ui";
import { PasswordStep } from "../login/PasswordStep";
import { IStep } from "@repo/core";
import { Stack } from "@mui/material";
import Image from "next/image";
import { img } from "@repo/assets";
import { StepName, StepperProps } from "../types";

export const SignUpStepper: React.FC<StepperProps> = ({
  modalRef,
  redirectTo,
  style = {},
}) => {
  const theme = useTheme();
  const [credential, setCredential] = useState("");
  const [currStep, setCurrStep] = useState<StepName>("PASSWORD");

  const steps: IStep<StepName>[] = [
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
        gap: theme.gap(16),
        [theme.breakpoints.down("sm")]: {
          width: "100%",
        },
        ...style.container,
      }}>
      <Image
        alt="logo"
        src={img.logo}
        width={70}
        height={70}
        style={{ borderRadius: "500px" }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
