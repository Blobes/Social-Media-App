"use client";

import {
  saveToLocalStorage,
  getFromLocalStorage,
  removeFromLocalStorage,
} from "./storage";

export const AUTH_IDENTIFIER_KEY = "auth_identifier";
export const AUTH_PASSWORD_KEY = "auth_password";
export const AUTH_PASSWORD_EXPIRY_KEY = "auth_password_expiry";

const DEFAULT_PASSWORD_EXPIRY_DAYS = 7;

/**
 * Persists user identifier in local storage indefinitely.
 */
export const saveIdentifier = (identifier: string): void => {
  saveToLocalStorage(AUTH_IDENTIFIER_KEY, identifier);
};

/**
 * Retrieves persisted user identifier from local storage.
 */
export const getSavedIdentifier = (): string => {
  return (
    getFromLocalStorage<string>({
      key: AUTH_IDENTIFIER_KEY,
      fallback: "",
    }) || ""
  );
};

/**
 * Persists user password along with a time-based expiration timestamp.
 */
export const savePassword = (
  password: string,
  days: number = DEFAULT_PASSWORD_EXPIRY_DAYS,
): void => {
  const expiryTime = Date.now() + days * 24 * 60 * 60 * 1000;
  saveToLocalStorage(AUTH_PASSWORD_KEY, password);
  saveToLocalStorage(AUTH_PASSWORD_EXPIRY_KEY, expiryTime);
};

/**
 * Retrieves saved password if within valid time threshold, otherwise purges expired state.
 */
export const getSavedPassword = (): string => {
  const savedPassword = getFromLocalStorage<string>({
    key: AUTH_PASSWORD_KEY,
    fallback: "",
  });
  const expiry = getFromLocalStorage<number>({
    key: AUTH_PASSWORD_EXPIRY_KEY,
    fallback: 0,
  });

  if (!savedPassword || !expiry) return "";

  if (Date.now() > expiry) {
    clearSavedPassword();
    return "";
  }

  return savedPassword;
};

/**
 * Clears saved password and its expiration metadata.
 */
export const clearSavedPassword = (): void => {
  removeFromLocalStorage(AUTH_PASSWORD_KEY);
  removeFromLocalStorage(AUTH_PASSWORD_EXPIRY_KEY);
};

/**
 * Clears all saved authentication credentials from local storage.
 */
export const clearAllSavedAuth = (): void => {
  removeFromLocalStorage(AUTH_IDENTIFIER_KEY);
  clearSavedPassword();
};
