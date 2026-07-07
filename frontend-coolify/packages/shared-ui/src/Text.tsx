"use client";

import React from "react";
// import parse from "html-react-parser";
import { TooltipProps, Typography, TypographyProps } from "@mui/material";
import { Trans } from "react-i18next";
import { ITranslation, useGlobalStore } from "@repo/core";
import { A11y } from "./A11y";
import { BasicTooltip } from "./Tooltips";
import { lineClamp } from "@repo/helpers";

export type TransTextProps<C extends React.ElementType = "p"> = ITranslation & {
  children?: React.ReactNode;
  noComponent?: boolean;
  component?: C;
  isLiveAlert?: boolean;
  tooltip?: TooltipProps;
  trimCount?: number;
  breakWord?: boolean;
} & Omit<TypographyProps<C, { component?: C }>, "classes" | "component">;

type ReactI18nComponents =
  | Record<string, React.ReactElement>
  | readonly React.ReactElement[];

/**
 * Renders translated text with support for custom components, live accessibility regions,
 * basic tooltips, and text trimming configuration.
 */
export const TransText = <C extends React.ElementType = "p">({
  tKey,
  tValue,
  interpolations,
  children,
  inlineComponents,
  noComponent = false,
  component,
  isLiveAlert = false,
  tooltip,
  trimCount = 0,
  breakWord = false,
  ...typographyProps
}: TransTextProps<C>) => {
  const activeI18nInstance = useGlobalStore((state) => state.i18nInstance);
  const currentLanguage = useGlobalStore((state) => state.currentLanguage);
  const standardFallback = tValue || children || "";

  // Evaluate structural overrides using the target lineClamp design function if trimCount is active
  const extendedSx = {
    ...(breakWord
      ? {
          overflowWrap: "break-word", // Recommended standard
          wordBreak: "break-word", // Backward compatibility
          whiteSpace: "normal",
        }
      : {}),
    ...(trimCount > 0 ? lineClamp(trimCount) : {}),
    ...typographyProps.sx,
  };

  const wrapLiveRegion = (element: React.ReactElement) => {
    if (!isLiveAlert) return element;
    return <A11y useCase="text-live">{element}</A11y>;
  };
  const wrapTooltip = (element: React.ReactElement) => {
    if (!tooltip) return element;
    return <BasicTooltip {...tooltip}>{element}</BasicTooltip>;
  };

  if (!tKey || !activeI18nInstance) {
    const renderFallbackText = () => {
      if (typeof standardFallback === "string" && inlineComponents) {
        const strictString: string = standardFallback;
        return strictString.replace(/<\/?[^>]+(>|$)/g, "");
      }
      return standardFallback;
    };

    if (noComponent) {
      return wrapTooltip(wrapLiveRegion(<>{renderFallbackText()}</>));
    }

    return wrapTooltip(
      wrapLiveRegion(
        <Typography
          component={component || "p"}
          {...typographyProps}
          sx={extendedSx}>
          {renderFallbackText()}
        </Typography>,
      ),
    );
  }

  const normalizedComponents = React.useMemo<
    ReactI18nComponents | undefined
  >(() => {
    if (!inlineComponents) return undefined;

    if (Array.isArray(inlineComponents)) {
      return inlineComponents as readonly React.ReactElement[];
    }
    return inlineComponents as Record<string, React.ReactElement>;
  }, [inlineComponents]);

  const safeTransChildren =
    typeof standardFallback === "string" ? standardFallback : "";

  const transElement = (
    <Trans
      key={currentLanguage}
      i18n={activeI18nInstance as any}
      i18nKey={tKey}
      values={interpolations}
      components={normalizedComponents}>
      {safeTransChildren}
    </Trans>
  );

  if (noComponent) {
    return wrapTooltip(wrapLiveRegion(transElement));
  }

  return wrapTooltip(
    wrapLiveRegion(
      <Typography
        component={component || "p"}
        {...typographyProps}
        sx={extendedSx}>
        {transElement}
      </Typography>,
    ),
  );
};
