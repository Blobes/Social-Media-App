"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Box, Paper, Button } from "@mui/material";
import { Stepper } from "./Stepper";
import { motion, AnimatePresence, MotionValue } from "framer-motion";
import { getFramerVariants } from "@repo/helpers";
import { Guide, TourGuide } from "@repo/core";
import { Media } from "./media/Media";
import { AppButton } from "./Buttons";

interface GuideProps {
  guides: Guide[];
  showTitle?: boolean;
  detailVisual?: {
    id: string;
    icon: React.ReactElement;
    textColor: string;
  };
}

export const UIGuide = ({
  guides,
  showTitle = true,
  detailVisual,
}: GuideProps) => {
  const theme = useTheme();

  return (
    <Stack gap={theme.gap(4)} sx={{ padding: theme.boxSpacing(6) }}>
      {guides.map((guide) => {
        const hasMultiple = guide.guideDetails.length > 1;
        const useList = hasMultiple && guide.displayAsList;
        const containerComponent = useList ? "ul" : "div";

        return (
          <Stack key={guide.id || guide.title} gap={theme.gap(2)}>
            {showTitle && guide.title && (
              <Typography variant="body3" sx={{ fontWeight: 600 }}>
                {guide.title}
              </Typography>
            )}

            <Box
              component={containerComponent}
              sx={{
                margin: 0,
                paddingLeft: useList ? theme.boxSpacing(8) : 0,
                color: theme.palette.gray[200],
                fontSize: "14px",
                display: "flex",
                flexDirection: "column",
                gap: theme.gap(2),
                listStyle: useList ? "disc" : "none",
              }}>
              {guide.guideDetails.map((item) => {
                const isHighlighted = detailVisual?.id === item.id;

                return (
                  <Box
                    key={item.id}
                    component={useList ? "li" : "div"}
                    sx={{
                      // Hide default bullet if we are providing a custom highlight icon
                      listStyle:
                        isHighlighted && detailVisual?.icon
                          ? "none"
                          : "inherit",
                      display: useList ? "list-item" : "inline-flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: theme.gap(2),
                      color: isHighlighted
                        ? detailVisual?.textColor
                        : "inherit",
                    }}>
                    {/* Render custom highlight icon if present */}
                    {isHighlighted && detailVisual?.icon && (
                      <Box
                        component="span"
                        sx={{ display: "flex", flexShrink: 0, mt: "2px" }}>
                        {detailVisual.icon}
                      </Box>
                    )}

                    {typeof item.detail === "string" ? (
                      <Typography variant="inherit" component="span">
                        {item.detail}
                      </Typography>
                    ) : (
                      item.detail
                    )}
                  </Box>
                );
              })}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
};

interface UserTourGuideProps {
  steps: TourGuide[];
  onFinish?: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const UserTourGuide = ({
  steps,
  onFinish,
  open,
  setOpen,
}: UserTourGuideProps) => {
  const theme = useTheme();
  const [currStep, setCurrStep] = useState<string>(steps[0]?.name);

  const activeIndex = steps.findIndex((s) => s.name === currStep);
  const currentTourData = steps[activeIndex];

  if (!open || !currentTourData) return null;

  const handleNext = () => {
    if (activeIndex < steps.length - 1) {
      setCurrStep(steps[activeIndex + 1].name);
    } else {
      // Logic for when they are done
      setOpen(false);
      if (onFinish) onFinish();
    }
  };

  /**
   * Formatting steps for the internal Stepper component
   */
  const formattedSteps = steps.map((step) => ({
    ...step,
    element: (
      <Stack gap={2} sx={{ width: "100%" }}>
        {step.media && (
          <Media
            _id={step.media._id}
            url={step.media.url}
            style={{
              container: {
                base: {
                  width: "100%",
                  borderRadius: "8px",
                  overflow: "hidden",
                },
              },
            }}
          />
        )}
        <UIGuide
          guides={[
            {
              title: step.label,
              guideDetails: [{ detail: step.desc }],
              displayAsList: false,
            },
          ]}
        />
      </Stack>
    ),
  }));

  return (
    <AnimatePresence mode="wait">
      <Paper
        variant="elevation"
        key={currStep}
        component={motion.div}
        {...(getFramerVariants("POP", {
          duration: 0.4,
          scaleOffset: 0.8,
          ease: "easeOut",
        }) as MotionValue)}
        elevation={16}
        sx={{
          position: "fixed",
          top: `${currentTourData.yPosition}%`,
          left: `${currentTourData.xPosition}%`,
          transform: "translate(-50%, -50%)",
          zIndex: 2000,
          width: "350px",
          padding: 4,
          borderRadius: "20px",
          border: `1px solid ${theme.palette.gray.trans[1]}`,
          pointerEvents: "auto",
        }}>
        <Stack gap={4}>
          <Stepper
            steps={formattedSteps}
            currStep={currStep}
            setCurrStep={setCurrStep}
          />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center">
            <Typography
              variant="caption"
              sx={{ fontWeight: 500, opacity: 0.6 }}>
              {activeIndex + 1} / {steps.length}
            </Typography>

            <Stack direction="row" gap={1}>
              {activeIndex === steps.length - 1 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setOpen(false)}
                  sx={{ color: "text.secondary" }}>
                  Skip
                </Button>
              )}
              <AppButton
                variant="contained"
                onClick={handleNext}
                style={{
                  fontSize: "14px",
                  padding: theme.boxSpacing(6, 9),
                  width: "100%",
                }}>
                {activeIndex === steps.length - 1 ? "Finish" : "Next"}
              </AppButton>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </AnimatePresence>
  );
};
