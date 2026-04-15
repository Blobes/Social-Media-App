"use client";

import React, { Fragment } from "react";
import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GenericStyle, ICountryItem, IMenuItem, IPage } from "@repo/core";
import { matchPaths } from "@repo/helpers";
import { usePathname } from "next/navigation";
import { AnchorLink } from "./Buttons";

// Props for the reusable nav renderer
export interface RenderListProps<T extends IMenuItem> {
  list: T[];
  onItemClick?: (item?: IMenuItem & T) => void;
  style?: GenericStyle;
  showActiveItem?: boolean;
  activeItem?: string;
  usePage?: () => { navigateTo: (savePage: IPage) => void };
}

export const RenderItemList = <T extends IMenuItem>({
  list,
  onItemClick,
  style = {},
  showActiveItem = true,
  activeItem,
  usePage,
}: RenderListProps<T>) => {
  const theme = useTheme();
  const pathname = usePathname();
  const hook = usePage ? usePage() : { navigateTo: () => {} };
  const { navigateTo } = hook; // Call hook at top level to avoid conditional hook calls

  const { fontSize, fontWeight, color, ...restStyle } = style;

  const itemStyle: GenericStyle = {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    cursor: "pointer",
    gap: theme.gap(3),
    padding: theme.boxSpacing(2, 6),
    borderRadius: theme.radius.full,
    transition: "all 0.2s ease",
    textDecoration: "none",
    "&:hover": {
      backgroundColor: theme.palette.gray.trans[1],
      outline: "none",
    },
    title: {
      fontSize: (fontSize ?? "15px") + "!important",
      fontWeight: (fontWeight ?? "600") + "!important",
      color: (color ?? theme.palette.gray[300]) + "!important",
      "&:hover": { textDecoration: "none", ...restStyle["&:hover"] },
    },
    ...restStyle,
  };

  return (
    <>
      {list.map((item, index) => {
        const isLink = item.type === "LINK" || (!item.type && item.url);
        const isActive = isLink
          ? matchPaths(pathname, item.url ?? "")
          : activeItem
            ? Object.values(item).some(
                (val) =>
                  typeof val === "string" &&
                  val.toLowerCase() === activeItem.toLowerCase(),
              )
            : false;

        // Shared Click Handler
        const handleClick = () => {
          if (isLink && usePage) {
            navigateTo({
              title: item.title ?? "",
              path: item.url ?? "",
            } as IPage);
          }
          if (item.action) item.action();
          if (onItemClick) (onItemClick as (item: IMenuItem) => void)(item);
        };

        // If it's just a raw element with no wrapper logic needed
        if (item.type === "COMPONENT")
          return <Fragment key={index}>{item.element}</Fragment>;

        // Wrapper Component: Use AnchorLink for links, div/button for actions
        const Wrapper = (isLink ? AnchorLink : Stack) as React.ElementType;

        return (
          <Wrapper
            key={index}
            {...(isLink ? { url: item.url ?? "" } : {})}
            onClick={handleClick}
            sx={{
              backgroundColor:
                showActiveItem && isActive
                  ? theme.palette.gray.trans[1]
                  : "transparent",
              ...itemStyle,
            }}>
            {/* Render Flag/Icon element if it exists */}
            {item.element && item.element}

            {item.title && (
              <Typography sx={{ ...itemStyle.title }}>{item.title}</Typography>
            )}
          </Wrapper>
        );
      })}
    </>
  );
};
