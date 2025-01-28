"use client";

import React from "react";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import Zoom from "@mui/material/Zoom";
import { Box } from "@mui/material";

export const BasicTooltip = ({ className, ...props }: TooltipProps) => {
  return (
    <Tooltip
      {...props}
      TransitionComponent={Zoom}
      leaveDelay={200}
      arrow
      classes={{ popper: className }}
    />
  );
};

type AdvancedTooltipProps = {
  children: React.ReactNode;
  heading: React.ReactNode;
  description: React.ReactNode;
};
export const AdvancedTooltip = ({
  children,
  heading,
  description,
}: AdvancedTooltipProps) => {
  return (
    <BasicTooltip
      title={
        <React.Fragment>
          {heading}
          {description}
        </React.Fragment>
      }>
      <Box>{children}</Box>
    </BasicTooltip>
  );
};
