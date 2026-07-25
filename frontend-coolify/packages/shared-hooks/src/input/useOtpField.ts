"use client";

import {
  useState,
  useRef,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
} from "react";

export interface UseOtpOptions {
  length?: number;
  autoSubmit?: boolean;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
}

/**
 * Manages state, focused cell movement, keyboard navigation, and paste distribution for segmented OTP inputs.
 */
export const useOtpFieldValidation = ({
  length = 6,
  autoSubmit = true,
  onChange,
  onComplete,
}: UseOtpOptions = {}) => {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /**
   * Derive complete code string from digits array.
   */
  const getCode = useCallback((arr: string[]) => arr.join(""), []);

  /**
   * Focus the input at the given index, clamped to valid range.
   */
  const focusIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[clamped]?.focus();
    },
    [length],
  );

  /**
   * Handle single character entry, SMS auto-fill strings, and advance focus.
   */
  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const cleaned = rawValue.replace(/\D/g, "");

      if (!cleaned) {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
        onChange?.(getCode(next));
        return;
      }

      if (cleaned.length > 1) {
        const pastedDigits = cleaned.slice(0, length);
        const next = [...digits];

        for (let i = 0; i < pastedDigits.length; i++) {
          next[i] = pastedDigits[i];
        }

        setDigits(next);
        const code = getCode(next);
        onChange?.(code);

        focusIndex(Math.min(pastedDigits.length, length - 1));

        if (autoSubmit && next.every((d) => d !== "")) {
          onComplete?.(code);
        }
        return;
      }

      const char = cleaned.slice(-1);
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
    [digits, length, autoSubmit, onChange, onComplete, focusIndex, getCode],
  );

  /**
   * Handle backspace, arrow navigation, and delete.
   */
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
    [digits, onChange, focusIndex, getCode],
  );

  /**
   * Distribute pasted digits across cells starting from the focused index.
   */
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
    [digits, length, autoSubmit, onChange, onComplete, focusIndex, getCode],
  );

  /**
   * Select existing digit on focus for instant overwrite.
   */
  const handleFocus = useCallback((index: number) => {
    inputRefs.current[index]?.select();
  }, []);

  /**
   * Clears all OTP input fields and resets focus to the initial cell.
   */
  const resetOtp = useCallback(() => {
    const emptyDigits = Array(length).fill("");
    setDigits(emptyDigits);
    onChange?.("");
    focusIndex(0);
  }, [length, onChange, focusIndex]);

  return {
    digits,
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleFocus,
    resetOtp,
  };
};
