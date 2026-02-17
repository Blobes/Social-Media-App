"use client"

import { Button, Link } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import NextLink from "next/link";

interface ButtonProps {
  variant?: "text" | "contained" | "outlined";
  children?: React.ReactNode | string;
  style?: any;
  overrideStyle?: "full" | "partial";
  onClick?: (event: React.MouseEvent) => void;
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
    fontSize: "14px",
    fontWeight: "800",
    height: "unset",
    color: theme.palette.primary.dark,
    padding: theme.boxSpacing(0, 3),
    minWidth: "unset",
    alignSelf: "unset",
    "&:hover": {
      backgroundColor: theme.fixedColors.mainTrans,
    }
  };
  const mergedStyle = overrideStyle === "full" ? style
    : {
      ...(variant === "text" ? textVarDefaultStyle : defaultStyle),
      ...style,
    };

  const buttonProps = {
    variant,
    sx: mergedStyle,
    ...(onClick && { onClick: (e: React.MouseEvent) => onClick(e) }),
    ...options,
  };

  if (href) {
    return (
      <Button
        component={NextLink}
        href={href}
        {...buttonProps}>
        {children}
      </Button>
    );
  }
  return (
    <Button
      type={submit ? "submit" : "button"}
      {...buttonProps}>
      {children}
    </Button>
  );
};

interface AnchorLinkProps {
  children: React.ReactNode | string
  url: string;
  style?: any;
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
    transition: "background-color 0.3s linear, color 0.2s linear, stroke 0.2s linear"
  };
  const mergedStyle =
    overrideStyle === "full" ? style : { ...defaultStyle, ...style };
  return (
    <Link component={NextLink} href={url}
      sx={{
        ...mergedStyle,
      }}
      prefetch={false}
      {...rest}
    >
      {children}
    </Link >
  );
};
