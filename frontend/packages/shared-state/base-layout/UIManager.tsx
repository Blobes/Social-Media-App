"use client";

import { useEffect, useRef } from "react";
import { useGlobalContext } from "../GlobalContext";
import { registeredRoutes } from "@repo/helpers";
import { Drawer, DrawerRef, Modal, ModalRef, SnackBars, PageLoaderUI } from "@repo/shared-ui"
import { useMisc } from "../hooks/useMisc";
import { usePage } from "../hooks/usePage";
import { useEvent } from "../hooks/useEvents";
import { useSnackbar } from "../hooks/useSnackbar";
import { useAuth } from "@repo/auth/shared";
import { usePathname } from "next/navigation";
import { registerSW, delay } from "@repo/helpers";
import { DefaultWrapper } from "./Wrapper";

interface ManagerProps {
    children: React.ReactNode;
    hideHeader?: boolean;
    hideWrapper?: boolean;
}


export const UIManager = ({ children, hideHeader = false, hideWrapper = false }: ManagerProps) => {
    const { handleBrowserEvents } = useEvent();
    const drawerRef = useRef<DrawerRef>(null);
    const modalRef = useRef<ModalRef>(null);
    const { openDrawer, openModal, verifySignal } = useMisc();
    const { handleCurrentPage } = usePage();
    const { snackBarMsg, drawerContent, modalContent, isGlobalLoading, authStatus,
        networkStatus, setGlobalLoading } = useGlobalContext();
    const pathname = usePathname();
    const { verifyAuth } = useAuth()
    const { setSBTimer, removeSBMessage } = useSnackbar();

    useEffect(() => {
        const init = async () => {
            try {
                setGlobalLoading(true);
                registerSW();
                await delay();
                await verifySignal();
                await verifyAuth();
            } finally {
                setGlobalLoading(false);
            }
        };
        init();
    }, []);

    // Drawer & Modal Open / Close
    useEffect(() => {
        if (!drawerContent) drawerRef.current?.closeDrawer();
        if (!modalContent) modalRef.current?.closeModal()

        requestAnimationFrame(() => {
            if (drawerContent) drawerRef.current?.openDrawer();
            if (modalContent) modalRef.current?.openModal()
        });
    }, [drawerContent, openDrawer, modalContent, openModal]);

    // // Page Load Handler
    useEffect(() => {
        handleCurrentPage();
        handleBrowserEvents();
    }, [pathname]);


    // Page loader UI
    const isInitializing =
        isGlobalLoading ||
        authStatus === "PENDING" ||
        networkStatus === "UNKNOWN"
    if (isInitializing) return <PageLoaderUI />;


    const noWrapperPaths = [...registeredRoutes.auth, ...registeredRoutes.web];
    const showWrapper = !noWrapperPaths.includes(pathname);
    // Render the app UIs
    return (
        <>
            {!hideWrapper ? <DefaultWrapper hideHeader={hideHeader}> {children} </DefaultWrapper>
                : <>{children}</>}
            {snackBarMsg.messages && <SnackBars snackBarMsg={snackBarMsg}
                removeMessage={removeSBMessage} setSBTimer={setSBTimer} />}
            {drawerContent && <Drawer ref={drawerRef} {...drawerContent} />}
            {modalContent && <Modal ref={modalRef} {...modalContent} />}

        </>
    );
};
