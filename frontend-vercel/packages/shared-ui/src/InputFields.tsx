"use client"

import { useTheme } from "@mui/material/styles";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";

interface InputProps {
  variant?: "outlined" | "filled";
  id?: string;
  type?: "text" | "number" | "email" | "search" | "password";
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  affix?: React.ReactNode | string;
  affixPosition?: "start" | "end";
  onChange?: (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void;
  onFocus?: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void;
  onBlur?: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void;
}
export const TextInput = ({
  variant = "outlined",
  id = "",
  type = "text",
  defaultValue,
  placeholder = "Type here...",
  label = "Input Label",
  helperText = "",
  required = false,
  disabled = false,
  error = false,
  affix,
  affixPosition = "start",
  onChange,
  onFocus,
  onBlur,
}: InputProps) => {
  return (
    <TextField
      variant={variant}
      id={id}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      label={label}
      helperText={helperText}
      required={required}
      disabled={disabled}
      error={error}
      size="small"
      fullWidth
      {...(affix && {
        slotProps: {
          input: {
            [affixPosition === "start" ? "startAdornment" : "endAdornment"]: (
              <InputAdornment position={affixPosition}>{affix}</InputAdornment>
            ),
          },
        },
      })}
      onChange={(e) => {
        onChange && onChange(e);
      }}
      onFocus={(e) => {
        onFocus && onFocus(e);
      }}
      onBlur={(e) => {
        onBlur && onBlur(e);
      }}
    />
  );
};

// Password Input component for Validating Passwords
export const PasswordInput = ({
  variant = "outlined",
  id = "",
  defaultValue,
  placeholder = "Type here...",
  label = "Input Label",
  helperText = "",
  required = false,
  disabled = false,
  error = false,
  affixPosition = "end",
  onBlur,
  onChange,
  onFocus,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const handleMouseUp = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const theme = useTheme();
  return (
    <TextField
      variant={variant}
      id={id}
      type={showPassword ? "text" : "password"}
      defaultValue={defaultValue}
      placeholder={placeholder}
      label={label}
      helperText={helperText}
      required={required}
      disabled={disabled}
      error={error}
      size="small"
      fullWidth
      slotProps={{
        input: {
          [affixPosition === "start" ? "startAdornment" : "endAdornment"]: (
            <InputAdornment position={affixPosition}>
              <IconButton
                aria-label={
                  showPassword ? "hide the password" : "display the password"
                }
                onClick={toggleShowPassword}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}>
                {showPassword ? (
                  <Eye size={22} />
                ) : (<EyeClosed size={22} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      onBlur={(e) => {
        onBlur && onBlur(e);
      }}
      onChange={(e) => {
        onChange && onChange(e);
      }}
      onFocus={(e) => {
        onFocus && onFocus(e);
      }}
    />
  );
};
