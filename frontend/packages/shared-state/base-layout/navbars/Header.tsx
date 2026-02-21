"use client";

import { AppBar, Stack, IconButton } from "@mui/material";
import Image from "next/image";
import { Bell } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { DesktopNav, MobileNav } from "./Nav";
import { SearchContainer, UserAvatar, AnchorLink, AppButton } from "@repo/shared-ui";
import { useHeader } from "./useHeader";
import { clientRoutes, zIndexes } from "@repo/helpers";
import { img } from "@repo/assets"
import { useAnimation } from "../../hooks/useAnimation";

interface HeaderProps {
    scrollRef?: React.RefObject<HTMLElement | null>;
}

export const AppHeader: React.FC<HeaderProps> = ({ scrollRef }) => {
    const theme = useTheme();
    const { isLoggedIn, isDesktop, scrollDir, authStatus, menuRef,
        handleNotification, handleLogo, handleAvatar, navigateTo, authUser } = useHeader(scrollRef);

    return (
        <AppBar
            position="sticky"
            component="nav"
            sx={{
                zIndex: zIndexes[500],
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: theme.gap(4),
                backdropFilter: "blur(24px)",
                ...(!isDesktop && {
                    transform: scrollDir === "down" ? "translateY(-100%)" : "translateY(0)",
                    transition: "transform 0.3s ease-in-out",
                }),
            }}>

            {/* Logo */}
            <AnchorLink
                url={clientRoutes.home.path}
                onClick={handleLogo}
                style={{ display: "inline-flex" }}>
                <Image
                    src={img.logo}
                    alt="logo"
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: theme.radius.full,
                    }} />
            </AnchorLink>

            {/* Search */}
            {isDesktop && isLoggedIn && <SearchContainer animateBorder={useAnimation().animateBorder} />}

            {/* Right controls */}
            <Stack direction="row" alignItems="center" spacing={theme.gap(6)}>
                {isLoggedIn && (
                    <>
                        {/* Notification */}
                        <IconButton
                            onClick={handleNotification}
                            href={clientRoutes.notifications.path}
                            sx={{
                                width: 36,
                                height: 36,
                                padding: theme.boxSpacing(4),
                                border: `1px solid ${theme.palette.gray.trans[1]}`,
                            }} >
                            <Bell style={{ width: "100%", stroke: theme.palette.primary.dark }} />
                        </IconButton>

                        {/* User Avatar  */}
                        {isDesktop && <DesktopNav menuRef={menuRef} />}
                        <UserAvatar
                            userInfo={authUser}
                            toolTipValue="Open menu"
                            style={{
                                width: "34px", height: "34px",
                                marginLeft: "unset!important",
                                [theme.breakpoints.down("md")]: { width: "28px", height: "28px" },
                            }}
                            action={(event: React.MouseEvent<HTMLElement>) =>
                                handleAvatar({
                                    desktop: event,
                                    mobile: {
                                        header: < UserAvatar userInfo={authUser}
                                            style={{ width: "35px", height: "35px" }} />,
                                        content: < MobileNav />
                                    },
                                })} />
                    </>
                )}

                {/* Login Button */}
                {authStatus === "UNAUTHENTICATED" && (
                    <AppButton
                        href={clientRoutes.login.path}
                        variant="outlined"
                        style={{ fontSize: "14px" }}
                        onClick={() => navigateTo(clientRoutes.login,
                            {
                                type: "element", savePage: false, loadPage: true
                            })}>
                        Sign in
                    </AppButton>
                )}
            </Stack>
        </AppBar>
    );
};