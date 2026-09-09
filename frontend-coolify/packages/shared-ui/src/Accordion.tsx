"use client";

import React, { useState } from "react";
import {
  Accordion as MuiAccordion,
  AccordionSummary as MuiAccordionSummary,
  AccordionDetails as MuiAccordionDetails,
  Typography,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ChevronDown } from "lucide-react";
import { GenericStyle } from "@repo/core";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  subtitle?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultExpandedIds?: string[];
  style?: {
    container?: GenericStyle;
    item?: GenericStyle;
    summary?: GenericStyle;
    details?: GenericStyle;
  };
  expandIcon?: React.ReactNode;
  expandIconSize?: number;
}

/**
 * Reusable application accordion supporting single/multi expandable sections,
 * custom styling overrides, and theme-consistent typography.
 */
export const Accordion = ({
  items,
  allowMultiple = false,
  defaultExpandedIds = [],
  style,
  expandIcon,
  expandIconSize = 20,
}: AccordionProps) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState<string[]>(defaultExpandedIds);

  const isExpanded = (id: string) => expanded.includes(id);

  const handleChange =
    (id: string) => (_event: React.SyntheticEvent, isNowExpanded: boolean) => {
      if (allowMultiple) {
        setExpanded((prev) =>
          isNowExpanded ? [...prev, id] : prev.filter((item) => item !== id),
        );
      } else {
        setExpanded(isNowExpanded ? [id] : []);
      }
    };

  /**
   * Renders either the provided custom toggle element or a Lucide ChevronDown fallback.
   */
  const renderExpandIcon = () => {
    if (expandIcon) return expandIcon;

    return (
      <ChevronDown
        size={expandIconSize}
        color={theme.palette.gray[300]}
        style={{
          transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    );
  };

  return (
    <Stack
      sx={{
        width: "100%",
        gap: theme.gap(4),
        ...style?.container,
      }}
    >
      {items.map((item) => {
        const expandedState = isExpanded(item.id);
        return (
          <MuiAccordion
            key={item.id}
            expanded={expandedState}
            onChange={handleChange(item.id)}
            disabled={item.disabled}
            disableGutters
            elevation={0}
            square={false}
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.radius[2],
              border: `1px solid ${theme.palette.gray[100]}`,
              overflow: "hidden",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              "&:before": {
                display: "none",
              },
              "&:hover": {
                borderColor: theme.palette.gray[200],
              },
              "&.Mui-expanded": {
                borderColor: theme.palette.primary.main,
                // boxShadow: theme.shadows[1],
              },
              "&.Mui-disabled": {
                backgroundColor: theme.palette.action.disabledBackground,
                opacity: 0.6,
              },
              ...style?.item,
            }}
          >
            <MuiAccordionSummary
              expandIcon={renderExpandIcon()}
              sx={{
                padding: theme.boxSpacing(6, 8),
                minHeight: "unset",
                "& .MuiAccordionSummary-content": {
                  margin: 0,
                  gap: theme.gap(4),
                  alignItems: "center",
                  "&.Mui-expanded": {
                    margin: 0,
                  },
                },
                "& .MuiAccordionSummary-expandIconWrapper": {
                  transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&.Mui-expanded": {
                    transform: "rotate(180deg)",
                  },
                },
                ...style?.summary,
              }}
            >
              <Stack sx={{ flex: 1, gap: theme.gap(1) }}>
                {typeof item.title === "string" ? (
                  <Typography
                    sx={{
                      ...theme.typography.text3,
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {item.title}
                  </Typography>
                ) : (
                  item.title
                )}

                {item.subtitle &&
                  (typeof item.subtitle === "string" ? (
                    <Typography
                      sx={{
                        ...theme.typography.text5,
                        color: theme.palette.gray[200],
                      }}
                    >
                      {item.subtitle}
                    </Typography>
                  ) : (
                    item.subtitle
                  ))}
              </Stack>

              {item.icon}
            </MuiAccordionSummary>

            <MuiAccordionDetails
              sx={{
                padding: theme.boxSpacing(0, 8, 6, 8),
                ...theme.typography.text4,
                color: theme.palette.text.secondary,
                ...style?.details,
              }}
            >
              {item.content}
            </MuiAccordionDetails>
          </MuiAccordion>
        );
      })}
    </Stack>
  );
};
