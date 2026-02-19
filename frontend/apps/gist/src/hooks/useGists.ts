import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IGist } from "@funstakes/types";
import { useGistService } from "../service";
import { delay } from "@funstakes/helpers";

export const useGists = () => {
  const router = useRouter();
  const { getAllGist } = useGistService();
  const [gists, setGists] = useState<IGist[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  const handleGists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllGist();
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
  }, [getAllGist]);

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
