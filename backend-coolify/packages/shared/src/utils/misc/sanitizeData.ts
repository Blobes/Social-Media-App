export const userSensitiveFields = (): string[] => {
  return [
    "password",
    "verificationCode",
    "verificationExpiry",
    "lastEmailCodeSentAt",
    "isDeactivated",
    "deactivatedAt",
    "role",
    "__v",
  ];
};

export const userPrivateFields = (): string[] => {
  return [
    "email",
    "phoneNumber",
    "onboardingStep",
    "dateOfBirth",
    "pendingEmail",
    "lastEmailChangeAt",
    "isEmailVerified",
    "isPhoneVerified",
    "accountStatus",
    "location", // Optional: hide if you want to keep exact location private
  ];
};
