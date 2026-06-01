"use client";

import React from "react";
import { Button, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";
import { crossZoneCheck, debouncedPrefetch, prefetchPage } from "@repo/helpers";
import { GenericStyle } from "@repo/core";

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
  children?: React.ReactNode | string;
  style?: GenericStyle;
  overrideStyle?: "full" | "partial";
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  href?: string;
  options?: any;
  submit?: boolean;
}

export const AppButton = ({
  variant = "contained",
  children = "children",
  style = {},
  overrideStyle = "partial",
  onClick,
  href,
  options = {},
  submit = false,
}: ButtonProps) => {
  const theme = useTheme();

  const defaultStyle = {
    minWidth: "fit-content",
    height: "unset",
    alignSelf: "unset",
    fontSize: "16px",
    padding: theme.boxSpacing(1, 8, 2, 8),
    display: "flex",
    gap: theme.gap(2),
    alignItems: "center",
  };
  const textVarDefaultStyle = {
    fontSize: "15px",
    fontWeight: "600",
    height: "unset",
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
      <Button
        component={isCrossZone ? "a" : NextLink}
        href={href}
        onMouseEnter={() => handlePrefetch(href, isCrossZone, true)}
        onMouseDown={() => handlePrefetch(href, isCrossZone)}
        onTouchStart={() => handlePrefetch(href, isCrossZone)}
        {...buttonProps}>
        {children}
      </Button>
    );
  }

  return (
    <Button type={submit ? "submit" : "button"} {...buttonProps}>
      {children}
    </Button>
  );
};

interface AnchorLinkProps {
  children: React.ReactNode | string;
  url: string;
  style?: GenericStyle;
  overrideStyle?: "full" | "partial";
  [key: string]: any;
}
export const AnchorLink = ({
  children,
  url,
  style = {},
  overrideStyle = "partial",
  ...rest
}: AnchorLinkProps) => {
  const theme = useTheme();

  const defaultStyle = {
    display: "inline-flex",
    textAlign: "center",
    textDecoration: "none",
    fontSize: "16px",
    color: theme.palette.gray[300],
    width: "fit-content",
    transition:
      "background-color 0.3s linear, color 0.2s linear, stroke 0.2s linear",
  };
  const mergedStyle =
    overrideStyle === "full" ? style : { ...defaultStyle, ...style };

  const isCrossZone = crossZoneCheck(url);

  return (
    <Link
      component={isCrossZone ? "a" : NextLink}
      href={url}
      sx={{
        ...mergedStyle,
      }}
      onMouseEnter={() => handlePrefetch(url, isCrossZone, true)}
      onMouseDown={() => handlePrefetch(url, isCrossZone)}
      onTouchStart={() => handlePrefetch(url, isCrossZone)}
      {...rest}>
      {children}
    </Link>
  );
};
