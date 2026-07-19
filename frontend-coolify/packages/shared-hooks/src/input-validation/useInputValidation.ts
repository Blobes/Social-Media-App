"use client";

import {
  COMMON_INPUT_VALIDATION,
  InputType,
  InputValidation,
} from "@repo/core";
import { useStaticTranslation } from "../useTrans";

interface Input {
  value: string;
  type: InputType;
}

/**
 * Validates text inputs, credentials, and password compliance across multiple supported international locales.
 */
export const useInputValidation = () => {
  const { translateTxtString } = useStaticTranslation();

  /**
   * Validates an email address based on general format, length of local/domain
   * parts, and common domain restrictions (e.g., no double dots).
   */
  const validateEmail = (email: string): InputValidation => {
    if (!email || email.trim().length === 0) {
      return {
        status: "INVALID",
        message: translateTxtString(COMMON_INPUT_VALIDATION.email_required),
      };
    }
    const trimmed = email.trim();
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!pattern.test(trimmed)) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.email_invalid_format,
        ),
      };
    }
    const [local, domain] = trimmed.split("@");
    if (local!.length > 64) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.email_local_too_long,
        ),
      };
    }

    if (domain!.length > 253) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.email_domain_too_long,
        ),
      };
    }

    if (domain!.includes("..")) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.email_domain_double_dot,
        ),
      };
    }

    return {
      status: "VALID",
      message: translateTxtString(COMMON_INPUT_VALIDATION.email_valid),
    };
  };

  /**
   * Validates a phone number:
   * 1. Checks if it contains only valid characters (digits, +, -, (, ), space) across script formats
   * 2. Ensures a minimum length (standard is ~10 digits globally for mobile)
   * 3. Normalizes briefly to check digit count
   */
  const validatePhone = (phone: string): InputValidation => {
    const input = phone ?? "";
    const trimmed = input.trim();

    if (trimmed.length === 0) {
      return {
        status: "INVALID",
        message: translateTxtString(COMMON_INPUT_VALIDATION.phone_required),
      };
    }

    const validChars = /^[\p{Number}\s\-+()]+$/u;
    if (!validChars.test(trimmed)) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.phone_invalid_chars,
        ),
      };
    }

    const normalizedDigits = trimmed.replace(/[^\p{Number}]/gu, "");
    const digitCount = normalizedDigits.length;

    if (digitCount < 10) {
      return {
        status: "INVALID",
        message: translateTxtString(COMMON_INPUT_VALIDATION.phone_too_short),
      };
    }

    if (digitCount > 15) {
      return {
        status: "INVALID",
        message: translateTxtString(COMMON_INPUT_VALIDATION.phone_too_long),
      };
    }

    return {
      status: "VALID",
      message: translateTxtString(COMMON_INPUT_VALIDATION.phone_valid),
    };
  };

  /**
   * Validates a password's strength checking case, digits, and special characters globally.
   * Utilizes safe lookahead validations to accurately parse Latin and non-Latin character variations.
   */
  const validatePassword = (password: string): InputValidation => {
    const input = password ?? "";

    if (input.length === 0) {
      return {
        status: "INVALID",
        message: translateTxtString(COMMON_INPUT_VALIDATION.password_required),
      };
    }

    if (input.length < 8) {
      return {
        id: "pass-detail-1",
        status: "INVALID",
        message: translateTxtString(COMMON_INPUT_VALIDATION.password_too_short),
      };
    }

    // 1. Enforce that the password contains at least one valid global letter variant (\p{Letter})
    const hasAnyLetter = /\p{Letter}/u.test(input);
    if (!hasAnyLetter) {
      return {
        id: "pass-detail-2",
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.password_missing_lowercase,
        ),
      };
    }

    // 2. Conditionally evaluate casing rules ONLY if the user typed characters from a script that utilizes case variations
    const containsCasedScript = /\p{Cased_Letter}/u.test(input);
    if (containsCasedScript) {
      if (!/\p{Lowercase_Letter}/u.test(input)) {
        return {
          id: "pass-detail-2",
          status: "INVALID",
          message: translateTxtString(
            COMMON_INPUT_VALIDATION.password_missing_lowercase,
          ),
        };
      }

      if (!/\p{Uppercase_Letter}/u.test(input)) {
        return {
          id: "pas-sdetail-3",
          status: "INVALID",
          message: translateTxtString(
            COMMON_INPUT_VALIDATION.password_missing_uppercase,
          ),
        };
      }
    }

    // 3. Verify presence of numerical elements, validating both Latin digits (0-9) and localized variants
    const hasNumber = /\p{Number}/u.test(input);
    if (!hasNumber) {
      return {
        id: "pass-detail-4",
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.password_missing_number,
        ),
      };
    }

    // 4. Ensure presence of a dedicated special character by validating explicitly against punctuation and symbol property blocks
    const hasSpecialChar = /[\p{Punctuation}\p{Symbol}]/u.test(input);
    if (!hasSpecialChar) {
      return {
        id: "pass-detail-5",
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.password_missing_special,
        ),
      };
    }

    return {
      status: "VALID",
      message: translateTxtString(COMMON_INPUT_VALIDATION.password_strong),
    };
  };

  /**
   * Validates a username based on global script rules:
   * 1. Must be 3-25 characters.
   * 2. Must start with a localized letter.
   * 3. Can contain letters, numbers, and underscores only.
   * 4. No spaces, hyphens, brackets, or other special characters.
   */
  const validateUsername = (username: string): InputValidation => {
    const value = username.trim();

    if (value.length < 3 || value.length > 25) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.username_length_error,
        ),
      };
    }

    const startsWithLetter = /^\p{Letter}/u.test(value);
    if (!startsWithLetter) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.username_start_letter_error,
        ),
      };
    }

    const validPattern = /^[\p{Letter}][\p{Letter}\p{Number}_]*$/u;
    if (!validPattern.test(value)) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.username_invalid_chars,
        ),
      };
    }

    return {
      status: "VALID",
      message: translateTxtString(COMMON_INPUT_VALIDATION.username_valid),
    };
  };

  /**
   * Dynamically detects the input type (Email, Phone, or Username) based on
   * the string content and returns its specific validation status and message.
   */
  const getInputValidity = (input: string): InputValidation => {
    const value = input.trim();

    if (!value || value.length < 3) {
      return {
        type: "UNKNOWN",
        status: "INVALID",
        message: !value
          ? translateTxtString(COMMON_INPUT_VALIDATION.credential_required)
          : translateTxtString(COMMON_INPUT_VALIDATION.credential_too_short),
      };
    }

    if (value.includes("@")) {
      return {
        ...validateEmail(value),
        type: "EMAIL",
      };
    }

    const hasDigits = /\p{Number}/u.test(value);
    const hasLetters = /\p{Letter}/u.test(value);
    const isPhoneSymbolsOnly = /^[\p{Number}\s\-\(\)\+]+$/u.test(value);

    if (hasDigits && !hasLetters && isPhoneSymbolsOnly) {
      return {
        ...validatePhone(value),
        type: "PHONE",
      };
    }

    return {
      ...validateUsername(value),
      type: "USERNAME",
    };
  };

  /**
   * Validates names based on length and content (cannot be numeric only).
   */
  const validateName = (name: string, label: string): InputValidation => {
    const value = name.trim();
    if (value.length < 2 || value.length > 40) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.name_length_error(label),
        ),
      };
    }

    if (/^\p{Number}+$/u.test(value)) {
      return {
        status: "INVALID",
        message: translateTxtString(
          COMMON_INPUT_VALIDATION.name_numeric_only_error(label),
        ),
      };
    }
    return { status: "VALID", message: "" };
  };

  /**
   * Bulk validation helper that iterates through an array of inputs and
   * returns true if any single input fails its respective validation type.
   */
  const validateInputs = (inputs: Input[]): boolean => {
    const valResults: InputValidation[] = [];

    inputs.forEach((input) => {
      let result: InputValidation;

      switch (input.type) {
        case "EMAIL":
          result = validateEmail(input.value);
          break;
        case "PASSWORD":
          result = validatePassword(input.value);
          break;
        case "PHONE":
          result = validatePhone(input.value);
          break;
        case "USERNAME":
          result = validateUsername(input.value);
          break;
        case "NAME":
          result = validateName(input.value, "Field");
          break;
        default:
          result = { status: "VALID", message: "" };
      }
      valResults.push({ type: input.type, ...result });
    });

    return valResults.some((res) => res.status === "INVALID");
  };

  return {
    validateEmail,
    validatePhone,
    validateInputs,
    validateName,
    validatePassword,
    validateUsername,
    getInputValidity,
  };
};
