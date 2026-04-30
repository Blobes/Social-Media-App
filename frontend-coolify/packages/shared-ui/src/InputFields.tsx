"use client";

import React, {
  useState,
  useRef,
  useCallback,
  ClipboardEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { useTheme } from "@mui/material/styles";
import {
  FormHelperText,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Eye, EyeClosed } from "lucide-react";
import { GenericStyle } from "@repo/core";

export interface InputProps {
  variant?: "outlined" | "filled";
  id?: string;
  type?: "text" | "number" | "email" | "search" | "password";
  value?: string;
  placeholder?: string;
  label?: string;
  helperText?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  affix?: React.ReactNode;
  affixPosition?: "start" | "end";
  focusResizeWidth?: boolean;
  onChange?: (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  onFocus?: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  onBlur?: (
    event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => void;
  style?: GenericStyle;
}
export const TextInput = ({
  variant = "outlined",
  id = "",
  type = "text",
  value,
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
      value={value}
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
  value,
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
      value={value}
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
                {showPassword ? <Eye size={22} /> : <EyeClosed size={22} />}
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

export interface OtpInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  error?: boolean;
  helperText?: string;
  label?: string;
  disabled?: boolean;
  autoSubmit?: boolean;
  style?: GenericStyle;
}
/**
 * Renders a segmented OTP/verification code input using MUI TextField per cell.
 */
export const OtpInput = ({
  length = 6,
  onComplete,
  onChange,
  error = false,
  helperText = "",
  label = "Enter code",
  disabled = false,
  autoSubmit = true,
  style,
}: OtpInputProps) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const theme = useTheme();

  /** Derive complete code string from digits array. */
  const getCode = (arr: string[]) => arr.join("");

  /** Focus the input at the given index, clamped to valid range. */
  const focusIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[clamped]?.focus();
    },
    [length],
  );

  /** Handle single character entry and advance focus. */
  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const char = e.target.value.replace(/\D/g, "").slice(-1);
      const next = [...digits];
      next[index] = char;
      setDigits(next);

      const code = getCode(next);
      onChange?.(code);

      if (char) {
        if (index < length - 1) {
          focusIndex(index + 1);
        } else if (autoSubmit && next.every((d) => d !== "")) {
          onComplete?.(code);
        }
      }
    },
    [digits, length, autoSubmit, onChange, onComplete, focusIndex],
  );

  /** Handle backspace, arrow navigation, and delete. */
  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const next = [...digits];
        if (next[index]) {
          next[index] = "";
          setDigits(next);
          onChange?.(getCode(next));
        } else {
          focusIndex(index - 1);
          if (index > 0) {
            next[index - 1] = "";
            setDigits(next);
            onChange?.(getCode(next));
          }
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusIndex(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusIndex(index + 1);
      } else if (e.key === "Delete") {
        e.preventDefault();
        const next = [...digits];
        next[index] = "";
        setDigits(next);
        onChange?.(getCode(next));
      }
    },
    [digits, onChange, focusIndex],
  );

  /** Distribute pasted digits across cells starting from the focused index. */
  const handlePaste = useCallback(
    (index: number, e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length - index);
      if (!pasted) return;

      const next = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        next[index + i] = pasted[i];
      }
      setDigits(next);

      const code = getCode(next);
      onChange?.(code);
      focusIndex(Math.min(index + pasted.length, length - 1));

      if (autoSubmit && next.every((d) => d !== "")) {
        onComplete?.(code);
      }
    },
    [digits, length, autoSubmit, onChange, onComplete, focusIndex],
  );

  /** Select existing digit on focus for instant overwrite. */
  const handleFocus = useCallback((index: number) => {
    inputRefs.current[index]?.select();
  }, []);

  return (
    <Stack sx={{ flexDirection: "column", gap: theme.gap(4), ...style }}>
      {label && (
        <Typography
          variant="body2"
          component="label"
          sx={{
            color: theme.palette.gray[200],
            fontSize: "14px",
            // fontWeight: 500,
          }}>
          {label}
        </Typography>
      )}

      <Stack sx={{ gap: theme.gap(3), flexDirection: "row" }}>
        {digits.map((digit, index) => (
          <TextField
            key={index}
            variant="outlined"
            size="small"
            value={digit}
            disabled={disabled}
            error={error}
            inputRef={(el) => {
              inputRefs.current[index] = el;
            }}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleChange(index, e)
            }
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
              handleKeyDown(index, e)
            }
            onPaste={(e: ClipboardEvent<HTMLInputElement>) =>
              handlePaste(index, e)
            }
            onFocus={() => handleFocus(index)}
            slotProps={{
              input: {
                inputMode: "numeric",
                autoComplete: index === 0 ? "one-time-code" : "off",
              },
              htmlInput: {
                maxLength: 1,
                pattern: "[0-9]*",
                style: {
                  textAlign: "center",
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  width: "100%",
                  padding: 0,
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                width: style?.input.width || 44,
                height: 48,
                minWidth: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: theme.boxSpacing(4),
              },
            }}
          />
        ))}
      </Stack>

      {helperText && (
        <FormHelperText error={error} sx={{ mx: 0 }}>
          {helperText}
        </FormHelperText>
      )}
    </Stack>
  );
};
