"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IStake } from "@repo/core";
import { delay } from "@repo/helpers";
import { stakeTestData } from "@repo/assets";

export const useStake = () => {
  const router = useRouter();

  const [stakes, setStakes] = useState<IStake[]>(stakeTestData);
  const [isLoading, setLoading] = useState(false);

  const handleStakes = useCallback(async () => {
    try {
      setLoading(true);
      setStakes(stakeTestData);
    } finally {
      await delay();
      setLoading(false);
    }
  }, [stakeTestData]);

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
