import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IGist, IStake } from "@/types";
import { cacheFeed, getCachedFeed } from "@/helpers/cache";
import { delay } from "@/helpers/global";
import { useGists } from "../(features)/gist/hooks/useGists";
import { useStake } from "../(features)/stake/useStake";

export type FeedItem =
  | (IGist & { type: "gist" })
  | (IStake & { type: "stake" });

export const useFeed = (mode: "online" | "offline" = "online") => {
  const router = useRouter();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setLoading] = useState(false);
  const { gists, message } = useGists();
  const { stakes } = useStake();

  const handleFeed = useCallback(async () => {
    try {
      setLoading(true);
      // Map Posts from the server
      const gistList: FeedItem[] = gists.map((gist) => ({
        ...gist,
        type: "gist",
      }));
      const stakeList: FeedItem[] = stakes.map((stake) => ({
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
