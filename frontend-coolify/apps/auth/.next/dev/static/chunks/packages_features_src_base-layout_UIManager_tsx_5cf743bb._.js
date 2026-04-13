(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/packages/features/src/base-layout/UIManager.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UIManager",
    ()=>UIManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/shared-ui/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$Drawer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-ui/src/Drawer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$Modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-ui/src/Modal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$SnackBars$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-ui/src/SnackBars.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$LoadingUIs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-ui/src/LoadingUIs.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$OfflinePromptUI$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-ui/src/OfflinePromptUI.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$NetworkGlitchUI$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-ui/src/NetworkGlitchUI.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/helpers/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$serviceWorker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/helpers/src/serviceWorker.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$misc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/helpers/src/misc.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/helpers/src/cache.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/helpers/src/storage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/packages/shared-state/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useEvents$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-state/hooks/useEvents.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$GlobalContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-state/GlobalContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useMisc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-state/hooks/useMisc.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useOffline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-state/hooks/useOffline.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$usePage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-state/hooks/usePage.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useSnackbar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/shared-state/hooks/useSnackbar.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$features$2f$src$2f$auth$2f$login$2f$useAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/features/src/auth/login/useAuth.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
const UIManager = ({ children, showOfflineUI = true, showNetworkErrorUI = true })=>{
    _s();
    const drawerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const modalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { openDrawer, openModal, verifySignal, isUnstableNetwork, isOffline } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useMisc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMisc"])();
    const { handleCurrentPage } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$usePage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePage"])();
    const { snackBarMsg, drawerContent, modalContent, isGlobalLoading, authStatus, networkStatus, setGlobalLoading, offlineMode, checkingSignal } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$GlobalContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGlobalContext"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const { verifyAuth } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$features$2f$src$2f$auth$2f$login$2f$useAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { setSBTimer, removeSBMessage } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useSnackbar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSnackbar"])();
    const { switchToOfflineMode } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useOffline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOffline"])();
    // Register events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useEvents$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEventListener"])(verifyAuth);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UIManager.useEffect": ()=>{
            const init = {
                "UIManager.useEffect.init": async ()=>{
                    try {
                        setGlobalLoading(true);
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$serviceWorker$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["registerSW"])();
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$misc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["delay"])();
                        await verifySignal();
                        await verifyAuth();
                    } finally{
                        setGlobalLoading(false);
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cleanupCache"])();
                    }
                }
            }["UIManager.useEffect.init"];
            init();
        }
    }["UIManager.useEffect"], []);
    // Drawer & Modal Open / Close
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UIManager.useEffect": ()=>{
            if (!drawerContent) drawerRef.current?.closeDrawer();
            if (!modalContent) modalRef.current?.closeModal();
            requestAnimationFrame({
                "UIManager.useEffect": ()=>{
                    if (drawerContent) drawerRef.current?.openDrawer();
                    if (modalContent) modalRef.current?.openModal();
                }
            }["UIManager.useEffect"]);
        }
    }["UIManager.useEffect"], [
        drawerContent,
        openDrawer,
        modalContent,
        openModal
    ]);
    // // Page Load Handler
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UIManager.useEffect": ()=>{
            handleCurrentPage();
        }
    }["UIManager.useEffect"], [
        pathname
    ]);
    // Page loader UI
    const isInitializing = isGlobalLoading || authStatus === "PENDING" || networkStatus === "UNKNOWN";
    if (isInitializing) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$LoadingUIs$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageLoaderUI"], {}, void 0, false, {
        fileName: "[project]/packages/features/src/base-layout/UIManager.tsx",
        lineNumber: 100,
        columnNumber: 30
    }, ("TURBOPACK compile-time value", void 0));
    const isLastLoggedOut = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$helpers$2f$src$2f$storage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getFromLocalStorage"])({
        key: "last_auth_status"
    }) === "UNAUTHENTICATED";
    // Handle Offline State
    const shouldShowOffline = showOfflineUI && isOffline && !offlineMode && !isLastLoggedOut;
    if (shouldShowOffline) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$OfflinePromptUI$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["OfflinePromptUI"], {
            handleOffline: switchToOfflineMode
        }, void 0, false, {
            fileName: "[project]/packages/features/src/base-layout/UIManager.tsx",
            lineNumber: 110,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Handle Network Stability or Auth Failures
    const hasNetworkGlitch = showNetworkErrorUI && isUnstableNetwork && !isOffline;
    const hasAuthError = authStatus === "ERROR";
    const isGuestOffline = isOffline && isLastLoggedOut;
    if (hasNetworkGlitch || hasAuthError || isGuestOffline) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$NetworkGlitchUI$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["NetworkGlitchUI"], {
            checkingSignal: checkingSignal,
            isUnstableNetwork: isUnstableNetwork
        }, void 0, false, {
            fileName: "[project]/packages/features/src/base-layout/UIManager.tsx",
            lineNumber: 120,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Render the app UIs
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            children,
            snackBarMsg.messages && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$SnackBars$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SnackBars"], {
                snackBarMsg: snackBarMsg,
                removeMessage: removeSBMessage,
                setSBTimer: setSBTimer
            }, void 0, false, {
                fileName: "[project]/packages/features/src/base-layout/UIManager.tsx",
                lineNumber: 132,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            drawerContent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$Drawer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Drawer"], {
                ref: drawerRef,
                ...drawerContent
            }, void 0, false, {
                fileName: "[project]/packages/features/src/base-layout/UIManager.tsx",
                lineNumber: 138,
                columnNumber: 25
            }, ("TURBOPACK compile-time value", void 0)),
            modalContent && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$ui$2f$src$2f$Modal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Modal"], {
                ref: modalRef,
                ...modalContent
            }, void 0, false, {
                fileName: "[project]/packages/features/src/base-layout/UIManager.tsx",
                lineNumber: 139,
                columnNumber: 24
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
_s(UIManager, "wutTyHWhX0tJ5GY/DY3fp6DocC4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useMisc$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMisc"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$usePage$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePage"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$GlobalContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useGlobalContext"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$features$2f$src$2f$auth$2f$login$2f$useAuth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useSnackbar$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSnackbar"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useOffline$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOffline"],
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$shared$2d$state$2f$hooks$2f$useEvents$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEventListener"]
    ];
});
_c = UIManager;
var _c;
__turbopack_context__.k.register(_c, "UIManager");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/features/src/base-layout/UIManager.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/packages/features/src/base-layout/UIManager.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=packages_features_src_base-layout_UIManager_tsx_5cf743bb._.js.map