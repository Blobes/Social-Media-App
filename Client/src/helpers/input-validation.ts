import { InputValidation } from "@/types";

export function validateEmail(email: string): InputValidation {
  if (!email || email.trim().length === 0) {
    return { status: "invalid", message: "Email is required." };
  }
  const trimmed = email.trim();
  // Quick basic pattern
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!pattern.test(trimmed)) {
    return {
      status: "invalid",
      message: "Enter a valid email address (example: user@example.com).",
    };
  }

  const [local, domain] = trimmed.split("@");
  if (local.length > 64) {
    return {
      status: "invalid",
      message: "The part before '@' is too long. (example: user@example.com)",
    };
  }

  if (domain.length > 253) {
    return {
      status: "invalid",
      message: "The domain part is too long. (example: user@example.com)",
    };
  }

  if (domain.includes("..")) {
    return {
      status: "invalid",
      message:
        "The domain cannot contain more than 1 dot (.). (example: user@example.com)",
    };
  }

  return { status: "valid", message: "Valid email address." };
}

export function validatePassword(password: string): InputValidation {
  const input = password ?? "";

  if (input.length === 0) {
    return {
      status: "invalid",
      message: "Password is required. (example: Abcd1234#)",
    };
  }

  if (input.length < 8) {
    return {
      status: "invalid",
      message: `Password must be at least 8 characters long. (example: Abcd1234#)`,
    };
  }

  if (!/[a-z]/.test(input)) {
    return {
      status: "invalid",
      message: `Password must include at least one lowercase letter. (example: Abcd1234#)`,
    };
  }

  if (!/[A-Z]/.test(input)) {
    return {
      status: "invalid",
      message: `Password must include at least one uppercase letter. (example: Abcd1234#)`,
    };
  }

  if (!/[0-9]/.test(input)) {
    return {
      status: "invalid",
      message: `Password must include at least one number. (example: Abcd1234#)`,
    };
  }

  if (!/[^A-Za-z0-9]/.test(input)) {
    return {
      status: "invalid",
      message: `Password must include at least one special character (!@#$%^&*). (example: Abcd1234#)`,
    };
  }

  return {
    status: "valid",
    message: "Strong password.",
  };
}

interface Input {
  value: string;
  type: string;
}
export function validateInputs(inputs: Input[]): boolean {
  const statuses: string[] = [];

  let validity;
  inputs.forEach((input) => {
    switch (input.type) {
      case "email":
        validity = validateEmail(input.value);
        statuses.push(validity.status);

        break;
      case "password":
        validity = validatePassword(input.value);
        statuses.push(validity.status);
    }
  });

  return statuses.includes("invalid");
}
