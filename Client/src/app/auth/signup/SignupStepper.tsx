"use client";

import React, { useState } from "react";
import { Signup } from "./Signup";
import { useTheme } from "@mui/material/styles";
import { ModalRef } from "@/components/Modal";
import { Login } from "../login/Login";
import { GenericObject, Step } from "@/types";
import { Stepper } from "@/components/Stepper";
import { Stack } from "@mui/material";

interface StepperProps {
  modalRef?: React.RefObject<ModalRef>;
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

  const steps: Step[] = [
    {
      name: "email",
      element: (
        <Signup
          step={currStep}
          setStep={setCurrStep}
          existingEmail={email}
          setEmailProp={setEmail}
          modalRef={modalRef}
          style={{ ...style.headline, ...style.tagline }}
        />
      ),
    },
    {
      name: "login",
      element: (
        <Login
          step={currStep}
          setStep={setCurrStep}
          email={email}
          modalRef={modalRef}
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
      <img
        alt="logo"
        src="/assets/images/logo.png"
        style={{ borderRadius: "500px", width: "70px", height: "70px" }}
      />
      <Stepper steps={steps} currStep={currStep} setCurrStep={setCurrStep} />
    </Stack>
  );
};
