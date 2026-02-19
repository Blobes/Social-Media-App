import { registerItem } from "@funstakes/helpers";
import { useStake } from "./app/useStake";
import { StakeCard } from "./app/StakeCard";

//export { StakeCard } from "./app/StakeCard";

// Declare the components and hooks
declare module "@funstakes/types" {
  interface ISharedComponents {
    StakeCard: typeof StakeCard;
  }
  interface ISharedHooks {
    useStake: typeof useStake;
  }
}

// Register components and hooks
registerItem.component("StakeCard", StakeCard);
registerItem.hook("useStake", useStake);
