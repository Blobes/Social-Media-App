import { registerItem } from "@funstakes/shared-state";
import { Logout } from "./app/logout/Logout";
import { useAuth } from "./app/useAuth";
import { useLogout } from "./app/logout/useLogout";

// Export the auth module
export { AuthWrapper as AuthModule } from "./app/AuthWrapper";

// Register components and hooks
registerItem.component("Logout", Logout);
registerItem.hook("useLogout", useLogout);
registerItem.hook("useAuth", useAuth);
