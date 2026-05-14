"use client";

import { DrawerRef, GenericStyle, StepName } from "@repo/core";

export interface NavigationProps {
  onNext?: () => void;
  onPrev?: () => void;
  jumpTo?: () => void;
}

export interface StyleProps {
  container?: GenericStyle;
  headline?: GenericStyle;
  tagline?: GenericStyle;
}

export interface StepperProps extends NavigationProps {
  modalRef?: React.RefObject<DrawerRef>;
  redirectTo?: string;
  style?: StyleProps;
  setStep?: (step: StepName) => void;
  step?: StepName;
}

export interface LoginStepProps extends StepperProps {
  existingInput?: string;
  setIdentifier?: (credential: string) => void;
}
