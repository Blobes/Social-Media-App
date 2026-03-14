"use client";

import { GenericObject, IStep } from "@repo/types";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "./Buttons";
import { BasicTooltip } from "./Tooltips";
import { ChevronLeft } from "lucide-react";

interface StepperProps<T> {
  steps: IStep<T>[];
  currStep: string;
  setCurrStep: (val: any) => void;
  style?: GenericObject<any>;
}

export const Stepper: React.FC<StepperProps<any>> = ({
  steps,
  currStep,
  setCurrStep,
  style = {},
}) => {
  const theme = useTheme();
  const activeIndex = steps.findIndex((s) => s.name === currStep);
  const activeStep = steps[activeIndex];
  const prevStep = steps[activeIndex - 1];

  return (
    <Stack sx={{ gap: theme.gap(14), width: "100%", ...style }}>
      {activeStep.allowPrevious && activeIndex > 0 && (
        <BasicTooltip title={`Back to ${prevStep.name}`}>
          <AppButton
            variant="outlined"
            style={{
              width: "44px",
              minWidth: "unset",
              height: "44px",
              color: theme.palette.gray[200],
              borderColor: theme.palette.gray[100],
            }}
            onClick={() => {
              setCurrStep(prevStep.name);
              activeStep.action && activeStep.action();
            }}>
            <ChevronLeft size={35} />
          </AppButton>
        </BasicTooltip>
      )}
      {activeStep.element}
    </Stack>
  );
};
