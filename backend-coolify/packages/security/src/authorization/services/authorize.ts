import {
  COMMUNITY_ROLES,
  PermissionName,
  PLATFORM_ROLES,
} from "@repo/database";
import {
  AuthorizationContext,
  getCachedPermissionsForRoles,
  IJwtUser,
} from "@repo/shared";

export interface AuthorizationPolicy<T = unknown> {
  evaluate(
    context: AuthorizationContext,
    resource?: T,
  ): boolean | Promise<boolean>;
}

/**
 * Resolves effective permissions and evaluates policies across microservices.
 */
export class AuthorizationService {
  /**
   * Constructs an AuthorizationContext from stateless JWT payload without database lookups.
   */
  public static async buildContextFromJwt(
    user: IJwtUser,
    additionalParams: Record<string, unknown> = {},
  ): Promise<AuthorizationContext> {
    const roles =
      user.roles && user.roles.length > 0
        ? user.roles
        : [COMMUNITY_ROLES.GUEST];
    const permissions = await getCachedPermissionsForRoles(roles);

    const subscriptionTier = user.subscriptionTier ?? "FREE";
    const subscriptionStatus = user.subscriptionStatus ?? "ACTIVE";

    // Standardized check for active paid subscribers
    const isPremium =
      (subscriptionTier === "PREMIUM" || subscriptionTier === "ENTERPRISE") &&
      (subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING");

    return {
      userId: user.id.toString(),
      email: user.email,
      roles,
      permissions,
      subscriptionTier,
      subscriptionStatus,
      isPremium,
      ...additionalParams,
    };
  }

  /**
   * Verifies if a context includes a required permission or administrative privileges.
   */
  public static hasPermission(
    context: AuthorizationContext,
    requiredPermission: PermissionName,
  ): boolean {
    const hasAdminBypass = context.roles.some(
      (role) =>
        role === PLATFORM_ROLES.OWNER || role === PLATFORM_ROLES.SUPER_ADMIN,
    );
    if (hasAdminBypass) {
      return true;
    }
    return context.permissions?.has(requiredPermission) ?? false;
  }

  /**
   * Alias for hasPermission.
   */
  public static can(
    context: AuthorizationContext,
    requiredPermission: PermissionName,
  ): boolean {
    return AuthorizationService.hasPermission(context, requiredPermission);
  }

  /**
   * Verifies if a context holds at least one of the specified permissions.
   */
  public static canAny(
    context: AuthorizationContext,
    requiredPermissions: PermissionName[],
  ): boolean {
    const hasAdminBypass = context.roles.some(
      (role) =>
        role === PLATFORM_ROLES.OWNER || role === PLATFORM_ROLES.SUPER_ADMIN,
    );
    if (hasAdminBypass) {
      return true;
    }
    if (!context.permissions) {
      return false;
    }
    return requiredPermissions.some((perm) => context.permissions?.has(perm));
  }

  /**
   * Verifies if a context holds all specified permissions.
   */
  public static canAll(
    context: AuthorizationContext,
    requiredPermissions: PermissionName[],
  ): boolean {
    const hasAdminBypass = context.roles.some(
      (role) =>
        role === PLATFORM_ROLES.OWNER || role === PLATFORM_ROLES.SUPER_ADMIN,
    );
    if (hasAdminBypass) {
      return true;
    }
    if (!context.permissions) {
      return false;
    }
    return requiredPermissions.every((perm) => context.permissions?.has(perm));
  }

  /**
   * Evaluates dynamic ReBAC and ABAC authorization policies.
   */
  public static async evaluatePolicy<T = unknown>(
    policy: AuthorizationPolicy<T>,
    context: AuthorizationContext,
    resource?: T,
  ): Promise<boolean> {
    return Promise.resolve(policy.evaluate(context, resource));
  }
}
