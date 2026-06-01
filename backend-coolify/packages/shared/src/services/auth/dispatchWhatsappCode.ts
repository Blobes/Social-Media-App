import { IPhoneDispatchTokens } from "../../types";

interface WhatsAppPayload {
  to: string;
  code: string;
}

export const dispatchWhatsAppCode = async (
  { to, code }: WhatsAppPayload,
  dispatchConfig: IPhoneDispatchTokens,
): Promise<void> => {
  const WHATSAPP_TOKEN = dispatchConfig.WHATSAPP_ACCESS_KEY;
  const PHONE_NUMBER_ID = dispatchConfig.WHATSAPP_PHONE_NUMBER_ID;
  const VERSION = "v18.0";

  // Meta requires digits only, no '+' prefix
  const recipient = to.replace(/\+/g, "");

  try {
    const response = await fetch(
      `https://graph.facebook.com/${VERSION}/${PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "template",
          template: {
            name: "account_creation", // Ensure this name matches your Meta dashboard exactly
            language: {
              code: "en_US",
            },
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text: code,
                  },
                ],
              },
              {
                type: "button",
                sub_type: "url",
                index: 0,
                parameters: [
                  {
                    type: "text",
                    text: code,
                  },
                ],
              },
            ],
          },
        }),
      },
    );

    type WhatsAppApiResponse = {
      error?: {
        message?: string;
        type?: string;
        code?: number;
        error_subcode?: number;
        fbtrace_id?: string;
      };
    } & Record<string, unknown>;

    const data = (await response.json()) as WhatsAppApiResponse;

    if (!response.ok) {
      console.error("WhatsApp API Error Details:", data);
      throw new Error(data.error?.message || "Failed to send WhatsApp code");
    }

    console.log("WhatsApp OTP sent successfully:", data);
  } catch (error: any) {
    console.error("WhatsApp Dispatch Error:", error.message);
    throw new Error("Internal communication error with WhatsApp service.");
  }
};
