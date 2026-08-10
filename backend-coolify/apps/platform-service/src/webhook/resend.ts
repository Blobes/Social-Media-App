import { Response, NextFunction } from "express";
import { Webhook } from "svix";
import { forwardError, IAuthRequest, MESSAGES_REGISTRY } from "@repo/shared";
import { RESEND_WEBHOOK_SECRET } from "@/envVars";

/**
 * Payload contract matching Resend webhook events dispatch via Svix.
 */
interface ResendWebhookEvent {
  type:
    | "email.sent"
    | "email.delivered"
    | "email.delivery_delayed"
    | "email.complained"
    | "email.bounced"
    | "email.opened"
    | "email.clicked";
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    tags?: Record<string, string>;
    bounce?: {
      message: string;
      type: string;
    };
  };
}

/**
 * Handles incoming Resend webhook events with Svix signature validation.
 */
export const TrackResendEmail = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!RESEND_WEBHOOK_SECRET) {
    console.error("RESEND_WEBHOOK_SECRET missing in server environment");
    res.status(500).json({
      status: "ERROR",
      message: "Webhook secret configuration missing",
      payload: null,
    });
    return;
  }

  const svixId = req.headers["svix-id"] as string | undefined;
  const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
  const svixSignature = req.headers["svix-signature"] as string | undefined;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({
      status: "ERROR",
      message: "Missing Svix headers required for verification",
      payload: null,
    });
    return;
  }

  const wh = new Webhook(RESEND_WEBHOOK_SECRET);
  let event: ResendWebhookEvent;

  try {
    // Parse raw request payload buffer for signature validation
    const rawPayload = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : typeof req.body === "string"
        ? req.body
        : JSON.stringify(req.body);

    event = wh.verify(rawPayload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ResendWebhookEvent;
  } catch (error: unknown) {
    console.error("Svix signature validation failed:", error);

    res.status(400).json({
      status: "ERROR",
      message: "Invalid webhook signature",
      payload: null,
    });
    return;
  }

  try {
    // Process delivery status transitions from Resend
    const { type, data } = event;

    switch (type) {
      case "email.delivered":
        console.log(
          `Email delivered successfully: ${data.email_id} to ${data.to.join(", ")}`,
        );
        break;

      case "email.bounced":
        console.warn(
          `Email bounced: ${data.email_id} to ${data.to.join(", ")}`,
        );
        console.warn(
          `Bounce reason: ${data.bounce?.message || "Unknown reason"}`,
        );
        break;

      case "email.complained":
        console.warn(
          `Spam complaint reported: ${data.email_id} by ${data.to.join(", ")}`,
        );
        break;

      default:
        console.log(`Unhandled Resend event received: ${type}`);
    }

    res.status(200).json({
      status: "SUCCESS",
      message: "Webhook event processed successfully",
      payload: null,
    });
  } catch (error: unknown) {
    console.error("Error handling Resend webhook payload:", error);

    forwardError(
      next,
      MESSAGES_REGISTRY.UPLOAD.LOCALIZATION_UPLOAD_THROWN_ERROR,
      error,
    );
  }
};
