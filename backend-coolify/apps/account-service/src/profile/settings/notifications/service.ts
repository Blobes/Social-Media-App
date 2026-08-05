import { UserSettingsModel } from "@repo/database";
import { UserSettingsResult, MESSAGES_REGISTRY } from "@repo/shared";
import { ClientSession } from "mongoose";

export interface NotificationSettingsInput {
  userId: string;
  push?: {
    enabled?: boolean;
    likes?: boolean;
    comments?: boolean;
    mentions?: boolean;
    newFollowers?: boolean;
    directMessages?: boolean;
    systemAnnouncements?: boolean;
  };
  email?: {
    enabled?: boolean;
    digest?: boolean;
    directMessages?: boolean;
    securityAlerts?: boolean;
  };
  quietMode?: {
    isEnabled?: boolean;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
  };
  session?: ClientSession;
}

/**
 * Updates push, email, and quiet mode notification preferences.
 */
export const executeUpdateNotificationSettings = async (
  input: NotificationSettingsInput,
): Promise<UserSettingsResult> => {
  const { userId, push, email, quietMode, session } = input;

  if (!userId) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.PROFILE.UNAUTHENTICATED_PREFERENCE_UPDATE,
    };
  }

  const updateOps: Record<string, unknown> = {};

  if (push) {
    if (typeof push.enabled === "boolean")
      updateOps["notifications.push.enabled"] = push.enabled;
    if (typeof push.likes === "boolean")
      updateOps["notifications.push.likes"] = push.likes;
    if (typeof push.comments === "boolean")
      updateOps["notifications.push.comments"] = push.comments;
    if (typeof push.mentions === "boolean")
      updateOps["notifications.push.mentions"] = push.mentions;
    if (typeof push.newFollowers === "boolean")
      updateOps["notifications.push.newFollowers"] = push.newFollowers;
    if (typeof push.directMessages === "boolean")
      updateOps["notifications.push.directMessages"] = push.directMessages;
    if (typeof push.systemAnnouncements === "boolean")
      updateOps["notifications.push.systemAnnouncements"] =
        push.systemAnnouncements;
  }

  if (email) {
    if (typeof email.enabled === "boolean")
      updateOps["notifications.email.enabled"] = email.enabled;
    if (typeof email.digest === "boolean")
      updateOps["notifications.email.digest"] = email.digest;
    if (typeof email.directMessages === "boolean")
      updateOps["notifications.email.directMessages"] = email.directMessages;
    if (typeof email.securityAlerts === "boolean")
      updateOps["notifications.email.securityAlerts"] = email.securityAlerts;
  }

  if (quietMode) {
    if (typeof quietMode.isEnabled === "boolean")
      updateOps["notifications.quietMode.isEnabled"] = quietMode.isEnabled;
    if (quietMode.startTime)
      updateOps["notifications.quietMode.startTime"] = quietMode.startTime;
    if (quietMode.endTime)
      updateOps["notifications.quietMode.endTime"] = quietMode.endTime;
    if (quietMode.timeZone)
      updateOps["notifications.quietMode.timeZone"] = quietMode.timeZone;
  }

  if (Object.keys(updateOps).length === 0) {
    return {
      status: "INVALID_INPUT",
      transInfo: MESSAGES_REGISTRY.SETTINGS.NO_UPDATE_FIELDS_PROVIDED,
    };
  }

  const updatedSettings = await UserSettingsModel.findOneAndUpdate(
    { userId },
    { $set: updateOps },
    { new: true, upsert: true, runValidators: true, session },
  )
    .select("notifications")
    .lean();

  return {
    status: "SUCCESS",
    transInfo: MESSAGES_REGISTRY.SETTINGS.UPDATED_SUCCESSFULLY,
    payload: { notifications: updatedSettings?.notifications },
  };
};
