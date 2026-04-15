"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { Box, Menu, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { MenuRef, GenericStyle, IMenuItem, ListType, LISTS } from "@repo/core";
import { RenderItemList, RenderListProps } from "./RenderItems";
import { SearchBar } from "./Search";
import { scrollBarStyle } from "@repo/helpers";

interface MenuProps {
  children?: ReactNode;
  stickToScreen?: boolean;
  heightThreshold?: number;
  style?: GenericStyle;
}
export const MenuPopup = forwardRef<MenuRef, MenuProps>(
  ({ children, stickToScreen = true, heightThreshold, style }, ref) => {
    const theme = useTheme();
    const [anchorElNav, setAnchorEl] = useState<null | HTMLElement>(null);
    useImperativeHandle(ref, () => ({
      openMenu: (anchor: HTMLElement) => {
        setAnchorEl(anchor);
      },
      closeMenu: () => {
        setAnchorEl(null);
      },
    }));
    return (
      <Menu
        anchorEl={anchorElNav}
        open={Boolean(anchorElNav)}
        onClose={() => setAnchorEl(null)}
        keepMounted
        disableScrollLock
        marginThreshold={stickToScreen ? 16 : null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: theme.radius[2],
              padding: theme.boxSpacing(2),
              border: `1px solid ${theme.palette.gray[50]}`,
              width: "fit-content",
              minWidth: 150,
              maxWidth: 250,
              maxHeight: `calc(100vh - ${heightThreshold ?? 20}%)`,
              marginTop: "8px",
              ...scrollBarStyle(theme),
              "& ul": {
                display: "flex",
                flexDirection: "column",
              },
              ...style,
            },
          },
          list: { disablePadding: true },
        }}
        sx={{
          alignItems: "center",
          padding: theme.boxSpacing(2, 0),
        }}>
        {children}
      </Menu>
    );
  },
);

interface MenuListProps<T extends IMenuItem> extends RenderListProps<T> {
  listName?: ListType;
  menuRef: React.RefObject<MenuRef | null>;
  showSearchBar?: boolean;
  style?: {
    container?: GenericStyle;
    item?: GenericStyle;
    searchBar?: GenericStyle;
  };
}
export const DisplayList = <T extends IMenuItem>({
  list,
  listName = ListType.DEFAULT,
  usePage: hook,
  onItemClick,
  style,
  showActiveItem,
  menuRef,
  activeItem,
  showSearchBar = false,
  stickToScreen,
  heightThreshold,
}: MenuListProps<T> & MenuProps) => {
  const theme = useTheme();
  const [filteredList, setFilteredList] = useState<T[]>(list);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync state when props change
  useEffect(() => {
    setFilteredList(list);
  }, [list]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const query = e.target.value.toLowerCase();
      setSearchQuery(query);
      if (!query) {
        setFilteredList(list);
        return;
      }
      const filtered = list.filter((item) =>
        Object.values(item).some(
          (val) => typeof val === "string" && val.toLowerCase().includes(query),
        ),
      );
      setFilteredList(filtered);
    },
    [list],
  );

  // Derived States
  const isSourceEmpty = list.length === 0;
  const isSearchEmpty = searchQuery.length > 0 && filteredList.length === 0;

  // Get the correct message based on state
  const feedback = () => {
    if (isSourceEmpty) return LISTS().MESSAGES[listName].empty;
    if (isSearchEmpty) return LISTS().MESSAGES[listName].noMatch;
    return null;
  };

  // Default styles for nav menus
  const itemStyle: GenericStyle = {
    padding: theme.boxSpacing(4, 6),
    gap: theme.gap(8),
    textAlign: "left",
    width: "100%",
    "& svg": {
      width: "20px",
      height: "20px",
      flex: "none",
    },
    ...style?.item,
  };

  return (
    <MenuPopup
      ref={menuRef}
      stickToScreen={stickToScreen}
      heightThreshold={heightThreshold}
      style={style?.container}>
      {showSearchBar && !isSourceEmpty && (
        <SearchBar
          onChange={handleChange}
          placeholder="Search"
          style={{
            width: "100%",
            borderRadius: 0,
            height: 42,
            position: "sticky",
            top: 0,
            zIndex: 2,
            background: theme.palette.gray[0],
            padding: theme.boxSpacing(6),
            border: "none",
            borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
            "&:hover": {
              border: "inherit",
              borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
            },
            // "&:focus": {
            //   borderBottom: `1px solid ${theme.palette.gray[100]}`,
            // },
            "& svg": { width: "16px", height: "16px" },
            ...style?.searchBar,
          }}
        />
      )}
      {feedback() ? (
        <Box
          sx={{ width: "100%", p: theme.boxSpacing(4), textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "inherit" }}>
            {feedback()}
            {isSearchEmpty && (
              <span style={{ display: "block", opacity: 0.7 }}>
                "{searchQuery}"
              </span>
            )}
          </Typography>
        </Box>
      ) : (
        <RenderItemList
          list={filteredList}
          onItemClick={(item) => {
            menuRef.current?.closeMenu();
            if (onItemClick) onItemClick(item);
          }}
          usePage={hook}
          style={itemStyle}
          showActiveItem={showActiveItem}
          activeItem={activeItem}
        />
      )}
    </MenuPopup>
  );
};
