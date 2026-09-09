"use client";

import React, { useRef } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Stack,
} from "@mui/material";
import { ChevronDown, CircleQuestionMark, X } from "lucide-react";
import { ListType, MenuRef, useGlobalStore, IMenuItem } from "@repo/core";
import { DisplayList } from "../Menu";
import { BasicTooltip } from "../Tooltips";
import { InputEventHandlers, InputProps, styleConfig } from "./Dynamic";

export interface SelectOption extends IMenuItem {
  value: string | number;
  [key: string]: unknown;
}

export interface SelectInputProps extends InputProps, InputEventHandlers {
  options: SelectOption[];
  selectedValue?: string | number;
  onSelectChange?: (option: SelectOption) => void;
  listName?: ListType;
  showSearchBar?: boolean;
  isLoading?: boolean;
}

/**
 * Dropdown select component integrated with DisplayList overlay menus.
 */
export const SelectInput = ({
  variant = "outlined",
  id = "",
  value,
  selectedValue,
  placeholder = "Select an option...",
  label,
  helperText = "",
  tooltipGuide,
  allowReset = true,
  required = false,
  disabled = false,
  error = false,
  options = [],
  listName = ListType.DEFAULT,
  showSearchBar = false,
  isLoading = false,
  onSelectChange,
  onClear,
  onFocus,
  onBlur,
  style,
}: SelectInputProps) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<MenuRef>(null);
  const currLang = useGlobalStore((state) => state.currentLanguage);

  const activeValue = selectedValue ?? value;

  const selectedOption = options.find(
    (opt) => opt.value === activeValue || opt.id === activeValue,
  );

  const displayLabel =
    selectedOption?.title || (typeof value === "string" ? value : "");

  /**
   * Triggers the DisplayList menu overlay anchored to the input component.
   */
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;
    if (inputRef.current) {
      menuRef.current?.openMenu(inputRef.current);
    } else {
      menuRef.current?.openMenu(event.currentTarget);
    }
  };

  /**
   * Resets selected state and triggers clear handler.
   */
  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
  };

  const showResetIcon = allowReset && Boolean(displayLabel);
  const showTooltip = tooltipGuide && !displayLabel;

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <TextField
        inputRef={inputRef}
        variant={variant}
        id={id}
        value={displayLabel}
        placeholder={placeholder}
        label={label}
        helperText={helperText}
        required={required}
        disabled={disabled}
        error={error}
        size="small"
        fullWidth
        onClick={handleOpenMenu}
        slotProps={{
          htmlInput: {
            readOnly: true,
            style: { cursor: disabled ? "not-allowed" : "pointer" },
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Stack
                  flexDirection="row"
                  alignItems="center"
                  gap={theme.gap?.(1) || 0.5}
                >
                  {/* Tooltip Guide */}
                  {showTooltip && (
                    <BasicTooltip title={tooltipGuide}>
                      <Box
                        sx={{
                          display: "flex",
                          cursor: "pointer",
                          borderRadius: theme.radius.full,
                          alignSelf: "center",
                          flex: "none",
                          padding: theme.boxSpacing(1),
                          "&:hover": {
                            backgroundColor: theme.palette.gray.trans[1],
                          },
                        }}
                      >
                        <CircleQuestionMark size={18} />
                      </Box>
                    </BasicTooltip>
                  )}

                  {/* Clear selection */}
                  {showResetIcon && (
                    <IconButton size="small" onClick={handleClearSelection}>
                      <X size={18} />
                    </IconButton>
                  )}

                  {/* Dropdown Indicator Icon */}
                  <IconButton
                    size="small"
                    aria-label="open options list"
                    sx={{
                      pointerEvents: "none",
                      color: theme.palette.gray[300],
                    }}
                  >
                    <ChevronDown size={18} />
                  </IconButton>
                </Stack>
              </InputAdornment>
            ),
          },
        }}
        sx={{
          cursor: disabled ? "not-allowed" : "pointer",
          ...styleConfig({ theme, style, value: displayLabel, currLang }),
          ...style,
        }}
        onFocus={(e) => {
          onFocus && onFocus(e);
        }}
        onBlur={(e) => {
          onBlur && onBlur(e);
        }}
      />

      <DisplayList<SelectOption>
        menuRef={menuRef}
        list={options}
        listName={listName}
        showSearchBar={showSearchBar}
        isLoading={isLoading}
        activeItem={displayLabel}
        showActiveItem
        stickToScreen={false}
        heightThreshold={65}
        style={{
          item: {
            padding: theme.boxSpacing(4, 6),
            borderRadius: theme.radius[1] || 0,
          },
          container: {
            width: inputRef.current ? inputRef.current.clientWidth : "100%",
          },
        }}
        onItemClick={(item) => {
          if (onSelectChange && item) {
            onSelectChange(item);
          }
        }}
      />
    </Box>
  );
};
