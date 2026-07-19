"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ITranslation,
  useGlobalStore,
  ApiError,
  DynamicTranslateArgs,
  COMMON_FEEDBACK,
} from "@repo/core";
import { useSnackbar } from "./useSnackbar";

/**
 * Universal state machine and cache coordinator for translating text fields across separate modules.
 */
export const useDynamicTranslation = ({
  textData,
  parentKey = "general_translation",
  transCb,
}: DynamicTranslateArgs) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [showingTranslation, setShowingTranslation] = useState(false);
  const { setSBMessage } = useSnackbar();
  const { translateTxtString } = useStaticTranslation();

  const { data, isFetching, isError } = useQuery({
    queryKey: [parentKey, textData.textId, textData.targetLang],
    queryFn: async () => {
      try {
        const response = await transCb.translateServiceFn(textData);
        const extractedText = transCb.resolveTranslation?.(response);

        if (!extractedText) {
          throw new Error(
            COMMON_FEEDBACK.failed_to_translate_dynamic_text.tValue,
          );
        }
        return extractedText;
      } catch (err) {
        setSBMessage({
          msg: {
            tagline: translateTxtString(
              COMMON_FEEDBACK.failed_to_translate_dynamic_text,
            ),
            msgStatus: "ERROR",
            hasClose: true,
          },
        });
      }
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
    translatedText: data,
    isFetching: isFetching,
    isError: isError,
    showingTranslation: showingTranslation && !!data,
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
