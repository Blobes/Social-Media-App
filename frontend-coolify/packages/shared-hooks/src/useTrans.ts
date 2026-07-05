"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ISinglePayload,
  ITranslation,
  SERVER_API,
  useGlobalStore,
} from "@repo/core";
import { apiClient } from "@repo/helpers";

export interface TranslateTextReq {
  textId: string;
  textToTranslate: string;
  sourceLang: string;
  targetLang: string;
}

interface TranslateTextResponse {
  translatedText: string;
}

interface TranslationArgs<TResponse> {
  textData: TranslateTextReq;
  parentKey: string;
  resolveTranslation: (response: TResponse) => string | undefined;
}

/**
 * Universal state machine and cache coordinator for translating text fields across separate modules.
 */
export const useDynamicTranslation = <TResponse>({
  textData,
  parentKey = "general_translation",
  resolveTranslation,
}: TranslationArgs<TResponse>) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [showingTranslation, setShowingTranslation] = useState(false);

  /**
   * Forwards a dynamic entity caption text block to the server for live engine translation.
   */
  const translateText = useCallback(
    async (
      data: TranslateTextReq,
    ): Promise<ISinglePayload<TranslateTextResponse | null>> => {
      try {
        const url = SERVER_API.translateCaption;
        const res = await apiClient<ISinglePayload<TranslateTextResponse>>(
          url,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          },
        );
        return res;
      } catch (error) {
        throw error;
      }
    },
    [],
  );

  const query = useQuery({
    // Combines custom contextual parameters directly into the unique caching array
    queryKey: [parentKey, textData.textId, textData.targetLang],
    queryFn: async () => {
      const response = await translateText(textData);
      const extractedText = resolveTranslation(
        response as unknown as TResponse,
      );

      if (!extractedText) {
        throw new Error(
          "Failed to resolve text string from translation response payload.",
        );
      }
      return extractedText;
    },
    // Triggers the request layer only on active layout updates
    enabled: shouldFetch && !!textData.textToTranslate?.trim(),
    staleTime: Infinity,
  });

  /**
   * Toggles visibility flags and triggers the underlying fetch operation.
   */
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

export const useStaticTranslation = () => {
  const activeI18nInstance = useGlobalStore((state) => state.i18nInstance);
  const currentLanguage = useGlobalStore((state) => state.currentLanguage);

  const translateTxtString = (transData: ITranslation) => {
    const standardFallback = transData.tValue || "";
    if (!transData.tKey || !activeI18nInstance) {
      return standardFallback;
    }
    return activeI18nInstance.t(transData.tKey, {
      defaultValue: standardFallback,
      lng: currentLanguage, // Force lookups to respect the active language state
      ...transData.interpolations,
    });
  };
  return { translateTxtString };
};
