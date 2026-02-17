const STATIC_CACHE = "funstakes-static-v9";
const API_CACHE = "funstakes-api-v9";

self.addEventListener("install", (event) => {
self.skipWaiting();
});

self.addEventListener("activate", (event) => {
event.waitUntil(
caches
.keys()
.then((keys) =>
Promise.all(
keys
.filter((k) => ![STATIC_CACHE, API_CACHE].includes(k))
.map((k) => caches.delete(k))
)
)
);
self.clients.claim();
});

self.addEventListener("fetch", (event) => {
const { request } = event;
const url = new URL(request.url);

if (request.method !== "GET") return;

/_ NEVER CACHE AUTH _/
if (url.pathname.startsWith("/api/auth")) return;

/_ NEXT STATIC ASSETS _/
if (url.pathname.startsWith("/\_next/static")) {
event.respondWith(cacheFirst(request, STATIC_CACHE));
return;
}

/_ STATIC WEB PAGES _/
if (url.pathname === "/" || url.pathname.startsWith("/web")) {
event.respondWith(cacheFirst(request, STATIC_CACHE));
return;
}

/_ TIMELINE PAGES _/
if (url.pathname.startsWith("/timeline")) {
event.respondWith(networkFirst(request, STATIC_CACHE));
return;
}

/_ API DATA _/
if (
url.pathname.startsWith("/api/posts") ||
url.pathname.startsWith("/api/users")
) {
event.respondWith(networkFirst(request, API_CACHE));
return;
}
});

/_ ---------- STRATEGIES ---------- _/

async function cacheFirst(request, cacheName) {
const cache = await caches.open(cacheName);
const cached = await cache.match(request);
if (cached) return cached;

const fresh = await fetch(request);
cache.put(request, fresh.clone());
return fresh;
}

async function networkFirst(request, cacheName) {
const cache = await caches.open(cacheName);
try {
const fresh = await fetch(request);
cache.put(request, fresh.clone());
return fresh;
} catch {
const cached = await cache.match(request);
if (cached) return cached;

    return new Response(JSON.stringify({ offline: true }), {
      headers: { "Content-Type": "application/json" },
    });

}
}
{/_ <AppButton
variant="outlined"
style={{
            fontSize: "13px",
            padding: theme.boxSpacing(1, 4),
            borderColor: theme.palette.gray[100],
          }}>
Profile
</AppButton> _/}

const handleKeyDown = (e: KeyboardEvent) => {
// Example: Trigger when 'n' is pressed (and user isn't typing in an input)
if (e.key === "n" && (e.target as HTMLElement).tagName !== "INPUT") {
openMobileUserNav(e);
}

      // OR Example: Cmd + K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openMobileUserNav(e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

const handleVisibility = () => {
if (document.visibilityState === "visible" && isOnline === true)
!isOnAuthRoute && verifyAuth();
};
// document.addEventListener("visibilitychange", handleVisibility);
// document.removeEventListener("visibilitychange", handleVisibility);

Lightmode
success: {
light: "#CBD3F1",
main: "#425BEF",
dark: "#161C3D",
},
error: {
light: "#CBD3F1",
main: red[400],
dark: "#1D0505",
},

Darkmode
success: {
light: "#10142C",
main: "#506AFF",
dark: "#BBC4E8", //7E92FF
},
error: {
light: "#10142C",
main: red[300],
dark: red[100],
},

// ─────────────────────────────
// 2️⃣ AUTH MODAL STATE REACTIONS
// ─────────────────────────────
useEffect(() => {
let intervalId: NodeJS.Timeout | null = null;
// AUTHENTICATED or not on app route close modal
if (
loginStatus === "AUTHENTICATED" ||
loginStatus === "UNKNOWN" ||
!isOnAppRoute
) {
closeModal();
return;
}
// Not allowed → redirect + exit
if (!isAllowedRoutes) {
router.replace(clientRoutes.about.path);
return;
}

    const showModal = () => {
      openModal({
        content: <AuthStepper />,
        onClose: () => closeModal(),
      });
    };
    // show once
    showModal();
    // repeat every 10 mins
    intervalId = setInterval(showModal, 60 * 1000 * 10);
    // single cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
    };

}, [
loginStatus,
isOnline(),
isOnAppRoute,
isAllowedRoutes,
router,
clientRoutes.path,
pathname,
]);

if (!existingVisitor) {
setCookie(
"existingVisitor",
(Math.random() _ 1e6).toFixed(0).toString(),
60 _ 24 \* 7
);
}

