import { registerItem } from "@funstakes/shared-state";
import { useStake } from "./app/useStake";
import { StakeCard } from "./app/StakeCard";

//export { StakeCard } from "./app/StakeCard";

registerItem.component("StakeCard", StakeCard);
registerItem.hook("useStake", useStake);
