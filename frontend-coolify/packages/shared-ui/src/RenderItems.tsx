"use client";

import React, { Fragment } from "react";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { INavItem, IPage } from "@repo/types";
import { matchPaths } from "@repo/helpers";
import { usePathname } from "next/navigation";
import { AnchorLink } from "./Buttons";

// Props for the reusable nav renderer
export interface RenderListProps {
  list: INavItem[];
  itemAction?: () => void;
  style?: any;
  showCurrentPage?: boolean;
  hook: () => { navigateTo: (savePage: IPage) => void };
}
// Renders an advance nav list
export const RenderItemList: React.FC<RenderListProps> = ({
  list,
  itemAction,
  style = {},
  showCurrentPage = true,
  hook,
}) => {
  const theme = useTheme();
  const pathname = usePathname();
  const { fontSize, fontWeight, color, ...restStyle } = style;

  const itemStyle: any = {
    alignItems: "center",
    gap: theme.gap(3),
    padding: theme.boxSpacing(2, 6),
    borderRadius: theme.radius.full,
    "&:hover": {
      backgroundColor: theme.palette.gray.trans[1],
      outline: "none",
    },
    title: {
      fontSize: `${fontSize ?? "15px"}!important`,
      fontWeight: `${fontWeight ?? "600"}!important`,
      color: `${color ?? theme.palette.gray[300]}!important`,
      "&:hover": { ...restStyle["&:hover"] },
    },
    ...restStyle,
  };

  return (
    <>
      {list.map((item, index) => {
        if (!item.title && item.element) {
          // Render the "element" alone if there's no title
          return <Fragment key={index}>{item.element}</Fragment>;
        }
        const isCurrentPage = matchPaths(pathname, item.url);
        return (
          <AnchorLink
            key={index}
            url={item.url ?? "#"}
            onClick={() => {
              const page = {
                title: item.title,
                path: item.url ?? "#",
              };
              hook().navigateTo(page as IPage);
              if (item.action) item.action();
              if (itemAction) itemAction();
            }}
            aria-current={isCurrentPage ? "page" : undefined}
            role="link"
            tabIndex={0}
            style={{
              backgroundColor:
                showCurrentPage && isCurrentPage
                  ? theme.palette.gray.trans[1]
                  : "none",
              ...itemStyle,
            }}>
            {item.element && item.element}
            {item.title && (
              <Typography sx={{ ...itemStyle.title }}>{item.title}</Typography>
            )}
          </AnchorLink>
        );
      })}
    </>
  );
};
