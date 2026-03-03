"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IPost, IGist, IStake } from "@repo/types";
import { getCachedPosts } from "@repo/helpers";
import { delay } from "@repo/helpers";
import { useGists } from "@repo/gist/shared";
import { useStake } from "@repo/stake/shared";

export const useFeed = (mode: "online" | "offline" = "online") => {
  const router = useRouter();
  const [feed, setFeed] = useState<IPost[]>([]);
  const [isLoading, setLoading] = useState(false);
  const { gists, message } = useGists();
  const { stakes } = useStake();

  const handleFeed = useCallback(async () => {
    try {
      setLoading(true);
      // Map Posts from the server
      const gistList: IPost[] = gists.map((gist: IGist) => ({
        ...gist,
        type: "gist",
      }));
      const stakeList: IPost[] = stakes.map((stake: IStake) => ({
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
        mode === "online" ? combinedList : await getCachedPosts();

      // Update State
      setFeed(finalFeed);
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
