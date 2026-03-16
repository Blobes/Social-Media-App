import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IGist } from "@repo/types";

import { delay } from "@repo/helpers";
import { IListResponse } from "@repo/types";
import { GistService } from "./gistService";

export const useGists = () => {
  const router = useRouter();
  const [gists, setGists] = useState<IGist[]>([]);
  const { fetchGistList } = GistService();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const handleGists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchGistList();
      if (res?.payload) {
        setGists(res.payload);
        setMessage(res.message);
      }
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      await delay();
      setLoading(false);
    }
  }, [fetchGistList]);

  useEffect(() => {
    handleGists();
  }, [handleGists]);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    gists,
    message,
    isLoading,
    handleRefresh,
  };
};
