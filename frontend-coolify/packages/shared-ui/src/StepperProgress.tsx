"use client";

import React, { useEffect, useRef } from "react";
import { Stack, Box } from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import { Check } from "lucide-react";
import { IStep } from "@repo/core";
import { BasicTooltip } from "./Tooltips";
import { TransText } from "./Text";

interface ProgressProps<T> {
  steps: IStep<T>[];
  currStep: T;
  setCurrStep: (step: T) => void;
}

const StepDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "completed",
})<{ active?: boolean; completed?: boolean }>(
  ({ theme, active, completed }) => ({
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    display: "flex",
    flexShrink: 0, // Prevent dots from squishing on mobile
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 600,
    transition: "all 0.3s ease",
    border: `2px solid ${
      completed || active
        ? theme.palette.primary.main
        : theme.palette.gray.trans[1]
    }`,
    backgroundColor: completed ? theme.palette.primary.main : "transparent",
    color: completed
      ? theme.palette.gray[0]
      : active
        ? theme.palette.primary.main
        : theme.palette.gray[200],
  }),
);

const Connector = styled(Box)<{ completed?: boolean }>(
  ({ theme, completed }) => ({
    width: "100%",
    flex: 1,
    minWidth: "40px", // Ensures the bar is visible and scrollable on small screens
    height: 2,
    backgroundColor: completed
      ? theme.palette.primary.main
      : theme.palette.gray.trans[1],
    margin: theme.boxSpacing(0, 2),
    transform: "translateY(19px)",
    transition: "background-color 0.3s ease",
  }),
);

/**
 * Mobile responsive progress indicator with scroll-snap behavior.
 */
export const StepperProgress = <T,>({
  steps,
  currStep,
  setCurrStep,
}: ProgressProps<T>) => {
  const theme = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeIndex = steps.findIndex((s) => s.name === currStep);

  /**
   * Snaps the active step into the center of the scroll view whenever it changes.
   */
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector(
        `[data-step-active="true"]`,
      );
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currStep]);

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        width: "100%",
        overflowX: "auto",
        display: "flex",
        alignItems: "center",
        p: theme.boxSpacing(2, 4), // Space for labels
        scrollSnapType: "x mandatory", // Snappy scrolling
        msOverflowStyle: "none", // Hide scrollbar IE
        scrollbarWidth: "none", // Hide scrollbar Firefox
        "&::-webkit-scrollbar": { display: "none" }, // Hide scrollbar Chrome/Safari
      }}>
      <Stack
        sx={{
          width: "100%",
          flexDirection: "row",
          alignItems: "flex-start",
          minWidth: "max-content",
        }}>
        {steps.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isLast = index === steps.length - 1;
          const isClickable = isCompleted && step.revisitable;

          return (
            <React.Fragment key={String(step.name)}>
              <BasicTooltip title={step.label}>
                <Stack
                  data-step-active={isActive}
                  onClick={() => isClickable && setCurrStep(step.name)}
                  sx={{
                    alignItems: "center",
                    gap: theme.gap(2),
                    cursor: isClickable ? "pointer" : "default",
                    position: "relative",
                    scrollSnapAlign: "center", // Snap target
                  }}>
                  <StepDot active={isActive} completed={isCompleted}>
                    {isCompleted ? (
                      <Check
                        size={20}
                        style={{
                          stroke: theme.palette.gray[0],
                          strokeWidth: 3,
                        }}
                      />
                    ) : (
                      index + 1
                    )}
                  </StepDot>
                  <TransText
                    noWrap={true}
                    sx={{
                      ...theme.typography.caption,
                      maxWidth: 56,
                      fontSize: "15px",
                      fontWeight: isActive || isCompleted ? 700 : 500,
                      color:
                        isActive || isCompleted
                          ? theme.palette.primary.main
                          : theme.palette.gray[200],
                      whiteSpace: "nowrap",
                    }}>
                    {step.label || String(step.name)}
                  </TransText>
                </Stack>
              </BasicTooltip>

              {!isLast && <Connector completed={isCompleted} />}
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
};
