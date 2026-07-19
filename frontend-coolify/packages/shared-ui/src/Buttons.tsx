"use client";

import React from "react";
import { Button, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { crossZoneCheck, debouncedPrefetch, prefetchPage } from "@repo/helpers";
import { GenericStyle } from "@repo/core";
import { A11y } from "./A11y";

/**
 * Prefetches cross-zone asset bundles on relevant navigation user intents.
 */
const handlePrefetch = (
  href: string,
  isCrossZone: boolean,
  onHover = false,
) => {
  if (!isCrossZone) return;
  if (onHover) debouncedPrefetch(href, !!isCrossZone);
  else prefetchPage(href, isCrossZone);
};

interface ButtonProps {
  variant?: "text" | "contained" | "outlined";
  children?: React.ReactNode;
  style?: GenericStyle;
  overrideStyle?: "full" | "partial";
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  options?: any;
  submit?: boolean;
}

/**
 * Global application button offering unified routing capabilities and internationalization.
 */
export const AppButton = ({
  variant = "contained",
  children,
  style = {},
  overrideStyle = "partial",
  onClick,
  href,
  options = {},
  submit = false,
}: ButtonProps) => {
  const theme = useTheme();

  const defaultStyle = {
    ...theme.typography.text3,
    fontWeight: 600,
    minWidth: "fit-content",
    height: "unset",
    alignSelf: "unset",
    textTransform: "unset",
    padding: theme.boxSpacing(1, 8, 2, 8),
    display: "flex",
    gap: theme.gap(2),
    alignItems: "center",
  };
  const textVarDefaultStyle = {
    ...theme.typography.text4,
    fontWeight: 600,
    height: "unset",
    textTransform: "unset",
    color: theme.palette.primary.light,
    padding: theme.boxSpacing(0, 4),
    minWidth: "unset",
    alignSelf: "unset",
    "&:hover": {
      backgroundColor: theme.fixedColors.pTrans,
    },
  };
  const mergedStyle =
    overrideStyle === "full"
      ? style
      : {
          ...(variant === "text" ? textVarDefaultStyle : defaultStyle),
          ...style,
        };

  const buttonProps = {
    variant,
    sx: mergedStyle,
    ...(onClick && {
      onClick: (e: React.MouseEvent<HTMLElement>) => onClick(e),
    }),
    ...options,
  };

  if (href) {
    const isCrossZone = crossZoneCheck(href);
    return (
      <A11y useCase="interactive">
        <Button
          component={isCrossZone ? "a" : NextLink}
          href={href}
          onMouseEnter={() => handlePrefetch(href, isCrossZone, true)}
          onMouseDown={() => handlePrefetch(href, isCrossZone)}
          onTouchStart={() => handlePrefetch(href, isCrossZone)}
          {...buttonProps}>
          {children}
        </Button>
      </A11y>
    );
  }
  return (
    <A11y useCase="interactive">
      <Button type={submit ? "submit" : "button"} {...buttonProps}>
        {children}
      </Button>
    </A11y>
  );
};

type AnchorLinkProps = Omit<ButtonProps, "variant">;
/**
 * Structural link surface standardizing microservice cross-zone navigations and translation keys.
 */
export const AnchorLink = ({
  children,
  href,
  style = {},
  overrideStyle = "partial",
  ...rest
}: AnchorLinkProps) => {
  const theme = useTheme();

  const defaultStyle = {
    display: "inline-flex",
    textAlign: "center",
    textDecoration: "none",
    color: theme.palette.gray[300],
    width: "fit-content",
    transition:
      "background-color 0.3s linear, color 0.2s linear, stroke 0.2s linear",
  };
  const mergedStyle =
    overrideStyle === "full" ? style : { ...defaultStyle, ...style };

  if (!href) return;
  const isCrossZone = crossZoneCheck(href);

  return (
    <A11y useCase="interactive">
      <Link
        component={isCrossZone ? "a" : NextLink}
        href={href}
        sx={{
          ...theme.typography.text4,
          ...mergedStyle,
        }}
        onMouseEnter={() => handlePrefetch(href, isCrossZone, true)}
        onMouseDown={() => handlePrefetch(href, isCrossZone)}
        onTouchStart={() => handlePrefetch(href, isCrossZone)}
        {...rest}>
        {children}
      </Link>
    </A11y>
  );
};
