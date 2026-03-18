import { IModeration } from "./types";

declare global {
  namespace Express {
    interface Request {
      moderation?: IModeration;
    }
  }
}
