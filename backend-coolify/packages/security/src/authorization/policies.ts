import { PLATFORM_ROLES, RoleName, SubscriptionTier } from "@repo/database";
import {
  AuthorizationContext,
  IBaseResource,
  ICommentResource,
  IDeviceResource,
  IGistResource,
  IOwnerResource,
  IPolicy,
  IStakeResource,
  IUserProfileResource,
  TIER_WEIGHTS,
} from "@repo/shared";
import { RelationStoreService } from "./services/relationStore";

export abstract class BaseAuthPolicy {
  /**
   * Validates target entity state flags.
   */
  protected isEntityAccessible(resource: IBaseResource): boolean {
    return !(resource.isDeleted || resource.isArchived || resource.isSuspended);
  }

  /**
   * Checks if context holds administrative elevated roles.
   */
  protected hasAdminBypass(context: AuthorizationContext): boolean {
    const adminRoles: RoleName[] = [
      PLATFORM_ROLES.OWNER,
      PLATFORM_ROLES.SUPER_ADMIN,
      PLATFORM_ROLES.ADMIN,
      PLATFORM_ROLES.MODERATOR,
    ];

    return context.roles.some((role) => adminRoles.includes(role as RoleName));
  }

  /**
   * Verifies whether the authenticated context satisfies required subscription tier requirements.
   */
  protected hasSubscriptionAccess(
    context: AuthorizationContext,
    requiredTier?: SubscriptionTier,
  ): boolean {
    if (!requiredTier || requiredTier === "FREE") {
      return true;
    }

    const currentStatus = context.subscriptionStatus ?? "ACTIVE";
    const isSubscriptionActive =
      currentStatus === "ACTIVE" || currentStatus === "TRIALING";

    if (!isSubscriptionActive) {
      return false;
    }

    const userTierWeight = TIER_WEIGHTS[context.subscriptionTier ?? "FREE"];
    const requiredTierWeight = TIER_WEIGHTS[requiredTier];

    return userTierWeight >= requiredTierWeight;
  }
}

/**
 * Enforces security and ReBAC policies for Gist entities.
 */
export class GistAuthPolicy
  extends BaseAuthPolicy
  implements IPolicy<IGistResource>
{
  /**
   * Evaluates authorization access for Gist resources.
   */
  public async evaluate(
    context: AuthorizationContext,
    resource: IGistResource,
  ): Promise<boolean> {
    if (!this.isEntityAccessible(resource)) {
      return false;
    }

    if (this.hasAdminBypass(context)) {
      return true;
    }

    if (!this.hasSubscriptionAccess(context, resource.requiredTier)) {
      return false;
    }

    if (context.userId === resource.authorId) {
      return true;
    }

    const isBlocked = await RelationStoreService.isBlocked(
      context.userId,
      resource.authorId,
    );
    if (isBlocked) {
      return false;
    }

    if (resource.visibility === "DRAFT") {
      return false;
    }

    if (
      resource.visibility === "FOLLOWERS" ||
      resource.visibility === "FRIENDS_ONLY"
    ) {
      return await RelationStoreService.hasRelation({
        subjectId: context.userId,
        relation: "follower",
        objectType: "user",
        objectId: resource.authorId,
      });
    }

    return true;
  }
}

/**
 * Enforces security and ReBAC policies for Stake entities.
 */
export class StakeAuthPolicy
  extends BaseAuthPolicy
  implements IPolicy<IStakeResource>
{
  /**
   * Evaluates authorization access for Stake resources.
   */
  public async evaluate(
    context: AuthorizationContext,
    resource: IStakeResource,
  ): Promise<boolean> {
    if (!this.isEntityAccessible(resource)) {
      return false;
    }

    if (this.hasAdminBypass(context)) {
      return true;
    }

    if (!this.hasSubscriptionAccess(context, resource.requiredTier)) {
      return false;
    }

    if (context.userId === resource.authorId) {
      return true;
    }

    const isBlocked = await RelationStoreService.isBlocked(
      context.userId,
      resource.authorId,
    );
    if (isBlocked) {
      return false;
    }

    if (resource.visibility === "DRAFT") {
      return false;
    }

    if (resource.visibility === "FOLLOWERS") {
      return await RelationStoreService.hasRelation({
        subjectId: context.userId,
        relation: "follower",
        objectType: "user",
        objectId: resource.authorId,
      });
    }

    return true;
  }
}