// const handleFocus = () => {
// !isOnAuthRoute && verifyAuth();
// };

// window.addEventListener("focus", handleFocus);

const CTA = () => {
const theme = useTheme();
return (
<Stack sx={{ gap: theme.gap(10) }}>
<Typography component="h6" variant="h6">
Join Funstakes Today
</Typography>
<Image
src={img.logo}
alt="logo"
style={{
          width: "100%",
          height: "150px",
          objectFit: "cover",
          borderRadius: `${theme.radius[2]}`,
          margin: theme.boxSpacing(2, 0),
        }}
/>
<Stack direction="row" sx={{ gap: theme.gap(6), width: "100%" }}>
<AppButton
variant="outlined"
style={{
            fontSize: "13px",
            padding: theme.boxSpacing(2, 4),
            borderColor: theme.palette.gray[100],
            width: "100%",
          }}>
Login
</AppButton>
<AppButton
variant="contained"
style={{
            fontSize: "13px",
            padding: theme.boxSpacing(2, 4),
            borderColor: theme.palette.gray[100],
            width: "100%",
          }}>
Sign Up
</AppButton>
</Stack>
</Stack>
);
};

// Renders a simple nav list
export const RenderSimpleList: React.FC<RenderListProps> = ({
list,
itemAction,
style = {},
}) => {
const { handleLinkClick } = useSharedHooks();

return (
<>
{list.map((item, index) => {
if (!item.title && item.element) {
// Render the "element" alone if there's no title (Divider, custom element, etc.)
return <React.Fragment key={index}>{item.element}</React.Fragment>;
}
return (
<ItemWrapper
key={index}
url={item.url ?? "#"}
onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
const page = {
title: item.title,
path: item.url ?? "#",
};
handleLinkClick(e, page as SavedPage);

              if (item.action) item.action();
              if (itemAction) itemAction();
            }}
            role="link"
            tabIndex={0}
            sx={{
              ...style,
            }}>
            {item.element}
            {item.title && (
              <Typography variant="button">{item.title}</Typography>
            )}
          </ItemWrapper>
        );
      })}
    </>

);
};

// animation: isOpen
// ? `${moveIn({
              //     dir: entryDir,
              //     from: "-0px",
              //     to: "4px",
              //   })} 0.2s linear forwards`
// : `${moveOut({
              //     dir: entryDir,
              //     from: "4px",
              //     to: "-10px",
              //   })} 0.2s linear forwards`,

{/_ {isTimed && (
<Box
sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  height: 2,
                  animation: progressWidthAnim,
                  backgroundColor:
                    msg.msgStatus === "SUCCESS"
                      ? theme.palette.success.main
                      : msg.msgStatus === "INFO"
                      ? theme.palette.info.main
                      : theme.palette.error.main,
                }}
/>
)} _/}

// const progressWidthAnim = `${shrinkWidth} ${progressDur}s linear forwards`;

const isTimed = msg.behavior === "TIMED";
const isOpen = !!msg.id;
//Set the snackbar timer
setSBTimer();

        const progressDur = msg.duration
          ? msg.duration
          : snackBarMsg.defaultDur;


           // const boxAnimation =
        //   progressDur > 0
        //     ? `${fadeIn} 0.2s linear forwards, ${moveIn({
        //       dir: entryDir,
        //       to: "10px",
        //     })} 0.2s linear forwards`
        //     : `${fadeOut} 0.2s linear forwards, ${moveOut({
        //       dir: entryDir,
        //     })} 0.2s linear forwards`;

export const ScrollableContainer = styled(Stack)(({ theme }) =>
theme.unstable_sx({
overflowY: "auto",
height: "100%",
[theme.breakpoints.down("md")]: {
height: "fit-content",
width: "100%",
overflowY: "unset",
minWidth: "200px",
},
"&::-webkit-scrollbar": {
width: "0px",
},
})
);

const flaggedAppRoutes = flaggedRoutes.app.filter((route) =>
matchPaths(pathname, route)
);
const isAllowedRoutes =
flaggedRoutes.auth.includes(pathname) ||
flaggedRoutes.web.some((r) => matchPaths(pathname, r)) ||
flaggedAppRoutes.length > 0;
const isOnAppRoute = flaggedAppRoutes.length > 0;

