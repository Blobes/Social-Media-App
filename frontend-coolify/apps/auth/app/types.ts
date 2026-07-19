"use client";

import {
  AuthStepName,
  PasswordResetStepName,
  StepperProps,
  TransitData,
} from "@repo/core";

export interface LoginStepProps extends StepperProps<AuthStepName> {
  existingInput?: string;
  setIdentifier?: (credential: string) => void;
}

export interface ResetStepProps extends StepperProps<PasswordResetStepName> {
  existingInput?: string;
  setIdentifier?: (credential: string) => void;
  cachedEntries?: TransitData<"PASSWORD_RESET">[];
}
