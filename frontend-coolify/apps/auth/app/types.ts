"use client";

import {
  AuthStepName,
  InputType,
  PasswordResetStepName,
  StepperProps,
  TransitData,
} from "@repo/core";

export interface LoginProps extends StepperProps<AuthStepName> {
  identifier?: string;
  existingInput?: string;
  setIdentifier?: (identifier: string) => void;
  inputType?: InputType;
  setInputType?: (type: InputType) => void;
}

export interface ResetStepProps extends StepperProps<PasswordResetStepName> {
  existingInput?: string;
  setIdentifier?: (identifier: string) => void;
  cachedEntries?: TransitData<"PASSWORD_RESET">[];
}
