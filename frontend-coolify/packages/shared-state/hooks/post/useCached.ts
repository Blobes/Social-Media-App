"use client";

import { useState, useCallback, useEffect } from "react";
import { IPostAuthor } from "@repo/types";
import { getCachedAuthor } from "@repo/helpers";

export const useCached = (authorId: string) => {
  const [cachedAuthor, setAuthor] = useState<IPostAuthor>();

  const handleAuthor = useCallback(async () => {
    const res = await getCachedAuthor(authorId);
    if (res) setAuthor(res);
  }, [authorId, getCachedAuthor]);

  useEffect(() => {
    handleAuthor();
  }, [handleAuthor]);

  return { cachedAuthor };
};
