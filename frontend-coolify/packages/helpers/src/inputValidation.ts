"use client";

import { InputType, InputValidation } from "@repo/core";

/**
 * Validates an email address based on general format, length of local/domain
 * parts, and common domain restrictions (e.g., no double dots).
 */
export function validateEmail(email: string): InputValidation {
  if (!email || email.trim().length === 0) {
    return { status: "INVALID", message: "Email is required." };
  }
  const trimmed = email.trim();
  // Quick basic pattern
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!pattern.test(trimmed)) {
    return {
      status: "INVALID",
      message: "Enter a valid email address (user@example.com).",
    };
  }

  const [local, domain] = trimmed.split("@");
  if (local.length > 64) {
    return {
      status: "INVALID",
      message: "The part before '@' is too long. (user@example.com)",
    };
  }

  if (domain.length > 253) {
    return {
      status: "INVALID",
      message: "The domain part is too long.",
    };
  }

  if (domain.includes("..")) {
    return {
      status: "INVALID",
      message:
        "The domain cannot contain more than 1 dot (.) (user@example.com)",
    };
  }

  return { status: "VALID", message: "Valid email address." };
}

/**
 * Validates a phone number:
 * 1. Checks if it contains only valid characters (digits, +, -, (, ), space)
 * 2. Ensures a minimum length (standard is ~10 digits globally for mobile)
 * 3. Normalizes briefly to check digit count
 */
export const validatePhone = (phone: string): InputValidation => {
  const input = phone ?? "";
  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return {
      status: "INVALID",
      message: "Phone number is required.",
    };
  }

  // Regex for allowed characters in a phone string
  const validChars = /^[\d\s\-+()]+$/;
  if (!validChars.test(trimmed)) {
    return {
      status: "INVALID",
      message: "Phone number contains invalid characters.",
    };
  }

  // Strip everything but numbers to check actual length
  const digitCount = trimmed.replace(/\D/g, "").length;

  if (digitCount < 10) {
    return {
      status: "INVALID",
      message: "Phone number is too short. (Minimum 10 digits)",
    };
  }

  if (digitCount > 15) {
    return {
      status: "INVALID",
      message: "Phone number is too long. (Maximum 15 digits)",
    };
  }

  return {
    status: "VALID",
    message: "Valid phone number format.",
  };
};

/**
 * Validates a password's strength:
 * Requires min 8 characters, at least one uppercase, one lowercase,
 * one number, and one special character.
 */
export const validatePassword = (password: string): InputValidation => {
  const input = password ?? "";

  if (input.length === 0) {
    return {
      status: "INVALID",
      message: "Password is required. (example: Abcd1234#)",
    };
  }

  if (input.length < 8) {
    return {
      id: "pass-detail-1",
      status: "INVALID",
      message: `Password must be at least 8 characters long. (example: Abcd1234#)`,
    };
  }

  if (!/[a-z]/.test(input)) {
    return {
      id: "pass-detail-2",
      status: "INVALID",
      message: `Password must include at least one lowercase letter. (example: Abcd1234#)`,
    };
  }

  if (!/[A-Z]/.test(input)) {
    return {
      id: "pas-sdetail-3",
      status: "INVALID",
      message: `Password must include at least one uppercase letter. (example: Abcd1234#)`,
    };
  }

  if (!/[0-9]/.test(input)) {
    return {
      id: "pass-detail-4",
      status: "INVALID",
      message: `Password must include at least one number. (example: Abcd1234#)`,
    };
  }

  if (!/[^A-Za-z0-9]/.test(input)) {
    return {
      id: "pass-detail-5",
      status: "INVALID",
      message: `Password must include at least one special character (!@#$%^&*). (example: Abcd1234#)`,
    };
  }

  return {
    status: "VALID",
    message: "Strong password.",
  };
};

/**
 * Validates a username based on strict rules:
 * 1. Must be 5-25 characters.
 * 2. Must start with a letter.
 * 3. Can contain letters, numbers, and underscores only.
 * 4. No spaces, hyphens, brackets, or other special characters.
 */
export const validateUsername = (username: string): InputValidation => {
  const value = username.trim();

  // Rule 3 (Length): 3 to 25 characters
  if (value.length < 3 || value.length > 25) {
    return {
      status: "INVALID",
      message: "Username must be between 3 and 25 characters.",
    };
  }
  // Rule 2: Must start with a letter
  const startsWithLetter = /^[a-zA-Z]/.test(value);
  if (!startsWithLetter) {
    return {
      status: "INVALID",
      message: "Username must start with a letter.",
    };
  }
  // Rule 1 & 3: Letters, numbers, underscores only. No spaces/hyphens/brackets.
  // ^[a-zA-Z] (starts with letter)
  // [a-zA-Z0-9_]* (followed by letters, numbers, or underscores only)
  // $ (end of string)
  const validPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!validPattern.test(value)) {
    return {
      status: "INVALID",
      message:
        "Only letters, numbers, and underscores are allowed as username.",
    };
  }

  return { status: "VALID", message: "Username format is valid." };
};

interface Input {
  value: string;
  type: InputType;
}
/**
 * Dynamically detects the input type (Email, Phone, or Username) based on
 * the string content and returns its specific validation status and message.
 */
export const getInputValidity = (input: string): InputValidation => {
  const value = input.trim();

  // Handle Empty State
  if (!value || value.length < 3) {
    return {
      type: "UNKNOWN",
      status: "INVALID",
      message: !value
        ? "Credential is required"
        : "Credential can't be less than 3 characters.",
    };
  }
  // 1. Detect and Validate EMAIL
  if (value.includes("@")) {
    return {
      ...validateEmail(value),
      type: "EMAIL",
    };
  }
  // 2. Detect and Validate PHONE
  const hasDigits = /\d/.test(value);
  const hasLetters = /[a-zA-Z]/.test(value);
  const isPhoneSymbolsOnly = /^[\d\s\-\(\)\+]+$/.test(value);
  if (hasDigits && !hasLetters && isPhoneSymbolsOnly) {
    return {
      ...validatePhone(value),
      type: "PHONE",
    };
  }

  // 3. Fallback to USERNAME (Requires an alphabet)
  return {
    ...validateUsername(value),
    type: "USERNAME",
  };
};

/**
 * Validates names based on length and content (cannot be numeric only).
 */
export const validateName = (name: string, label: string): InputValidation => {
  const value = name.trim();
  if (value.length < 2 || value.length > 40) {
    return {
      status: "INVALID",
      message: `${label} must be between 2 and 40 characters.`,
    };
  }
  if (/^\d+$/.test(value)) {
    return {
      status: "INVALID",
      message: `${label} cannot consist of numbers only.`,
    };
  }
  return { status: "VALID", message: "" };
};

/**
 * Bulk validation helper that iterates through an array of inputs and
 * returns true if any single input fails its respective validation type.
 */
export const validateInputs = (inputs: Input[]): boolean => {
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
