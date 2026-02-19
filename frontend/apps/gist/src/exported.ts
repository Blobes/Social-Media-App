// apps/gist/src/exported.ts
import { registerItem } from "@funstakes/shared-state";
import { GistCard } from "./components/GistCard";
import { useGists } from "./hooks/useGists";
import { Gists } from "./app/Gists";

// Declare the components and hooks
declare module "@funstakes/types" {
  interface ISharedComponents {
    GistCard: typeof GistCard;
    Gists: typeof Gists;
  }
  interface ISharedHooks {
    useGists: typeof useGists;
  }
}

// Register components and hooks
registerItem.component("Gists", Gists);
registerItem.component("GistCard", GistCard);
registerItem.hook("useGists", useGists);
