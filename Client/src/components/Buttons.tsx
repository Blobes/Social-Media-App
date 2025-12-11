import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GenericObject } from "../types";
import Link from "next/link";

interface ButtonProps {
  variant?: "text" | "contained" | "outlined";
  children?: React.ReactNode | string;
  iconLeft?: React.ReactNode | null;
  iconRight?: React.ReactNode | null;
  style?: GenericObject<string>;
  overrideStyle?: "full" | "partial";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  options?: GenericObject<any>;
  submit?: boolean;
}

export const AppButton = ({
  variant = "contained",
  children = "children",
  iconLeft = null,
  iconRight = null,
  style = {},
  overrideStyle = "partial",
  onClick,
  href,
  options = {},
  submit = false,
}: ButtonProps) => {
  const theme = useTheme();

  const defaultStyle: GenericObject<string> = {
    minWidth: "fit-content",
    height: "unset",
    alignSelf: "unset",
    fontSize: "16px",
    padding: theme.boxSpacing(2, 8),
    display: "flex",
    gap: theme.gap(2),
    alignItems: "center",
  };

  const mergedStyle =
    overrideStyle === "full" ? style : { ...defaultStyle, ...style };
  // If it's a link, wrap button inside AnchorLink
  if (href) {
    return (
      <AnchorLink url={href}>
        <Button
          variant={variant}
          sx={mergedStyle}
          onClick={onClick}
          {...options}>
          {iconLeft}
          {children}
          {iconRight}
        </Button>
      </AnchorLink>
    );
  }
  // Normal button OR form submit button
  return (
    <Button
      variant={variant}
      sx={mergedStyle}
      type={submit ? "submit" : "button"}
      onClick={!submit ? onClick : undefined} // Only attach onClick if NOT submit
      {...options}>
      {iconLeft}
      {children}
      {iconRight}
    </Button>
  );
};

interface AnchorLinkProps {
  children?: React.ReactNode | string;
  url: string;
  icon?: React.ReactNode | null;
  style?: GenericObject<string | number>;
  overrideStyle?: "full" | "partial";
  [key: string]: any;
}
export const AnchorLink = ({
  children = "children",
  url,
  icon = null,
  style = {},
  overrideStyle = "partial",
  ...rest
}: AnchorLinkProps) => {
  const theme = useTheme();

  const defaultStyle: GenericObject<string> = {
    textAlign: "center",
    textDecoration: "none",
    fontSize: "16px",
    color: theme.palette.gray[300],
  };
  const mergedStyle =
    overrideStyle === "full" ? style : { ...defaultStyle, ...style };
  return (
    <Link href={url} style={mergedStyle} {...rest}>
      {icon && icon} {children}
    </Link>
  );
};
