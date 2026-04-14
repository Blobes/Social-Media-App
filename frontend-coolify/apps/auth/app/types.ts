"use client";

import { DrawerRef, GenericStyle } from "@repo/core";

export type StepName = "CREDENTIAL" | "RESTORE" | "PASSWORD";

export interface StyleProps {
  container?: GenericStyle;
  headline?: GenericStyle;
  tagline?: GenericStyle;
}

export interface StepperProps {
  modalRef?: React.RefObject<DrawerRef>;
  redirectTo?: string;
  style?: StyleProps;
}

export interface StepProps {
  modalRef?: React.RefObject<DrawerRef>;
  step?: StepName;
  setStep?: (step: StepName) => void;
  existingInput?: string;
  setIdentifier?: (credential: string) => void;
  style?: StyleProps;
}
