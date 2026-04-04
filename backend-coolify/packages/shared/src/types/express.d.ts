import { IModerationReq } from "./types";

declare global {
  namespace Express {
    interface Request {
      moderation?: IModerationReq;
    }
  }
}
