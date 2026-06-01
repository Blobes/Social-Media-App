"use client";

import { AuthStepName, StepperProps } from "@repo/core";

export interface LoginStepProps extends StepperProps<AuthStepName> {
  existingInput?: string;
  setIdentifier?: (credential: string) => void;
}