// 1. Wait for Service Worker to be fully active and controlling the page
// if ('serviceWorker' in navigator &&
// navigator.serviceWorker.controller === null) {
// await new Promise((resolve) => {
// navigator
// .serviceWorker
// .addEventListener('controllerchange', resolve, { once: true });
// // Timeout fallback so we don't hang forever
// setTimeout(resolve, 1000);
// });
// }

      // // 2️⃣ SILENT RETRY (Cold Boot Only)
      // // We only trigger this if the fetcher explicitly returned UNAUTHORIZED
      // // and it's our first attempt in the hook.
      // if (res.status === "UNAUTHORIZED" && retryCount === 0 && isOnline) {
      //   console.warn("Attempt 1 failed. Waiting for browser cookie sync...");
      //   await delay(500);
      //   return verifyAuth(1);
      // }

const handlePageLoad = async () => {
const isSyncing = sessionStorage.getItem("auth_syncing");
const isMobile = window.innerWidth < 900;
const wasLoggedIn = getCookie("was_logged_in"); // Our persistent memory

    // If user is a guest (no canary AND no memory), do nothing.
    if (!wasLoggedIn) {
      return;
    }

    //  await delay(300);
    const canary = getCookie("logged_in");
    // If canary is missing on mobile
    if (!canary && wasLoggedIn && isMobile) {
      // Check if we already tried reloading once
      if (isSyncing) {
        console.log("Sync attempted, but no session found. Stopping.");
        sessionStorage.removeItem("auth_syncing");
        setGlobalLoading(false);
        return; // Break the loop
      }
      // First attempt: Set the flag and reload
      setGlobalLoading(true);
      sessionStorage.setItem("auth_syncing", "true");
      // Give the browser 100ms to ensure storage is set before reload

      setTimeout(() => {
        window.location.reload();
      }, 100);
      return;
    }
    // If canary IS found, clear the syncing flag for next time
    // if (canary && isSyncing) {
    //   sessionStorage.removeItem("auth_syncing");
    // }

};

<Box sx={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "300px",
            backgroundColor: theme.fixedColors.gray50,
            width: "100%",
            "&::before": {
                content: '""',
                position: "absolute",
                top: "-10%", left: "-10%", width: "120%", height: "120%",
                background: gradient,
                filter: "blur(60px)",
                opacity: 0.6,
                zIndex: 0,
            }
        }}>

        // In your JSX

{isPortrait !== null && (
<Image ... />
)}

// let msg = err.message;

    // if (err === "timeout" || err.message?.includes("timeout")) {
    //   console.log("Just woke up");
    //   if (retryCount < MAX_RETRIES) {
    //     // Add a small delay (200ms) to let the browser's network stack "warm up"
    //     await new Promise((resolve) => setTimeout(resolve, 200));
    //     return await fetchUserWithTokenCheck(retryCount + 1);
    //   }

    //   return {
    //     payload: null,
    //     status: "ERROR",
    //     message: "Request timed out after multiple attempts",
    //   };
    // }

// Drag event on Y axis
{...(dragToClose && isMobile && axis === "y" && {
...handlers
})}
cursor: dragToClose ? "grab" : "default"

// Try to load from IndexedDB first for instant UI
const cachedPosts = await getCachedPosts();
if (cachedPosts) {
setPosts(cachedPosts);
console.log("Hello")
}

if (!window.location.pathname.includes("/offline")) {
setIsFirstVisit(true);
}

}, [networkStatus]);

return isFirstVisit ? (
<Empty
headline="You are offline"
tagline="On you first visit to this page you need to be online."
icon={<FileXCorner />}
primaryCta={{
        type: "BUTTON",
        variant: "outlined",
        label: "Back home",
        action: () => navigateTo(clientRoutes.home,
          { type: "element", loadPage: true }),
      }}
style={{
        container: {
          height: "100%",
          backgroundColor: "none",
        },
        tagline: { fontSize: "15px" },
        icon: {
          width: "50px",
          height: "50px",
          [theme.breakpoints.down("md")]: {
            width: "40px",
            height: "40px",
          },
          svg: {
            fill: "none",
            stroke: theme.palette.gray[200],
            strokeWidth: "1.5px",
          },
        },
      }}
/>

name: Sync dev into main

on:
pull_request:
branches: [main]
types: [closed]

jobs:
sync-dev:
if: >
github.event.pull_request.merged == true &&
github.event.pull_request.base.ref == 'main' &&
github.event.pull_request.head.ref == 'dev'
runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Sync dev to main
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          git fetch origin
          git checkout dev
          git reset --hard origin/main
          git push origin dev --force-with-lease
