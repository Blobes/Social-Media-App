"use client";

import { useCallback } from "react";
import { QUERY_KEYS, IGist } from "@repo/core";
import { GistService } from "../gistService";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to manage gist list fetching and granular cache synchronization.
 */
export const useGists = () => {
  const queryClient = useQueryClient();
  const { fetchGistList } = GistService();

  /**
   * Fetches the gist list and dissolves results into individual cache entries.
   */
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: [QUERY_KEYS.POST.GISTS],
    queryFn: async () => {
      const res = await fetchGistList();

      if (res?.payload && Array.isArray(res.payload)) {
        // Dissolve Strategy: Populate granular keys for each gist to support usePostSeen
        // and useCachedData without further network requests.
        res.payload.forEach((gist: IGist) => {
          queryClient.setQueryData([QUERY_KEYS.POST.GISTS, gist._id], gist);
        });
      }
      return res;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  /**
   * Manual trigger to refresh gist data.
   */
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Return the payload data directly from the TanStack cache
    gists: data?.payload || [],
    message: error instanceof Error ? error.message : data?.message || null,
    isLoading,
    handleRefresh,
  };
};
