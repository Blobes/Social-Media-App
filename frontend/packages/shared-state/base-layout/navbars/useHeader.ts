import { useRef, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "../../GlobalContext";
import { useMisc } from "../../hooks/useMisc";
import { clientRoutes, dragToCloseConfig } from "@repo/helpers";
import { MenuRef } from "@repo/shared-ui";
import { usePage } from "../../hooks/usePage";
import { usePageScroll } from "../../hooks/usePageScroll";
import { useDragClose } from "../../hooks/useDrag";

export const useHeader = (scrollRef?: React.RefObject<HTMLElement | null>) => {
  const { authStatus, authUser } = useGlobalContext();
  const { openDrawer, closeDrawer, isDesktop, handleWindowResize } = useMisc();
  const { setLastPage, navigateTo } = usePage();
  const { handlePageScroll } = usePageScroll();
  const theme = useTheme();
  const router = useRouter();

  const menuRef = useRef<MenuRef>(null);
  const scrollDir = handlePageScroll(scrollRef);
  const isLoggedIn = authStatus === "AUTHENTICATED";

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, [handleWindowResize]);

  const handleNotification = (e: React.MouseEvent) => {
    e.preventDefault();
    setLastPage(clientRoutes.notifications);
    router.push(clientRoutes.notifications.path);
  };

  const handleLogo = () => {
    navigateTo(clientRoutes.home);
  };

  interface AvartarParams {
    desktop: React.MouseEvent<HTMLElement>;
    mobile: { header: React.ReactNode; content: React.ReactNode };
  }
  const handleAvatar = (element: AvartarParams) => {
    if (isDesktop) {
      menuRef.current?.openMenu(element.desktop.currentTarget);
    } else {
      openMobileNav(element);
    }
  };

  const openMobileNav = (element: AvartarParams) => {
    openDrawer({
      ...element.mobile,
      source: "navbar",
      onClose: closeDrawer,
      useDragConfig: () => useDragClose(dragToCloseConfig()),
      style: {
        base: {
          overlay: { padding: theme.boxSpacing(6), display: "none" },
          content: { height: "100%", borderRadius: "0px" },
        },
        smallScreen: {
          overlay: { padding: theme.boxSpacing(0), display: "flex" },
        },
        header: {
          justifyContent: "space-between",
          padding: theme.boxSpacing(5, 8),
        },
      },
    });
  };

  return {
    isLoggedIn,
    isDesktop,
    scrollDir,
    authStatus,
    menuRef,
    handleNotification,
    handleLogo,
    handleAvatar,
    openMobileNav, // Exported if needed by the UI to inject components
    navigateTo,
    authUser,
  };
};
