import { useUser } from "./app/useUser";
import { registerItem } from "@funstakes/shared-state";

registerItem.hook("useUser", useUser);
