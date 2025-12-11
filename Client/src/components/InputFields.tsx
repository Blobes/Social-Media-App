import { useTheme } from "@mui/material/styles";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useState } from "react";
import { AccountCircle, Visibility, VisibilityOff } from "@mui/icons-material";

interface TextInputProps {
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
  onChange,
  onFocus,
  onBlur,
}: TextInputProps) => {
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

interface AffixedInputProps extends TextInputProps {
  affix?: React.ReactNode | string;
  affixPosition?: "start" | "end";
}
export const AffixedInput = ({
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
  affix = <AccountCircle />,
  affixPosition = "start",
  onChange,
  onFocus,
  onBlur,
}: AffixedInputProps) => {
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
      slotProps={{
        input: {
          [affixPosition === "start" ? "startAdornment" : "endAdornment"]: (
            <InputAdornment position={affixPosition}>{affix}</InputAdornment>
          ),
        },
      }}
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
}: AffixedInputProps) => {
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
                onMouseUp={handleMouseUp}
                edge="end">
                {showPassword ? (
                  <Visibility sx={{ fill: theme.palette.gray[200] }} />
                ) : (
                  <VisibilityOff sx={{ fill: theme.palette.gray[200] }} />
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
