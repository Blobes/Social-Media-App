import { useUser } from "./app/useUser";
import { registerItem } from "@funstakes/shared-state";

// Declare the components and hooks
declare module "@funstakes/types" {
  interface ISharedHooks {
    useUser: typeof useUser;
  }
}

registerItem.hook("useUser", useUser);
