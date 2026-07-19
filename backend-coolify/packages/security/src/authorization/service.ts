import {
  ADMIN_PERMISSIONS,
  COMMENT_PERMISSIONS,
  POST_PERMISSIONS,
  USER_PERMISSIONS,
} from "./constants/permissions";
import { COMMUNITY_ROLES, PLATFORM_ROLES } from "./constants/roles";
import { AuthorizationContext, PermissionName, RoleName } from "./types";

/**
 * The AuthorizationService is responsible for resolving a user's effective permissions
 * and evaluating authorization policies. It does NOT interact with the database directly.
 * It expects to receive the user's roles and any other relevant context from an
 * external source (e.g., the Account Service after fetching from the database).
 */
export class AuthorizationService {
  private userPermissionsCache: Map<string, Set<PermissionName>> = new Map(); // In a real app, use Redis

  constructor() {
    // In a production app, this would be initialized with a way to
    // fetch role-permission mappings from the Account Service, or a cache.
  }

  /**
   * Resolves all permissions granted to a user based on their assigned roles.
   * This method would typically query the Account Service (or a cache populated by it)
   * to get the role-permission mappings. For now, it's a placeholder.
   * @param roleNames The names of the roles the user possesses.
   * @returns A Promise resolving to a Set of permission names.
   */
  public async resolveUserPermissions(
    roleNames: RoleName[],
  ): Promise<Set<PermissionName>> {
    // This is where the actual logic to fetch permissions for roles would go.
    // For demonstration, we'll return a dummy set.
    console.warn(
      "AuthorizationService: resolveUserPermissions is a placeholder. Implement actual role-permission mapping lookup.",
    );

    const permissions = new Set<PermissionName>();
    // Example: A real implementation would fetch from a cache or the Account Service
    // for each role, get its associated permissions, and add them to the set.
    // For instance, if 'ADMIN' role has 'admin.dashboard.access', add it.

    // Dummy permissions for now
    if (roleNames.includes(COMMUNITY_ROLES.USER)) {
      permissions.add(POST_PERMISSIONS.CREATE);
      permissions.add(COMMENT_PERMISSIONS.CREATE);
      permissions.add(USER_PERMISSIONS.EDIT_PROFILE);
    }
    if (roleNames.includes(PLATFORM_ROLES.ADMIN)) {
      permissions.add(ADMIN_PERMISSIONS.DASHBOARD_ACCESS);
      permissions.add(USER_PERMISSIONS.VIEW_DETAILS);
      permissions.add(POST_PERMISSIONS.DELETE);
    }
    // ... add more logic based on roles ...

    return permissions;
  }

  /**
   * Checks if a user has a specific permission.
   * @param context The AuthorizationContext for the user.
   * @param requiredPermission The permission to check.
   * @returns True if the user has the permission, false otherwise.
   */
  public async can(
    context: AuthorizationContext,
    requiredPermission: PermissionName,
  ): Promise<boolean> {
    const userKey = context.userId; // Or some other unique key for caching
    let userPerms = this.userPermissionsCache.get(userKey);

    if (!userPerms) {
      userPerms = await this.resolveUserPermissions(context.roleNames);
      this.userPermissionsCache.set(userKey, userPerms);
    }

    return userPerms.has(requiredPermission);
  }

  /**
   * Checks if a user has ANY of the given permissions.
   * @param context The AuthorizationContext for the user.
   * @param requiredPermissions An array of permissions, any of which would grant access.
   * @returns True if the user has at least one of the permissions, false otherwise.
   */
  public async canAny(
    context: AuthorizationContext,
    requiredPermissions: PermissionName[],
  ): Promise<boolean> {
    const userKey = context.userId;
    let userPerms = this.userPermissionsCache.get(userKey);

    if (!userPerms) {
      userPerms = await this.resolveUserPermissions(context.roleNames);
      this.userPermissionsCache.set(userKey, userPerms);
    }

    for (const perm of requiredPermissions) {
      if (userPerms.has(perm)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if a user has ALL of the given permissions.
   * @param context The AuthorizationContext for the user.
   * @param requiredPermissions An array of permissions, all of which must be present.
   * @returns True if the user has all the permissions, false otherwise.
   */
  public async canAll(
    context: AuthorizationContext,
    requiredPermissions: PermissionName[],
  ): Promise<boolean> {
    const userKey = context.userId;
    let userPerms = this.userPermissionsCache.get(userKey);

    if (!userPerms) {
      userPerms = await this.resolveUserPermissions(context.roleNames);
      this.userPermissionsCache.set(userKey, userPerms);
    }

    for (const perm of requiredPermissions) {
      if (!userPerms.has(perm)) {
        return false;
      }
    }
    return true;
  }

  // Add methods for policy evaluation here later as needed
}

// Export a singleton instance for convenience
export const authorizationService = new AuthorizationService();
