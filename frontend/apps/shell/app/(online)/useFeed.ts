"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IPost, IStake } from "@repo/types";
import { delay } from "@repo/helpers";
import { useStake } from "@repo/stake/shared";
import { useFeedService } from "./service";

export const useFeed = () => {
  const router = useRouter();
  const [feed, setFeed] = useState<IPost[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { stakes } = useStake();
  const { fetchFeed } = useFeedService();

  const handleFeed = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFeed();

      if (res?.payload) {
        // const feedList: IPost[] = res.payload.map((post: any) => ({
        //   ...post,
        //   type: String(post.postType).toUpperCase() || "GIST",
        // }));

        // Map the local stakes
        const stakeList: IPost[] = stakes.map((stake: IStake) => ({
          ...stake,
          postType: "STAKE" as const,
        }));

        // 4. Combine and Sort
        const combinedList = [...feed, ...stakeList];

        // 5. Update State with the fully casted IPost[]
        setFeed(combinedList);
        setMessage(res.message);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      await delay();
      setLoading(false);
    }
  }, [fetchFeed, stakes]);

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
  };
};
