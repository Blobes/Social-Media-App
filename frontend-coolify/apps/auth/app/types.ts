"use client";

import { DrawerRef, GenericStyle } from "@repo/core";

export type StepName = "IDENTIFIER" | "RESTORE_ACCOUNT" | "PASSWORD";

export interface StyleProps {
  container?: GenericStyle;
  headline?: GenericStyle;
  tagline?: GenericStyle;
}

export interface StepperProps {
  modalRef?: React.RefObject<DrawerRef>;
  redirectTo?: string;
  style?: StyleProps;
  onNext?: () => void;
}

export interface StepProps {
  modalRef?: React.RefObject<DrawerRef>;
  step?: StepName;
  setStep?: (step: StepName) => void;
  existingInput?: string;
  setIdentifier?: (credential: string) => void;
  style?: StyleProps;
}
