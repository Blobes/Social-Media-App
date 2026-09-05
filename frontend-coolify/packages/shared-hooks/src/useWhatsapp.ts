"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AUTH_FEEDBACK, ISinglePayload, SERVER_API } from "@repo/core";
import { apiClient } from "@repo/helpers";
import { useStaticTranslation } from "./useTrans";

interface CheckStatusRequest {
  phoneNumber?: string;
}

export interface CheckStatusResponse {
  exists: boolean;
  phoneNumber: string;
  waId?: string;
}

/**
 * Sends request to verify WhatsApp registration status for a target phone number.
 */
const checkWhatsappStatus = async (
  phoneNumber: string,
): Promise<ISinglePayload<CheckStatusResponse>> => {
  return await apiClient(SERVER_API.checkWhatsappStatus, {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
};

/**
 * Manages WhatsApp status validation and user feedback states.
 */
export const useWhatsAppStatus = ({ phoneNumber }: CheckStatusRequest) => {
  const { translateTxtString } = useStaticTranslation();

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isWhatsappActive, setIsWhatsappActive] = useState<boolean>(false);

  /**
   * Executes validation call against API endpoint.
   */
  const { mutateAsync: executeStatusCheck, isPending: isCheckingWhatsapp } =
    useMutation({
      mutationFn: async (targetPhone: string) => {
        setStatusMsg(null);
        return await checkWhatsappStatus(targetPhone);
      },
      onSuccess: (response) => {
        if (response?.status === "ERROR") {
          setIsWhatsappActive(false);
          setStatusMsg(
            translateTxtString(AUTH_FEEDBACK.whatsapp_status_check_failed),
          );
          return;
        }

        const registered = Boolean(response?.payload?.exists);
        setIsWhatsappActive(registered);

        if (!registered) {
          setStatusMsg(
            translateTxtString(AUTH_FEEDBACK.whatsapp_not_registered),
          );
        }
      },
      onError: () => {
        setIsWhatsappActive(false);
        setStatusMsg(
          translateTxtString(AUTH_FEEDBACK.whatsapp_status_check_failed),
        );
      },
    });

  /**
   * Validates if WhatsApp is registered for the target phone number before execution.
   */
  const validateStatus = useCallback(
    async (overridePhone?: string): Promise<boolean> => {
      const activePhone = overridePhone || phoneNumber;
      if (!activePhone) {
        setStatusMsg(translateTxtString(AUTH_FEEDBACK.whatsapp_not_registered));
        return false;
      }

      try {
        const response = await executeStatusCheck(activePhone);
        return Boolean(
          response?.status !== "ERROR" && response?.payload?.exists,
        );
      } catch {
        return false;
      }
    },
    [phoneNumber, executeStatusCheck, translateTxtString],
  );

  return {
    isWhatsappActive,
    isCheckingWhatsapp,
    validateStatus,
    statusMsg,
    setStatusMsg,
  };
};
