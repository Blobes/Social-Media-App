"use client";

import React, {
  useState,
  useRef,
  useCallback,
  ClipboardEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { useTheme, styled } from "@mui/material/styles";
import {
  Box,
  FormHelperText,
  IconButton,
  InputAdornment,
  inputLabelClasses,
  outlinedInputClasses,
  Stack,
  TextField,
  TextareaAutosize,
  useMediaQuery,
} from "@mui/material";
import { Eye, EyeClosed, FileUp, Keyboard } from "lucide-react";
import {
  AUTH_INPUT,
  COMMON_INPUT,
  GenericStyle,
  ICountryItem,
  ITranslation,
  LISTS,
  ListType,
  SupportedIsoCode,
  useGlobalStore,
} from "@repo/core";
import {
  formatPhoneNumber,
  processPhoneFormatting,
  scrollBarStyle,
} from "@repo/helpers";
import { DisplayList as CountryList } from "./Menu";
import { TransText } from "./Text";
import { useVirtualKeyboard } from "@repo/shared-hooks";
import { VirtualKeyboard } from "./Keyboard";

export interface InputProps {
  variant?: "outlined" | "filled";
  id?: string;
  type?: "text" | "number" | "email" | "search" | "password" | "tel";
  value?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
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

interface SharedStyle {
  theme: any;
  style: any;
  value: any;
  currLang?: SupportedIsoCode;
}

export const sharedStyle = (styleOptions: SharedStyle) => {
  const { style, theme, value, currLang } = styleOptions;

  const rtlLabel = {
    default: {
      right: 0,
      left: "unset",
      transform: "translate(-12px, 17px)",
    },
    focused: {
      right: 0,
      left: "unset",
      transform: "translate(0px, 7px) scale(0.83)",
    },
  };
  const input = {
    padding: theme.boxSpacing(7, 4, 2, 4),
  };

  return {
    [`& .${inputLabelClasses.root}`]: {
      ...(currLang === "ar" && rtlLabel.default),
    },
    [`& .${inputLabelClasses.root}.${inputLabelClasses.focused}, 
      & .${inputLabelClasses.root}.${inputLabelClasses.shrink}, 
      & .${inputLabelClasses.root}.${inputLabelClasses.error}`]: {
      ...(currLang === "ar" && rtlLabel.focused),
      ...style?.label,
    },
    [`& .${outlinedInputClasses.input}`]: {
      color: `${theme?.palette.gray[300]}`,
      ...input,
      ...style?.input,
    },
    [`& .${outlinedInputClasses.root}`]: {
      ...(value?.length > 0 && {
        ...input,
      }),
      ...style?.outline,
    },
    [`& .${outlinedInputClasses.focused}`]: {
      ...input,
      ...style?.outline?.focused,
    },
  };
};

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
  style,
}: InputProps) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const currLang = useGlobalStore((state) => state.currentLanguage);

  const {
    showKeyboard,
    setShowKeyboard,
    useVirtualKeyboard: isVirtualActive,
    registerAsActiveInput,
  } = useVirtualKeyboard(inputRef, onChange);

  return (
    <TextField
      inputRef={inputRef}
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
      slotProps={{
        input: {
          // Render the start surface only if explicitly targeted by affix configuration
          ...(affix &&
            affixPosition === "start" && {
              startAdornment: (
                <InputAdornment position="start">{affix}</InputAdornment>
              ),
            }),
          // Consolidated end surface wrapper to handle overlaps seamlessly
          ...((isVirtualActive || (affix && affixPosition === "end")) && {
            endAdornment: (
              <InputAdornment position="end">
                <Stack
                  flexDirection="row"
                  alignItems="center"
                  gap={theme.gap?.(1) || 0.5}>
                  {isVirtualActive && (
                    <IconButton
                      onClick={() => {
                        registerAsActiveInput();
                        setShowKeyboard(!showKeyboard);
                      }}
                      size="small">
                      <Keyboard size={18} />
                    </IconButton>
                  )}
                  {affix && affixPosition === "end" && affix}
                </Stack>
              </InputAdornment>
            ),
          }),
        },
        htmlInput: {
          inputMode: isVirtualActive && showKeyboard ? "none" : "text",
        },
      }}
      sx={{
        ...sharedStyle({ theme, style, value, currLang }),
        ...style,
      }}
      onChange={(e) => onChange && onChange(e)}
      onFocus={(e) => {
        registerAsActiveInput();
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
  style,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();
  const currLang = useGlobalStore((state) => state.currentLanguage);

  const {
    showKeyboard,
    setShowKeyboard,
    useVirtualKeyboard: isVirtualActive,
    registerAsActiveInput,
  } = useVirtualKeyboard(inputRef, onChange);

  const toggleShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const handleMouseUp = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <TextField
      inputRef={inputRef}
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
      sx={{
        ...sharedStyle({ theme, style, value, currLang }),
        ...style,
      }}
      slotProps={{
        input: {
          // Manage the start adornment row position independently
          ...(affixPosition === "start" && {
            startAdornment: (
              <InputAdornment position="start">
                <IconButton
                  aria-label={
                    showPassword ? "hide the password" : "display the password"
                  }
                  onClick={toggleShowPassword}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  size="small">
                  {showPassword ? <Eye size={22} /> : <EyeClosed size={22} />}
                </IconButton>
              </InputAdornment>
            ),
          }),
          // Handle combination or standalone instances on the end adornment surface
          endAdornment: (
            <InputAdornment position="end">
              <Stack
                flexDirection="row"
                alignItems="center"
                gap={theme.gap(0.2)}>
                {isVirtualActive && (
                  <IconButton
                    onClick={() => {
                      registerAsActiveInput();
                      setShowKeyboard(!showKeyboard);
                    }}
                    size="small">
                    <Keyboard size={18} />
                  </IconButton>
                )}
                {affixPosition === "end" && (
                  <IconButton
                    aria-label={
                      showPassword
                        ? "hide the password"
                        : "display the password"
                    }
                    onClick={toggleShowPassword}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    size="small">
                    {showPassword ? <Eye size={22} /> : <EyeClosed size={22} />}
                  </IconButton>
                )}
              </Stack>
            </InputAdornment>
          ),
        },
        htmlInput: {
          inputMode: isVirtualActive && showKeyboard ? "none" : "text",
        },
      }}
      onChange={(e) => onChange && onChange(e)}
      onFocus={(e) => {
        registerAsActiveInput();
        onFocus && onFocus(e);
      }}
      onBlur={(e) => {
        onBlur && onBlur(e);
      }}
    />
  );
};

export interface PhoneInputProps extends Omit<InputProps, "onChange"> {
  includeCountryCode?: boolean;
  onPhoneChange: (value: string) => void;
  onClearInlineMsg?: () => void;
}
/**
 * Manages phone input strings, structural cursor alignment, and lazy-loaded contextual country lists.
 */
export const PhoneInput = ({
  variant = "outlined",
  id = "",
  value = "",
  placeholder = "e.g. +1234567890",
  label = "Phone Number",
  helperText = "",
  required = false,
  disabled = false,
  error = false,
  includeCountryCode = true,
  onPhoneChange,
  onBlur,
  onFocus,
  onClearInlineMsg,
  style,
}: PhoneInputProps) => {
  const theme = useTheme();
  const { COUNTRY_LIST } = LISTS();
  const countryMenuRef = useRef<any>(null);
  const isCountrySelectedRef = useRef<boolean>(false);
  const currLang = useGlobalStore((state) => state.currentLanguage);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleMenuClose = useCallback(() => {
    if (includeCountryCode && !isCountrySelectedRef.current) {
      onPhoneChange("");
    }
  }, [includeCountryCode, onPhoneChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.target as HTMLInputElement;
      const isDeleting =
        (e.nativeEvent as any)?.inputType === "deleteContentBackward";
      const start = target.selectionStart || 0;

      const result = processPhoneFormatting(
        target.value,
        start,
        isDeleting,
        includeCountryCode,
        isCountrySelectedRef.current,
      );

      if (result.shouldReset) {
        onClearInlineMsg?.();
        onPhoneChange("");
        isCountrySelectedRef.current = false;
        return;
      }
      if (result.shouldOpenMenu) {
        countryMenuRef.current?.openMenu(target);
      }
      onClearInlineMsg?.();

      window.requestAnimationFrame(() => {
        target.setSelectionRange(result.nextCursor, result.nextCursor);
      });
      onPhoneChange(result.nextVal);
    },
    [includeCountryCode, onPhoneChange, onClearInlineMsg],
  );

  const {
    showKeyboard,
    setShowKeyboard,
    useVirtualKeyboard: isVirtualActive,
    registerAsActiveInput,
  } = useVirtualKeyboard(inputRef, handleChange, "phone-formatted");

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <TextField
        inputRef={inputRef}
        variant={variant}
        id={id}
        type="tel"
        inputMode="tel"
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
            ...(isVirtualActive && {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      registerAsActiveInput();
                      setShowKeyboard(!showKeyboard);
                    }}
                    size="small">
                    <Keyboard size={18} />
                  </IconButton>
                </InputAdornment>
              ),
            }),
          },
        }}
        sx={{
          ...sharedStyle({ theme, style, value, currLang }),
          ...style,
        }}
        onChange={handleChange}
        onFocus={(e) => {
          registerAsActiveInput();
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          onBlur && onBlur(e);
        }}
      />

      {includeCountryCode && (
        <CountryList<ICountryItem>
          menuRef={countryMenuRef}
          list={COUNTRY_LIST}
          listName={ListType.COUNTRY}
          showSearchBar
          stickToScreen={false}
          heightThreshold={65}
          style={{
            item: {
              padding: theme.boxSpacing(4, 8),
              gap: "10px",
              borderRadius: 0,
              "& svg": { width: "16px", height: "16px" },
            },
            container: {
              padding: 0,
            },
          }}
          onMenuClose={handleMenuClose}
          onItemClick={(item) => {
            if (item?.code) {
              isCountrySelectedRef.current = true;
              const formattedPrefix = `(+${item.code.replace(/\+/g, "")}) `;
              onPhoneChange(formattedPrefix);
            }
          }}
        />
      )}
    </Box>
  );
};

