import crypto from "crypto";

export const genVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashCode = (code: string) => {
  return crypto.createHash("sha256").update(code).digest("hex");
};
