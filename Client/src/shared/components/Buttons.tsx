import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GenericObject } from "../types";

interface ButtonProps {
  variant?: "text" | "contained" | "outlined";
  label?: string;
  icon?: React.ReactNode | null;
  style?: GenericObject<string>;
  overrideStyle?: "full" | "partial";
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CustomButton = ({
  variant = "contained",
  label = "Label",
  icon = null,
  style = {},
  overrideStyle = "partial",
  onClick,
}: ButtonProps) => {
  const theme = useTheme();

  const defaultStyle: GenericObject<string> = {
    minWidth: "fit-content",
    height: "unset",
    alignSelf: "unset",
    fontSize: "14px",
    padding: theme.boxSpacing(2, 4),
    display: "flex",
    gap: theme.gap(2),
    alignItems: "center",
    color: theme.palette.gray[300],
  };
  const mergedStyle =
    overrideStyle === "full" ? style : { ...defaultStyle, ...style };
  return (
    <Button variant={variant} sx={mergedStyle} onClick={onClick}>
      {icon && icon} {label}
    </Button>
  );
};
