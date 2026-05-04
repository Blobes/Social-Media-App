import { Worker, Job } from "bullmq";
import {
  dispatchEmailCode,
  QueueService,
  OtpType,
  dispatchWhatsAppCode,
} from "@repo/shared";
import {
  codeDispatchTokens,
  FUNSTAKES_REDIS_URL,
  phoneDispatchTokens,
} from "@/envVars";

export const otpDispatchWorker = () => {
  const redisConnection = QueueService.getConnection(FUNSTAKES_REDIS_URL);

  const worker = new Worker(
    "otp-queue",
    async (job: Job) => {
      const { code, type } = job.data;
      const otpType: OtpType = type;
      const receiver = otpType === "EMAIL" ? job.data.email : job.data.phone;

      switch (otpType) {
        case "EMAIL":
          await dispatchEmailCode({ to: receiver, code }, codeDispatchTokens);
          break;
        case "WHATSAPP":
          await dispatchWhatsAppCode(
            { to: receiver, code },
            phoneDispatchTokens,
          );
      }
      console.log(`📧 OTP sent to ${receiver}`);
    },
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );

  // Listeners must be attached to the 'worker' instance
  worker.on("failed", (job, err) => {
    console.error(`❌ Email job ${job?.id} failed: ${err.message}`);
  });

  worker.on("completed", (job) => {
    console.log(`✅ Email job ${job.id} completed`);
  });

  return worker;
};
