"use client";

import { GenericObject, Step } from "@/types";
import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AppButton } from "./Buttons";
import { BasicTooltip } from "./Tooltips";
import { ChevronLeft } from "@mui/icons-material";

interface StepperProps {
  steps: Step[];
  currStep: string;
  setCurrStep: (val: string) => void;
  style?: GenericObject<any>;
}

export const Stepper: React.FC<StepperProps> = ({
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
            <ChevronLeft sx={{ width: "35px", height: "35px" }} />
          </AppButton>
        </BasicTooltip>
      )}
      {activeStep.element}
    </Stack>
  );
};
