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
  headline: React.ReactNode;
  description: React.ReactNode;
};
export const AdvancedTooltip = ({
  children,
  headline: heading,
  description,
}: AdvancedTooltipProps) => {
  return (
    <BasicTooltip
      title={
        <>
          {heading}
          {description}
        </>
      }>
      <>{children}</>
    </BasicTooltip>
  );
};
