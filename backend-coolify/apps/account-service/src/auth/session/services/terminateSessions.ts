import {
  cleanDeviceSessions,
  removeSession,
  MESSAGES_REGISTRY,
  TransInfo,
} from "@repo/shared";

interface ILogoutInput {
  userId: string;
  currentSessionId?: string;
  jwtDeviceId?: string;
  targetDeviceId?: string;
  logoutAll?: boolean;
}

interface ILogoutResult {
  status: "SUCCESS";
  transInfo?: TransInfo;
  shouldClearCookies: boolean;
}

/**
 * Executes the core session termination business rules.
 */
export const terminateUserSessions = async (
  input: ILogoutInput,
): Promise<ILogoutResult> => {
  const { userId, currentSessionId, jwtDeviceId, targetDeviceId, logoutAll } =
    input;

  if (logoutAll) {
    await cleanDeviceSessions(userId, undefined, { clearAll: true });
  } else if (targetDeviceId) {
    await cleanDeviceSessions(userId, targetDeviceId);
  } else if (currentSessionId) {
    await removeSession(userId, currentSessionId);
  }

  const isCurrentDeviceTargeted = targetDeviceId === jwtDeviceId;
  const shouldClearCookies =
    logoutAll || isCurrentDeviceTargeted || !targetDeviceId;

  const targetRegistry = logoutAll
    ? MESSAGES_REGISTRY.AUTH.LOGGED_OUT_OF_ALL_DEVICES_SUCCESSFULLY
    : MESSAGES_REGISTRY.AUTH.DEVICE_SESSION_TERMINATED;

  return {
    status: "SUCCESS",
    transInfo: targetRegistry,
    shouldClearCookies,
  };
};
