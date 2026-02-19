"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IFeed, IGist, IStake } from "@funstakes/types";
import { cacheFeed, getCachedFeed } from "@funstakes/helpers";
import { delay } from "@funstakes/helpers";
import { sharedRegistry } from "@funstakes/helpers";

export const useFeed = (mode: "online" | "offline" = "online") => {
  const router = useRouter();
  const [feed, setFeed] = useState<IFeed[]>([]);
  const [isLoading, setLoading] = useState(false);

  const useGists = sharedRegistry.hooks["useGists"];
  const { gists, message } = useGists();

  const useStake = sharedRegistry.hooks["useStake"];
  const { stakes } = useStake();

  const handleFeed = useCallback(async () => {
    try {
      setLoading(true);
      // Map Posts from the server
      const gistList: IFeed[] = gists.map((gist: IGist) => ({
        ...gist,
        type: "gist",
      }));
      const stakeList: IFeed[] = stakes.map((stake: IStake) => ({
        ...stake,
        type: "stake",
      }));

      // Sort
      const combinedList = [...gistList, ...stakeList].sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const finalFeed =
        mode === "online" ? combinedList : await getCachedFeed();

      // Update State and Cache
      setFeed(finalFeed);
      cacheFeed(finalFeed);
    } finally {
      await delay();
      setLoading(false);
    }
  }, [gists, stakes]);

  useEffect(() => {
    handleFeed();
  }, [handleFeed]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    feed,
    message,
    isLoading,
    handleRefresh,
    mode,
  };
};
