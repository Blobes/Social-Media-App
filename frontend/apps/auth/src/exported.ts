import { registerItem } from "@funstakes/shared-state";
import { Logout } from "./app/logout/Logout";
import { useAuth } from "./app/useAuth";
import { useLogout } from "./app/logout/useLogout";

// Export the auth module
export { AuthModule } from "./app/AuthModule";

// Declare the components and hooks
declare module "@funstakes/types" {
  interface ISharedComponents {
    Logout: typeof Logout;
  }
  interface ISharedHooks {
    useAuth: typeof useAuth;
    useLogout: typeof useLogout;
  }
}

// Register the components and hooks
registerItem.component("Logout", Logout);
registerItem.hook("useLogout", useLogout);
registerItem.hook("useAuth", useAuth);
