"use client";

import { apiClient } from "@repo/helpers";
import { ISinglePayload, SERVER_API } from "@repo/core";

interface SetPDeviceReq {
  sessionId: string;
}
interface SetPDeviceRes extends ISinglePayload<SetPDeviceReq> {
  deviceId: string;
}

export const SettingsService = () => {
  const setPrimaryDevice = async (
    targetSession: SetPDeviceReq,
  ): Promise<SetPDeviceRes> => {
    return await apiClient<SetPDeviceRes>(SERVER_API.setPrimarySession, {
      method: "PATCH",
      body: JSON.stringify(targetSession),
    });
  };

  return { setPrimaryDevice };
};
