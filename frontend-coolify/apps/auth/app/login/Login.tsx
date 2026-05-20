"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { IStep, StepName } from "@repo/core";
import { Stepper } from "@repo/shared-ui";
import { Stack } from "@mui/material";
import Image from "next/image";
import { asset } from "@repo/assets";
import { PasswordStep } from "./PasswordStep";
import { IdentifierStep } from "./IdentifierStep";
import { RestoreAccount } from "@repo/features";
import { LoginStepProps, StepperProps } from "../types";

export const Login: React.FC<LoginStepProps> = ({ style = {} }) => {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [currStep, setCurrStep] = useState<StepName>("IDENTIFIER");

  const steps: IStep<StepName>[] = [
    {
      name: "IDENTIFIER",
      element: (
        <IdentifierStep
          step={currStep}
          setStep={setCurrStep}
          existingInput={input}
          setIdentifier={setInput}
          style={{
            headline: style?.headline,
            tagline: style?.tagline,
          }}
        />
      ),
    },
    {
      name: "RESTORE_ACCOUNT",
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
        backgroundColor: theme.palette.gray[50],
        borderRadius: theme.radius[5],
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(10),
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          ...style.container?.mobile,
        },
        ...style.container,
      }}>
      <Image
        alt="logo"
        src={asset.logo}
        width={50}
        height={50}
        style={{
          borderRadius: `${theme.radius.full}`,
        }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
