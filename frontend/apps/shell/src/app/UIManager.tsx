"use client";

import React, { useEffect, useRef } from "react";
import { sharedRegistry, useGlobalContext } from "@funstakes/shared-state";
import { Drawer, DrawerRef, Modal, ModalRef, SnackBars, PageLoaderUI } from "@funstakes/shared-ui"
import { useMisc, usePage, useEvent } from "@funstakes/hooks";
import { usePathname } from "next/navigation";
import { registerSW, delay } from "@funstakes/helpers";
import { DefaultWrapper } from "./default/Wrapper";


export const UIManager = ({ children }: { children: React.ReactNode }) => {
    const { handleBrowserEvents } = useEvent();
    const drawerRef = useRef<DrawerRef>(null);
    const modalRef = useRef<ModalRef>(null);
    const { openDrawer, openModal, verifySignal } = useMisc();
    const { handleCurrentPage } = usePage()
    const { snackBarMsg, drawerContent, modalContent, isGlobalLoading, authStatus,
        networkStatus, setGlobalLoading, defaultWrapper } = useGlobalContext();
    const pathname = usePathname();

    const useAuth = sharedRegistry.hooks["useAuth"];
    const { verifyAuth } = useAuth();

    useEffect(() => {
        const init = async () => {
            try {
                registerSW();
                setGlobalLoading(true);
                await delay();
                // Initial check only
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
        networkStatus === "UNKNOWN";
    if (isInitializing) return <PageLoaderUI />;


    // Render the app UIs
    return (
        <>
            {defaultWrapper ? <DefaultWrapper> {children} </DefaultWrapper>
                : <>{children}</>}
            {snackBarMsg.messages && <SnackBars snackBarMsg={snackBarMsg} />}
            {drawerContent && <Drawer ref={drawerRef} {...drawerContent} />}
            {modalContent && <Modal ref={modalRef} {...modalContent} />}

        </>
    );
};
