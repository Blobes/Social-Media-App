"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CACHE_KEYS } from "@repo/core";
import { PostService, TranslateTextReq } from "../postService";

/**
 * Encapsulates both network fetching logic and toggle state machines for dynamic translations.
 */
export const useCaptionTranslation = (reqData: TranslateTextReq) => {
  const { translateText } = PostService();
  const [shouldFetch, setShouldFetch] = useState(false);
  const [showingTranslation, setShowingTranslation] = useState(false);

  const query = useQuery({
    queryKey: [CACHE_KEYS.POST.TRANSLATION, reqData.postId, reqData.targetLang],
    queryFn: async () => {
      const response = await translateText(reqData);
      if (response?.status !== "SUCCESS" || !response.payload?.translatedText) {
        throw new Error(
          response?.message || "Failed to retrieve text translation mapping.",
        );
      }
      return response.payload.translatedText;
    },
    // Only execute the fetch operation if explicitly triggered and string is valid
    enabled: shouldFetch && !!reqData.caption.trim(),
    staleTime: Infinity,
  });

  const toggleTranslation = () => {
    if (!shouldFetch) {
      setShouldFetch(true);
    }
    setShowingTranslation((prev) => !prev);
  };

  return {
    translatedText: query.data,
    isFetching: query.isFetching,
    isError: query.isError,
    showingTranslation: showingTranslation && !!query.data,
    toggleTranslation,
  };
};
