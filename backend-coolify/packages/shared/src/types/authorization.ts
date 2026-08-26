import {
  PermissionName,
  PostModelType,
  PostVisibility,
  RoleName,
  SubscriptionStatus,
  SubscriptionTier,
} from "@repo/database";

// Authorization & Resource
export interface AuthorizationContext {
  userId: string;
  email?: string;
  roles: RoleName[];
  permissions?: Set<PermissionName>;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  isPremium?: boolean;
  [key: string]: any;
}

export interface IBaseResource {
  isDeleted?: boolean;
  isArchived?: boolean;
  isSuspended?: boolean;
  requiredTier?: SubscriptionTier;
}

export interface IPostResource extends IBaseResource {
  type: "POST";
  postId: string;
  authorId: string;
  isPrivate: boolean;
}

/**
 * Normalizes state flags for Gist entities.
 */
export interface IGistResource extends IBaseResource {
  type: "GIST";
  gistId: string;
  authorId: string;
  visibility: PostVisibility;
}

/**
 * Normalizes state flags for Stake entities.
 */
export interface IStakeResource extends IBaseResource {
  type: "STAKE";
  stakeId: string;
  authorId: string;
  parentPostId?: string;
  parentPostType?: PostModelType;
  visibility: PostVisibility;
}

/**
 * Policy definition for resources requiring explicit resource ownership.
 */
export interface IOwnerResource extends IBaseResource {
  type: string;
  targetUserId: string;
}

export interface ICommentResource extends IBaseResource {
  type: "COMMENT";
  commentId: string;
  authorId: string;
  parentPostId: string;
  parentPostType: PostModelType;
  visibility: PostVisibility;
}

export interface IUserProfileResource extends IBaseResource {
  type: "USER_PROFILE";
  targetUserId: string;
  isPrivateAccount: boolean;
}

export interface IDeviceResource extends IBaseResource {
  type: "DEVICE";
  deviceId: string;
  ownerId: string;
}

export type ResourceEntity =
  | IPostResource
  | IGistResource
  | IStakeResource
  | ICommentResource
  | IUserProfileResource
  | IDeviceResource;

export interface IPolicy<T extends IBaseResource> {
  evaluate(
    context: AuthorizationContext,
    resource: T,
  ): Promise<boolean> | boolean;
}
