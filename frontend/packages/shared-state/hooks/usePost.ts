"use client";

import { useState, useCallback, useEffect } from "react";
import { IAuthor, UIMode } from "@repo/types";
import { getCachedAuthor } from "@repo/helpers";

export const usePostAuthor = (postAuthor: IAuthor, mode?: UIMode) => {
  const [author, setAuthor] = useState<IAuthor>(postAuthor);
  const [error, setError] = useState<string | null>(null);

  const handleAuthor = useCallback(async () => {
    try {
      // Fecth author based on online or offline mode
      const authorRes =
        mode === "ONLINE"
          ? postAuthor
          : (await getCachedAuthor(postAuthor._id)) || postAuthor;
      if (authorRes) setAuthor(authorRes);
      else setError("Author not found");
    } catch {
      setError("Failed to load author");
    }
  }, [postAuthor._id, author, getCachedAuthor]);

  useEffect(() => {
    handleAuthor();
  }, [handleAuthor]);

  return { author, error };
};
