"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { IStep, AuthStepName, InputType } from "@repo/core";
import { DisplayFeedbackUI, Stepper } from "@repo/shared-ui";
import { Stack } from "@mui/material";
import { PasswordStep } from "./PasswordStep";
import { IdentifierStep } from "./IdentifierStep";
import { LoginProps } from "../types";

export const Login: React.FC<LoginProps> = ({ style = {} }) => {
  const theme = useTheme();
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<InputType>("UNKNOWN");
  const [currStep, setCurrStep] = useState<AuthStepName>("IDENTIFIER");

  const steps = useMemo<IStep<AuthStepName>[]>(
    () => [
      {
        name: "IDENTIFIER",
        element: (
          <IdentifierStep
            step={currStep}
            setStep={setCurrStep}
            existingInput={input}
            setInputType={setInputType}
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
            identifier={input}
            inputType={inputType}
            style={{
              headline: style?.headline,
              tagline: style?.tagline,
            }}
          />
        ),
      },
    ],
    [currStep, input, inputType, style?.headline, style?.tagline],
  );

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
      }}
    >
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
