"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { IStep, AuthStepName } from "@repo/core";
import { Stepper } from "@repo/shared-ui";
import { Stack } from "@mui/material";
import { PasswordStep } from "./PasswordStep";
import { IdentifierStep } from "./IdentifierStep";
import { DisplayFeedbackUI } from "@repo/features";
import { LoginStepProps } from "../types";

export const Login: React.FC<LoginStepProps> = ({ style = {} }) => {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [currStep, setCurrStep] = useState<AuthStepName>("IDENTIFIER");

  const steps: IStep<AuthStepName>[] = [
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
      element: <DisplayFeedbackUI type="NEEDS_RESTORE" />,
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
        borderRadius: theme.radius[5],
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(10),
        ...style.container,
        [theme.breakpoints.down("md")]: {
          flex: "none",
          ...style.container?.mdScreen,
        },
        [theme.breakpoints.down("sm")]: {
          width: style.container?.smScreen,
        },
      }}>
      {/* <Image
        alt="logo"
        src={asset.logo}
        width={50}
        height={50}
        style={{
          borderRadius: `${theme.radius.full}`,
          flex: "none",
        }}
      /> */}
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
