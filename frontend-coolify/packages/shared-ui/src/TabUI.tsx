"use client";

import React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { Box, Tab, Tabs } from "@mui/material";

export interface TabOption<T extends string> {
  id: T;
  label: string;
}

export interface TabUIProps<T extends string> {
  options: TabOption<T>[];
  activeTab: T;
  onChange: (tabId: T) => void;
}

const StyledTabs = styled(Tabs)(({ theme }) => ({
  backgroundColor: theme.palette.gray[300],
  borderRadius: theme.radius.full,
  padding: theme.boxSpacing(1),
  minHeight: "unset",
  backdropFilter: "blur(8px)",
  "& .MuiTabs-flexContainer": {
    gap: theme.gap(1),
  },
  "& .MuiTabs-indicator": {
    display: "none",
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  ...theme.typography.text4,
  borderRadius: theme.radius.full,
  padding: theme.boxSpacing(2, 5),
  textTransform: "none",
  minHeight: "unset",
  minWidth: "unset",
  color: theme.palette.gray[100],
  transition: "all 0.25s ease-in-out",
  "&.Mui-selected": {
    color: theme.palette.gray[0],
    backgroundColor: theme.palette.primary.main,
  },
  "&:hover": {
    backgroundColor: theme.palette.gray.trans[1],
  },
  "&.Mui-selected:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

/**
 * Switchable bar UI component leveraging native MUI tabs and custom styling.
 */
export const TabUI = <T extends string>({
  options,
  activeTab,
  onChange,
}: TabUIProps<T>) => {
  const theme = useTheme();

  return (
    <Box>
      <StyledTabs
        value={activeTab}
        onChange={(_, newValue: T) => onChange(newValue)}
        aria-label="Tab navigation switch">
        {options.map((option) => (
          <StyledTab
            key={option.id}
            value={option.id}
            label={option.label}
            disableRipple
          />
        ))}
      </StyledTabs>
    </Box>
  );
};
