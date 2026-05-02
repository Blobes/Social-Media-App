import { IUserDocument } from "@repo/database";

/**
 * The duration a device is considered 'trusted' before requiring a new OTP check.
 */
const INACTIVE_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

/**
 * Internal helper to check if a device's trust has expired.
 */
const validateStaleTrust = (
  lastVerifiedAt: Date | null | undefined,
): { status: "TRUSTED" | "REQUIRES_OTP" } => {
  if (!lastVerifiedAt) return { status: "REQUIRES_OTP" };

  const isStale =
    new Date().getTime() - new Date(lastVerifiedAt).getTime() >
    INACTIVE_THRESHOLD_MS;
  return isStale ? { status: "REQUIRES_OTP" } : { status: "TRUSTED" };
};

/**
 * Holistic Device Verification
 * Checks the primary anchor, the trusted registry, and stale trust windows.
 * Used by pre-auth controllers (like checkEmail) to signal the frontend.
 */
export const requireVerification = async (
  user: IUserDocument,
  currentDeviceId: string,
): Promise<boolean> => {
  // If the device ID is missing or unknown, we must force verification.
  if (!currentDeviceId || currentDeviceId === "unknown") return true;

  // 1. FRESH ACCOUNT: No primary device established yet.
  if (!user.primaryDeviceId) {
    return true; // Returns true because it acts as a NEW_DEVICE state
  }

  // 2. PRIMARY MATCH: This is the main anchor hardware.
  if (user.primaryDeviceId === currentDeviceId) {
    const trust = validateStaleTrust(user.updatedAt);
    return trust.status === "REQUIRES_OTP";
  }

  // 3. REGISTRY CHECK: Is this a known secondary device (e.g., a tablet)?
  const knownDevice = user.trustedDevices?.find(
    (d: any) => d.deviceId === currentDeviceId,
  );

  if (knownDevice) {
    const trust = validateStaleTrust(knownDevice.lastVerifiedAt);
    return trust.status === "REQUIRES_OTP";
  }

  // 4. STRANGER DANGER: Device ID is not primary and not in the trusted list.
  return true;
};

/**
 * Promotes a device to the Trusted Registry after successful authentication or OTP.
 * This updates the database heartbeat to maintain the 15-day sliding window.
 */
export const finalizeDeviceTrust = async (
  user: any,
  deviceId: string,
): Promise<void> => {
  if (!deviceId || deviceId === "unknown") return;

  const existingIndex = user.trustedDevices.findIndex(
    (d: any) => d.deviceId === deviceId,
  );

  if (existingIndex > -1) {
    // Update timestamp on existing trusted device
    user.trustedDevices[existingIndex].lastVerifiedAt = new Date();
  } else {
    // If it's not the primary device, register it as a new secondary trusted device
    if (user.primaryDeviceId && user.primaryDeviceId !== deviceId) {
      user.trustedDevices.push({
        deviceId,
        lastVerifiedAt: new Date(),
        name: "Secondary Device",
      });
    }
  }

  // If for some reason primary was missing (edge case or first login), set it
  if (!user.primaryDeviceId) {
    user.primaryDeviceId = deviceId;
  }

  // Update the document's updatedAt to sync the Primary Device heartbeat
  user.updatedAt = new Date();

  await user.save();
};
