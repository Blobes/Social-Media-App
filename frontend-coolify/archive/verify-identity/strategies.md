import {
  TransitPurpose,
  TransitPayloadMap,
  OtpTransitData,
  IUser,
  IdentifierType,
} from "@repo/core";
import { getOtpIdentifierType } from "@repo/helpers";

/**
 * Type-safe verification strategy handler function signature.
 */
export type StrategyHandler<P extends TransitPurpose> = (
  payload: TransitPayloadMap[P] | undefined,
  onSuccessCb?: () => void,
) => void;

/**
 * Complete map of strategy handlers for all transit purposes.
 */
export type VerificationStrategyMap = {
  [P in TransitPurpose]: StrategyHandler<P>;
};

interface StrategyDependencies {
  handleAuthOtpSuccess: (user?: IUser, cb?: () => void) => void;
  onUpdateSuccess: () => void;
  handlePassResetSuccess: (recipient?: string) => void;
  recipient?: string;
}

/**
 * Creates the verification strategy dictionary bound to hook context dependencies.
 */
export function createVerificationStrategies(
  deps: StrategyDependencies,
): VerificationStrategyMap {
  return {
    LOGIN_VERIFICATION: (payload, onSuccessCb) =>
      deps.handleAuthOtpSuccess(payload as IUser, onSuccessCb),
    SIGNUP_VERIFICATION: (payload, onSuccessCb) =>
      deps.handleAuthOtpSuccess(payload as IUser, onSuccessCb),
    PASSWORD_RESET: () => deps.handlePassResetSuccess(deps.recipient),
    ACCOUNT_UPDATE: () => deps.onUpdateSuccess(),
    IDENTIFIER_UPDATE: () => deps.onUpdateSuccess(),
    MFA_ACTIVATION: () => deps.handleAuthOtpSuccess(),
  };
}

/**
 * Safely executes the verification strategy corresponding to the active transit purpose.
 */
export function executeVerificationStrategy<P extends TransitPurpose>(
  activeTransit: OtpTransitData<P>,
  strategies: VerificationStrategyMap,
): void {
  const handler = strategies[activeTransit.purpose] as (
    payload: unknown,
    onSuccessCb?: () => void,
  ) => void;

  if (handler) {
    handler(activeTransit.payload, activeTransit.onVerificationSuccess);
  }
}

/**
 * Robust recipient resolver that guarantees fallback to activeTransit.identifier.
 */
export function resolveChannelRecipient<P extends TransitPurpose>(
  activeTransit: OtpTransitData<P> | undefined,
  identifierType: IdentifierType,
  currentRecipient?: string,
): string | undefined {
  if (!activeTransit) return currentRecipient;

  const fallbackIdentifier = activeTransit.identifier || currentRecipient;
  const payload = activeTransit.payload as
    | (IUser & { identifier?: string; email?: string; phoneNumber?: string })
    | undefined;

  const isPhone = identifierType === "PHONE_NUMBER";
  const fallbackType = getOtpIdentifierType(fallbackIdentifier || "");

  if (isPhone) {
    if (payload?.phoneNumber) return payload.phoneNumber;
    if (fallbackIdentifier && fallbackType === "PHONE_NUMBER")
      return fallbackIdentifier;
    return undefined;
  }

  // Handle EMAIL or fallback resolution
  return (
    payload?.email ||
    payload?.identifier ||
    (fallbackType !== "PHONE_NUMBER" ? fallbackIdentifier : undefined)
  );
}
