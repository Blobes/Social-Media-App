"use client";

import React, { useState } from "react";
import { Signup } from "./Signup";
import { useTheme } from "@mui/material/styles";
import { DrawerRef, Stepper } from "@shared-ui";
import { PasswordStep } from "../login/PasswordStep";
import { GenericObject, IStep } from "libs/helper/src/types";
import { Stack } from "@mui/material";
import Image from "next/image";
import { img } from "@assets";

interface StepperProps {
  modalRef?: React.RefObject<DrawerRef>;
  redirectTo?: string;
  style?: {
    container?: GenericObject<string>;
    headline?: GenericObject<string>;
    tagline?: GenericObject<string>;
  };
}

export const SignUpStepper: React.FC<StepperProps> = ({
  modalRef,
  redirectTo,
  style = {},
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [currStep, setCurrStep] = useState("email");

  const steps: IStep[] = [
    {
      name: "email",
      element: (
        <Signup
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
          redirectTo={redirectTo}
          style={{ ...style.headline, ...style.tagline }}
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
        style={{ borderRadius: "500px", width: "70px", height: "70px" }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
