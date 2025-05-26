import { styled } from "@mui/material/styles";
import { TextareaAutosize } from "@mui/material";
import { GenericObject } from "../types";
import { useState } from "react";
import { useStyles } from "../helpers/styles";

const StyledLabel = styled("label")<{ shrink: boolean }>(
  ({ theme, shrink }) =>
    ({
      position: "absolute",
      left: theme.boxSpacing(2),
      top: shrink ? theme.boxSpacing(1) : theme.boxSpacing(3),
      fontSize: shrink ? 12 : 17,
      color: theme.palette.gray[200],
      transition: "all 0.2s ease",
      pointerEvents: "none",
      width: "100%",
      textWrap: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      padding: theme.boxSpacing(0),
    } as any)
);

interface TextAreaProps {
  style?: {
    default: GenericObject<string>;
    focused: GenericObject<string>;
    hover: GenericObject<string>;
  };
  maxRows?: number;
  minRows?: number;
  placeholder?: string;
  label?: string;
  defaultValue?: string;
  maxLength?: number | null;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
}

const StyledTextarea = styled(TextareaAutosize, {
  shouldForwardProp: (prop) => prop !== "customStyle",
})<{ customStyle: TextAreaProps["style"]; label: TextAreaProps["label"] }>(
  ({ label, customStyle, theme }) => {
    const styles = {
      width: "100%",
      padding: label
        ? theme.boxSpacing(10, 0, 2, 2)
        : theme.boxSpacing(3, 2, 2),
      boxSizing: "border-box",
      fontFamily: "inherit",
      fontSize: "17px",
      lineHeight: 1.4,
      color: theme.palette.gray[300],
      backgroundColor: "unset",
      resize: "none",
      border: "none",
      ...useStyles().scrollBarStyle(),
      ...customStyle?.default,
      "&:focus": {
        border: "none",
        outline: "none",
        ...customStyle?.focused,
      },
      "&:hover": {
        ...customStyle?.hover,
      },
    };
    return styles as any;
  }
);

export const ResponsiveTextarea = ({
  style = { default: {}, focused: {}, hover: {} },
  maxRows = 4,
  minRows = 1,
  placeholder = "Type here...",
  label,
  defaultValue = "",
  maxLength = null,
  onChange,
  onFocus,
  onBlur,
}: TextAreaProps) => {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const shrink = focused || value.length > 0;
  return (
    <>
      {label && (
        <StyledLabel htmlFor="textarea" shrink={shrink}>
          {label}
        </StyledLabel>
      )}
      <StyledTextarea
        id="textarea"
        aria-label="Text area"
        customStyle={style}
        maxRows={maxRows}
        minRows={minRows}
        label={label}
        placeholder={label ? "" : placeholder}
        defaultValue={defaultValue}
        maxLength={maxLength ?? undefined}
        onChange={(e) => {
          setValue(e.target.value);
          onChange && onChange(e);
        }}
        onFocus={(e) => {
          setFocused(true);
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur && onBlur(e);
        }}
      />
    </>
  );
};