/**
 * Enforces security and ReBAC policies for Comment entities.
 */
export class CommentAuthPolicy
  extends BaseAuthPolicy
  implements IPolicy<ICommentResource>
{
  /**
   * Evaluates authorization access for Comment resources.
   */
  public async evaluate(
    context: AuthorizationContext,
    resource: ICommentResource,
  ): Promise<boolean> {
    if (!this.isEntityAccessible(resource)) {
      return false;
    }

    if (this.hasAdminBypass(context)) {
      return true;
    }

    if (!this.hasSubscriptionAccess(context, resource.requiredTier)) {
      return false;
    }

    if (context.userId === resource.authorId) {
      return true;
    }

    const isBlocked = await RelationStoreService.isBlocked(
      context.userId,
      resource.authorId,
    );
    if (isBlocked) {
      return false;
    }

    if (resource.visibility === "DRAFT") {
      return false;
    }

    if (resource.visibility === "FOLLOWERS") {
      return await RelationStoreService.hasRelation({
        subjectId: context.userId,
        relation: "follower",
        objectType: "user",
        objectId: resource.authorId,
      });
    }

    return true;
  }
}

/**
 * Enforces security and ReBAC policies for User Profile interactions.
 */
export class UserProfileAuthPolicy
  extends BaseAuthPolicy
  implements IPolicy<IUserProfileResource>
{
  /**
   * Evaluates authorization access for User Profile resources.
   */
  public async evaluate(
    context: AuthorizationContext,
    resource: IUserProfileResource,
  ): Promise<boolean> {
    if (!this.isEntityAccessible(resource)) {
      return false;
    }

    if (this.hasAdminBypass(context)) {
      return true;
    }

    if (!this.hasSubscriptionAccess(context, resource.requiredTier)) {
      return false;
    }

    if (context.userId === resource.targetUserId) {
      return true;
    }

    const isBlocked = await RelationStoreService.isBlocked(
      context.userId,
      resource.targetUserId,
    );
    if (isBlocked) {
      return false;
    }

    if (resource.isPrivateAccount) {
      return await RelationStoreService.hasRelation({
        subjectId: context.userId,
        relation: "follower",
        objectType: "user",
        objectId: resource.targetUserId,
      });
    }

    return true;
  }
}

/**
 * Enforces security and ReBAC policies for User Device management.
 */
export class DeviceAuthPolicy
  extends BaseAuthPolicy
  implements IPolicy<IDeviceResource>
{
  /**
   * Evaluates authorization access for Device resources.
   */
  public async evaluate(
    context: AuthorizationContext,
    resource: IDeviceResource,
  ): Promise<boolean> {
    if (!this.isEntityAccessible(resource)) {
      return false;
    }

    if (this.hasAdminBypass(context)) {
      return true;
    }

    if (!this.hasSubscriptionAccess(context, resource.requiredTier)) {
      return false;
    }

    if (context.userId === resource.ownerId) {
      return true;
    }

    return await RelationStoreService.hasRelation({
      subjectId: context.userId,
      relation: "editor",
      objectType: "device",
      objectId: resource.deviceId,
    });
  }
}

/**
 * Enforces strict direct ownership checks (e.g., viewing personal drafts or private metrics).
 */
export class OwnerAuthPolicy
  extends BaseAuthPolicy
  implements IPolicy<IOwnerResource>
{
  public async evaluate(
    context: AuthorizationContext,
    resource: IOwnerResource,
  ): Promise<boolean> {
    if (!this.isEntityAccessible(resource)) {
      return false;
    }

    if (this.hasAdminBypass(context)) {
      return true;
    }

    if (!this.hasSubscriptionAccess(context, resource.requiredTier)) {
      return false;
    }

    return context.userId === resource.targetUserId;
  }
}

export const gistPolicy = new GistAuthPolicy();
export const stakePolicy = new StakeAuthPolicy();
export const commentPolicy = new CommentAuthPolicy();
export const userProfilePolicy = new UserProfileAuthPolicy();
export const devicePolicy = new DeviceAuthPolicy();
export const ownerPolicy = new OwnerAuthPolicy();
