"use client";

import { InputType, InputValidation } from "@repo/types";

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

export function validatePassword(password: string): InputValidation {
  const input = password ?? "";

  if (input.length === 0) {
    return {
      status: "INVALID",
      message: "Password is required. (example: Abcd1234#)",
    };
  }

  if (input.length < 8) {
    return {
      status: "INVALID",
      message: `Password must be at least 8 characters long. (example: Abcd1234#)`,
    };
  }

  if (!/[a-z]/.test(input)) {
    return {
      status: "INVALID",
      message: `Password must include at least one lowercase letter. (example: Abcd1234#)`,
    };
  }

  if (!/[A-Z]/.test(input)) {
    return {
      status: "INVALID",
      message: `Password must include at least one uppercase letter. (example: Abcd1234#)`,
    };
  }

  if (!/[0-9]/.test(input)) {
    return {
      status: "INVALID",
      message: `Password must include at least one number. (example: Abcd1234#)`,
    };
  }

  if (!/[^A-Za-z0-9]/.test(input)) {
    return {
      status: "INVALID",
      message: `Password must include at least one special character (!@#$%^&*). (example: Abcd1234#)`,
    };
  }

  return {
    status: "VALID",
    message: "Strong password.",
  };
}

interface Input {
  value: string;
  type: InputType;
}
export function validateInputs(inputs: Input[]): boolean {
  const valResults: InputValidation[] = [];

  let result;
  inputs.forEach((input) => {
    switch (input.type) {
      case "EMAIL":
        result = validateEmail(input.value);
        valResults.push({
          type: "EMAIL",
          ...result,
        });

        break;
      case "PASSWORD":
        result = validatePassword(input.value);
        valResults.push({
          type: "PASSWORD",
          ...result,
        });
    }
  });

  return valResults.some((res) => res.status.includes("INVALID"));
}

export const getInputValidity = (input: string): InputValidation => {
  const value = input.trim();

  // Handle Empty State
  if (!value) {
    return {
      type: "USERNAME",
      status: "INVALID",
      message: "Please enter your credentials.",
    };
  }

  // 1. Check for NUMBER
  // Purely numeric input (no special characters or letters)
  const isPureNumber = /^\d+$/.test(value);
  if (isPureNumber && value.length < 7) {
    return {
      type: "NUMBER",
      status: "VALID",
      message: "Detected numeric input.",
    };
  }

  // 2. Check for EMAIL
  // If it contains '@', prioritize email logic
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (value.includes("@")) {
    const isValid = emailRegex.test(value);
    return {
      type: "EMAIL",
      status: isValid ? "VALID" : "INVALID",
      message: isValid
        ? "Email format is valid."
        : "Please enter a valid email address.",
    };
  }

  // 3. Check for PHONE
  // Detects if it starts with '+' or contains phone-like characters
  const hasPhoneChars = /^[\d\s\-+()]+$/.test(value);
  const startsWithPhoneMarker = value.startsWith("+") || /^\d/.test(value);

  if (hasPhoneChars && startsWithPhoneMarker && value.length >= 7) {
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    const isValid = phoneRegex.test(value);
    return {
      type: "PHONE",
      status: isValid ? "VALID" : "INVALID",
      message: isValid
        ? "Phone number format is valid."
        : "Invalid phone number format.",
    };
  }

  // 4. Fallback to USERNAME
  // If it doesn't match the specific patterns above, it is treated as a username
  return {
    type: "USERNAME",
    status: value.length >= 3 ? "VALID" : "INVALID",
    message:
      value.length >= 3
        ? "Username format is valid."
        : "Username must be at least 3 characters.",
  };
};