export interface OtpInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  error?: boolean;
  tHelperText?: ITranslation;
  tLabel?: ITranslation;
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
  tHelperText,
  tLabel,
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
      {tLabel && (
        <TransText
          {...(tLabel ?? AUTH_INPUT.label.enter_code)}
          sx={{
            ...theme.typography.body2,
            color: theme.palette.gray[200],
            fontSize: "14px",
          }}
        />
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
              [`& .${outlinedInputClasses.root}`]: {
                width: style?.input.width || 44,
                height: 50,
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

      {tHelperText && (
        <FormHelperText error={error} sx={{ mx: 0 }}>
          <TransText {...(tLabel ?? AUTH_INPUT.label.enter_code)} noComponent />
        </FormHelperText>
      )}
    </Stack>
  );
};

export interface FileInputProps {
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  selectedCount?: number;
  tPlaceholder?: ITranslation;
}

/**
 * Reusable layout boundary wrapper managing system file selection triggers.
 */
export const FileInput = ({
  onChange,
  multiple = true,
  accept = "image/*,video/*",
  disabled = false,
  selectedCount = 0,
  tPlaceholder,
}: FileInputProps) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        border: `1px dashed ${theme.palette.gray[100]}`,
        padding: theme.boxSpacing(8, 8),
        borderRadius: theme.radius[3],
        backgroundColor: theme.palette.gray[50],
        display: "flex",
        flexDirection: "column",
        gap: theme.gap(4),
        alignItems: "center",
        width: "100%",
      }}>
      <Box
        component="label"
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          width: "100%",
        }}>
        <FileUp
          size={20}
          style={{ marginRight: "8px", stroke: theme.palette.gray[200] }}
        />
        {selectedCount > 0 ? (
          <TransText
            {...COMMON_INPUT.placeholder.media_files_selected(selectedCount)}
            sx={{
              ...theme.typography.body2,
              color: theme.palette.gray[200],
              flexGrow: 1,
            }}
          />
        ) : (
          <TransText
            {...(tPlaceholder ?? COMMON_INPUT.placeholder.choose_media_file)}
            sx={{
              ...theme.typography.body2,
              color: theme.palette.gray[200],
              flexGrow: 1,
            }}
          />
        )}
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={onChange}
          disabled={disabled}
          style={{ display: "none" }}
        />
      </Box>
    </Box>
  );
};

