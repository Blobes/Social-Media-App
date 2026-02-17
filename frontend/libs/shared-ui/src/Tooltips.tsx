"use client";

import React from "react";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import { Fade } from "@mui/material";

export const BasicTooltip = ({ className, ...props }: TooltipProps) => {
  return (
    <Tooltip
      {...props}
      slots={{ transition: Fade }}
      slotProps={{ transition: { timeout: 300 } }}
      leaveDelay={300}
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
      <>{children}</>
    </BasicTooltip>
  );
};
