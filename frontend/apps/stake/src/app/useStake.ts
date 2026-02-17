import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IStake } from "@funstakes/types";
import { delay } from "@funstakes/helpers";
import { stakeData } from "libs/test-data/postData";

export const useStake = () => {
  const router = useRouter();
  // const { getAllGist } = useGistService();

  const [stakes, setStakes] = useState<IStake[]>(stakeData);
  // const [message, setMessage] = useState<string | null>(null);
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
