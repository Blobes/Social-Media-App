"use client";

import { useState, useCallback, useEffect } from "react";
import { IAuthor } from "@repo/types";
import { getCachedAuthor } from "@repo/helpers";

export const usePost = (authorId: string) => {
  const [cachedAuthor, setAuthor] = useState<IAuthor>();

  const handleCachedAuthor = useCallback(async () => {
    const res = await getCachedAuthor(authorId);
    if (res) setAuthor(res);
  }, [authorId, getCachedAuthor]);

  useEffect(() => {
    handleCachedAuthor();
  }, [handleCachedAuthor]);

  return { cachedAuthor };
};
