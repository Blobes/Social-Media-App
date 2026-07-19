"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiError, CACHE_KEYS, IStake } from "@repo/core";
import { delay } from "@repo/helpers";
import { stakeTestData } from "@repo/assets";

/**
 * Manages stake data fetching and state synchronization.
 */
export const useStake = () => {
  /**
   * Fetches stake data with a simulated delay for testing.
   */
  const fetchStakes = async (): Promise<IStake[]> => {
    await delay();
    return stakeTestData;
  };

  // Implementation of TanStack Query for data fetching
  const {
    data: stakes = [],
    isLoading,
    isFetching,
    refetch,
    error,
  } = useQuery<IStake[], ApiError>({
    queryKey: [CACHE_KEYS.POST.STAKES],
    queryFn: fetchStakes,
    // Adjust staleTime as needed for production data
    staleTime: 1000 * 60 * 5,
  });

  /**
   * Manually triggers a refresh of the stake data.
   */
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    stakes,
    isLoading: isLoading || isFetching,
    handleRefresh,
    message: error ? error.localizedErrMsg || error.message : null,
  };
};