interface TextAreaProps extends InputProps {
  maxRows?: number;
  minRows?: number;
  maxLength?: number | null;
  style?: {
    default: GenericStyle;
    focused: GenericStyle;
    hover: GenericStyle;
  };
}

// TextArea Styled Input
const StyledTextarea = styled(TextareaAutosize, {
  shouldForwardProp: (prop) => prop !== "customStyle",
})<{ customStyle: TextAreaProps["style"]; label: TextAreaProps["label"] }>(({
  label,
  customStyle,
  theme,
}) => {
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const styles = {
    width: "100%",
    padding: label ? theme.boxSpacing(10, 0, 2, 2) : theme.boxSpacing(3, 2, 2),
    boxSizing: "border-box",
    fontFamily: "inherit",
    fontSize: "17px",
    lineHeight: 1.4,
    color: theme.palette.gray[300],
    backgroundColor: "unset",
    resize: "none",
    border: "none",
    ...scrollBarStyle(theme),
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
});

// TextArea Styled Label
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
    }) as any,
);

export const ResponsiveTextarea = ({
  style = { default: {}, focused: {}, hover: {} },
  maxRows = 4,
  minRows = 1,
  placeholder = "Type here...",
  label,
  value = "",
  maxLength = null,
  onChange,
  onFocus,
  onBlur,
}: TextAreaProps) => {
  const [focused, setFocused] = useState(false);
  // const [inputValue, setInputValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();

  const {
    showKeyboard,
    setShowKeyboard,
    useVirtualKeyboard: isVirtualActive,
    registerAsActiveInput,
  } = useVirtualKeyboard(textareaRef, onChange);

  const shrink = focused || value.length > 0;

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {label && (
        <StyledLabel htmlFor="textarea" shrink={shrink}>
          {label}
        </StyledLabel>
      )}
      {isVirtualActive && (
        <IconButton
          onClick={() => {
            registerAsActiveInput();
            setShowKeyboard(!showKeyboard);
          }}
          size="small"
          style={{
            position: "absolute",
            top: theme.boxSpacing(2),
            left: theme.boxSpacing(2),
            zIndex: 2,
          }}>
          <Keyboard size={18} />
        </IconButton>
      )}

      <StyledTextarea
        ref={textareaRef}
        id="textarea"
        aria-label="Text area"
        customStyle={style}
        maxRows={maxRows}
        minRows={minRows}
        label={label}
        placeholder={label ? "" : placeholder}
        value={value}
        maxLength={maxLength ?? undefined}
        onChange={(e: any) => onChange && onChange(e)}
        onFocus={(e: any) => {
          setFocused(true);
          if (isVirtualActive) setShowKeyboard(true);
          onFocus && onFocus(e);
        }}
        onBlur={(e: any) => {
          if (e.relatedTarget && e.relatedTarget.closest("[dir='rtl']")) return;
          setFocused(false);
          onBlur && onBlur(e);
        }}
      />
    </Box>
  );
};
