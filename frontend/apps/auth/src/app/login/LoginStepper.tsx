"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { GenericObject, IStep } from "@funstakes/types"
import { Stepper } from "@funstakes/shared-ui";
import { Stack } from "@mui/material";
import Image from "next/image";
import { img } from "@funstakes/assets";
import { PasswordStep } from "./PasswordStep";
import { EmailStep } from "./EmailStep";

interface StepperProps {
  style?: {
    container?: GenericObject<string> | any;
    headline?: GenericObject<string>;
    tagline?: GenericObject<string>;
  };
}

export const LoginStepper: React.FC<StepperProps> = ({ style = {} }) => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [currStep, setCurrStep] = useState("email");

  const steps: IStep[] = [
    {
      name: "email",
      element: (
        <EmailStep
          step={currStep}
          setStep={setCurrStep}
          existingEmail={email}
          setEmailProp={setEmail}
          style={{ ...style.headline, ...style.tagline }}
        />
      ),
    },
    {
      name: "login",
      element: (
        <PasswordStep
          step={currStep}
          setStep={setCurrStep}
          email={email}
          style={{ ...style.headline, ...style.tagline }}
        />
      ),
    },
  ];

  return (
    <Stack
      sx={{
        backgroundColor: theme.palette.gray[0],
        border: `1px solid ${theme.fixedColors.mainTrans}`,
        borderRadius: theme.radius[3],
        justifyContent: "center",
        alignItems: "center",
        gap: theme.gap(16),
        [theme.breakpoints.down("sm")]: {
          width: "100%",
          ...style.container.mobile
        },
        ...style.container,
      }}>
      <Image
        alt="logo"
        src={img.logo}
        style={{
          borderRadius: `${theme.radius.full}`,
          width: "60px", height: "60px"
        }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
