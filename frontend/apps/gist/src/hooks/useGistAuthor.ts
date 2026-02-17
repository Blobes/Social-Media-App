import { useState, useCallback, useEffect } from "react";
import { IUser, UIMode } from "@/types";
import { cacheAuthor, getCachedAuthor } from "@/helpers/cache";

export const useGistAuthor = (
  authorId: string,
  fetchAuthor: (id: string) => Promise<any>,
  mode?: UIMode,
) => {
  const [author, setAuthor] = useState<IUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuthor = useCallback(async () => {
    if (!authorId || author) return;
    try {
      // Fecth author based on online or offline mode
      const authorRes =
        mode === "online"
          ? await fetchAuthor(authorId)
          : await getCachedAuthor(authorId);
      if (authorRes) {
        setAuthor(authorRes);
        cacheAuthor(authorRes);
      } else {
        setError("Failed to load author");
      }
    } catch {
      setError("Failed to load author");
    }
  }, [authorId, fetchAuthor, author, getCachedAuthor]);

  useEffect(() => {
    handleAuthor();
  }, [handleAuthor]);

  return { author, error };
};
