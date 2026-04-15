import { QueueType } from "../types/ui-props";

export const QUEUE_KEYS = {
  [QueueType.POST]: {
    LIKE: "post_like",
    PENDING_LIKES: "pending_post_likes",
    POST_BOOKMARK: "pending_bookmarks",
  },
  [QueueType.USER]: {
    USER_FOLLOW: "pending_follows",
  },
};
