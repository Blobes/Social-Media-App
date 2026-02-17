// apps/gist/src/exported.ts
import { registerItem } from "@funstakes/shared-state";
import { GistCard } from "./components/GistCard";
import { useGists } from "./hooks/useGists";
import { Gists } from "./app/Gists";

registerItem.component("Gists", Gists);
registerItem.component("GistCard", GistCard);
registerItem.hook("useGists", useGists);
