"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IStake } from "@repo/types";
import { delay } from "@repo/helpers";
import { stakeData } from "@repo/test-data";

export const useStake = () => {
  const router = useRouter();

  const [stakes, setStakes] = useState<IStake[]>(stakeData);
  const [isLoading, setLoading] = useState(false);

  const handleStakes = useCallback(async () => {
    try {
      setLoading(true);
      setStakes(stakeData);
    } finally {
      await delay();
      setLoading(false);
    }
  }, [stakeData]);

  useEffect(() => {
    handleStakes();
  }, [handleStakes]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    stakes,
    isLoading,
    handleRefresh,
  };
};
