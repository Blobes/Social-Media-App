import { registerItem } from "@funstakes/helpers";
import { Logout } from "./app/logout/Logout";
import { Login } from "./app/login/Login";
import { useAuth } from "./app/useAuth";
import { useLogout } from "./app/logout/useLogout";

// Export the auth module
export { AuthModule } from "./app/AuthModule";

// Declare the components and hooks
declare module "@funstakes/types" {
  interface ISharedComponents {
    Logout: typeof Logout;
    Login: typeof Login;
  }
  interface ISharedHooks {
    useAuth: typeof useAuth;
    useLogout: typeof useLogout;
  }
}

// Register the components and hooks
registerItem.component("Logout", Logout);
registerItem.component("Login", Login);
registerItem.hook("useLogout", useLogout);
registerItem.hook("useAuth", useAuth);
