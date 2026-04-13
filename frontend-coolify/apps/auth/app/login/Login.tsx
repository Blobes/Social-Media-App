"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { IStep } from "@repo/core";
import { RestoreAccount, Stepper } from "@repo/shared-ui";
import { Stack } from "@mui/material";
import Image from "next/image";
import { img } from "@repo/assets";
import { PasswordStep } from "./PasswordStep";
import { CredentialStep } from "./CredentialStep";
import { StepName, StepperProps } from "../types";

export const Login: React.FC<StepperProps> = ({ style = {} }) => {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [currStep, setCurrStep] = useState<StepName>("CREDENTIAL");

  const steps: IStep<StepName>[] = [
    {
      name: "CREDENTIAL",
      element: (
        <CredentialStep
          step={currStep}
          setStep={setCurrStep}
          existingInput={input}
          setCredential={setInput}
          style={{
            headline: style?.headline,
            tagline: style?.tagline,
          }}
        />
      ),
    },
    {
      name: "RESTORE",
      element: (
        <RestoreAccount
          headline={`${input} is deactivated`}
          tagline="This account has been deactivated. Restore it to log in"
        />
      ),
    },
    {
      name: "PASSWORD",
      element: (
        <PasswordStep
          step={currStep}
          setStep={setCurrStep}
          credential={input}
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
        border: `1px solid ${theme.fixedColors.pTrans}`,
        borderRadius: theme.radius[3],
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(16),
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          ...style.container?.mobile,
        },
        ...style.container,
      }}>
      <Image
        alt="logo"
        src={img.logo}
        width={60}
        height={60}
        style={{
          borderRadius: `${theme.radius.full}`,
        }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
