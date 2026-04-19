/\*export const usePostLike = <T extends LikablePost>(
post: T,
onLikeApi: (id: string, nextState: boolean) => Promise<any>,
context: UsePostLikeContext,
) => {
const {
getPendingLike,
setPendingLike,
clearPendingLike,
authStatus,
setModalContent,
isOffline,
isUnstableNetwork,
setSBMessage,
mode,
LoginPrompt: LoginStepper,
} = context;

const [postData, setPostData] = useState<T>(post);
const [isLiking, setIsLiking] = useState(false);

// LOGIC REFS
const clickGate = useRef(false); // UI Throttle: Prevents numerous clicking during server update
const stateVersion = useRef(0); // Version Tracking: Detects if UI state changed during API call

const { \_id } = postData;

// Sync localStorage on mount
useEffect(() => {
const pendingLike = getPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, \_id);
if (pendingLike !== null && pendingLike !== post.likedByMe) {
setPostData((prev) => ({
...prev,
likedByMe: pendingLike,
likeCount: prev.likeCount + (pendingLike ? 1 : -1),
}));
}
}, [_id, getPendingLike, post.likedByMe]);

const handleLike = useCallback(async () => {
if (clickGate.current) return;

    // GUARDS
    if (authStatus === "UNAUTHENTICATED") {
      setModalContent({ content: LoginStepper });
      return;
    }

    if (isOffline || isUnstableNetwork || mode === "OFFLINE") {
      setSBMessage({
        msg: {
          content:
            mode === "OFFLINE" ? "Post is offline." : "Connection unstable.",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      return;
    }

    const nextLiked = !postData.likedByMe;

    // --- STEP 1: INSTANT UI TOGGLE ---

    setIsLiking(true);

    setPostData((prev) => {
      setPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id, nextLiked);
      return {
        ...prev,
        likedByMe: nextLiked,
        likeCount: prev.likeCount + (nextLiked ? 1 : -1),
      };
    });

    if (nextLiked) vibrate();

    stateVersion.current += 1; // Increment version for every valid UI change
    const localVersion = stateVersion.current;

    try {
      clickGate.current = true; // Lock the UI

      // setTimeout(() => {
      //   clickGate.current = false;
      // }, 1000);

      const payload = await onLikeApi(_id, nextLiked);

      if (payload) {
        setPostData((prev) => {
          if (stateVersion.current !== localVersion) return prev;
          return {
            ...prev,
            likeCount: payload.likeCount,
            likedByMe: payload.likedByMe,
          };
        });
        clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
      }
    } catch (error) {
      setPostData((prev) => prev);
      clearPendingLike(QUEUE_KEYS.POST.PENDING_LIKES, _id);
      console.error("Sync failed:", error);
    } finally {
      clickGate.current = false;
      setIsLiking(false);
    }

}, [
_id,
authStatus,
postData.likedByMe,
isOffline,
isUnstableNetwork,
mode,
onLikeApi,
setPendingLike,
clearPendingLike,
setSBMessage,
setModalContent,
LoginStepper,
]);

// Background sync effect...
useEffect(() => {
if (authStatus === "AUTHENTICATED") {
processQueue(authStatus, QUEUE_KEYS.POST.LIKE, onLikeApi);
const handleOnline = () =>
processQueue(authStatus, QUEUE_KEYS.POST.LIKE, onLikeApi);
window.addEventListener("online", handleOnline);
return () => window.removeEventListener("online", handleOnline);
}
}, [authStatus, onLikeApi]);

return { postData, isLiking, handleLike };
};\*/

// setTimeout(() => {
// clickGate.current = false;
// }, 1000);

    // // Network Erorr / Offline
      // if (res.status === "ERROR") {
      //   setAuthUser(null);
      //   setAuthStatus("ERROR");
      //   if (res.message)
      //     setSBMessage({
      //       msg: { content: res.message, msgStatus: "ERROR", hasClose: true },
      //     });
      //   return;
      // }

      // // Unauthorized State
      // if (res.status === "UNAUTHORIZED") {
      //   setAuthUser(null);
      //   setAuthStatus("UNAUTHENTICATED");
      //   return;
      // }

"use client";

import React, { useEffect, useState } from "react";
import { SplashUI } from "@repo/shared-ui";
//import dynamic from "next/dynamic";
import { UIManagerProps, GlobalUIManager } from "./GlobalUIManager";

// const UIManager = dynamic(
// () => import("./UIManager").then((mod) => mod.UIManager),
// {
// ssr: false,
// loading: () => <SplashUI />,
// },
// );

export const ClientOnly = ({
children,
showOfflineUI,
showNetworkErrorUI,
}: UIManagerProps) => {
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
setIsMounted(true);
}, []);

// If we aren't on the client yet, show the splash
if (!isMounted) return <SplashUI />;

return (
<GlobalUIManager
      showOfflineUI={showOfflineUI}
      showNetworkErrorUI={showNetworkErrorUI}>
{children}
</GlobalUIManager>
);
};

// import React, { useEffect, useState } from "react";
// import { SplashUI } from "@repo/shared-ui";
// import { UIManager } from "./UIManager"; // Import normally, no dynamic()

// export const ClientOnly = ({ children, ...props }: any) => {
// const [isMounted, setIsMounted] = useState(false);

// useEffect(() => {
// setIsMounted(true);
// }, []);

// // If we aren't on the client yet, show the splash
// if (!isMounted) return <SplashUI />;

// return <UIManager {...props}>{children}</UIManager>;
// };

"use client";

import { useState, useCallback, useEffect } from "react";
import { IGist, SERVER_API } from "@repo/core";
import { vibrate, processQueue } from "@repo/helpers";

export const useGistLike = (gist: IGist, context: any) => {
// Destructure everything internally for clarity
const {
handleGistLike,
getPendingLike,
setPendingLike,
clearPendingLike,
authStatus,
setModalContent,
isOffline,
isUnstableNetwork,
setSBMessage,
mode,
LoginStepper,
} = context;
const [gistData, setGistData] = useState<IGist>(gist);
const [isLiking, setIsLiking] = useState(false);

const { \_id, likedByMe } = gistData;

// Sync like with localStorage on mount
useEffect(() => {
const pendingLike = getPendingLike(\_id);
if (pendingLike !== null && pendingLike !== likedByMe) {
setGistData((prev) => ({
...prev,
likedByMe: pendingLike,
likeCount: prev.likeCount + (pendingLike ? 1 : -1),
}));
}
}, [_id, getPendingLike, likedByMe]);

const handleLike = useCallback(async () => {
if (isLiking) return;

    if (authStatus === "UNAUTHENTICATED") {
      setModalContent({ content: LoginStepper });
      return;
    }
    if (isOffline || isUnstableNetwork || mode === "OFFLINE") {
      setSBMessage({
        msg: {
          content:
            mode === "OFFLINE"
              ? "You can't engage an offline post."
              : "Something went wrong.",
          msgStatus: "ERROR",
          hasClose: true,
        },
        override: true,
      });
      return;
    }

    setIsLiking(true);

    // Optimistic update
    setGistData((prev) => {
      const nextLiked = !prev.likedByMe;
      const nextCount = prev.likeCount + (nextLiked ? 1 : -1);
      // persist pending like
      setPendingLike(_id, nextLiked);
      return { ...prev, likedByMe: nextLiked, likeCount: nextCount };
    });

    if (!likedByMe) vibrate(); // Vibrate on like

    try {
      const payload = await handleGistLike(_id, !likedByMe);
      if (payload) {
        setGistData((prev) => ({
          ...prev,
          likedByMe: payload.likedByMe,
          likeCount: payload.likeCount,
        }));
        clearPendingLike(_id);
      }
    } catch {
      clearPendingLike(_id);
      // Optional: Rollback state on hard error
    } finally {
      setIsLiking(false);
    }

}, [
_id,
likedByMe,
authStatus,
isOffline,
isUnstableNetwork,
handleGistLike,
setPendingLike,
clearPendingLike,
setSBMessage,
setModalContent,
LoginStepper,
]);

// Background syncing
useEffect(() => {
if (authStatus === "AUTHENTICATED") {
// Initial sync on login/boot
processQueue(authStatus, SERVER_API);

      // Sync when coming back online
      const handleOnline = () => processQueue(authStatus, SERVER_API);
      window.addEventListener("online", handleOnline);

      return () => window.removeEventListener("online", handleOnline);
    }

}, [authStatus]);

return { gistData, isLiking, handleLike };
};

"use client";

import React, { useState } from "react";
import { Typography, Box } from "@mui/material";
import { motion, LayoutGroup } from "framer-motion";
import { AppButton } from "@repo/shared-ui";
import { GenericStyle } from "@repo/core";

interface CaptionProps {
caption: string;
limit?: number;
style?: GenericStyle;
}

export const PostCaption = ({ caption, limit = 150, style }: CaptionProps) => {
const [isExpanded, setIsExpanded] = useState(false);

const isTrimmable = caption.length > limit;

const toggleExpand = (e: React.MouseEvent) => {
e.stopPropagation();
setIsExpanded(!isExpanded);
};

if (!caption) return null;

return (
<Box
sx={{
        width: "100%",
        ...style,
      }}>
<LayoutGroup>
<Typography
variant="body2"
component={motion.p} // Animated paragraph
layout
sx={{
            color: "text.primary",
            lineHeight: 1.6,
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            display: "inline", // Core fix for inline flow
          }}>
{/_ Base Text _/}
<motion.span layout>
{!isExpanded && isTrimmable
? `${caption.substring(0, limit)}...`
: caption}
</motion.span>

          {/* Inline Action Button */}
          {isTrimmable && (
            <motion.span
              layout
              style={{ display: "inline-block", marginLeft: "4px" }}>
              <AppButton
                onClick={toggleExpand}
                style={{
                  p: 0,
                  minWidth: "auto",
                  fontSize: "inherit", // Matches Typography size exactly
                  fontFamily: "inherit",
                  textTransform: "none",
                  fontWeight: 700,
                  color: "primary.main",
                  verticalAlign: "baseline", // Aligns with text bottom
                  "&:hover": {
                    bgcolor: "transparent",
                    textDecoration: "underline",
                  },
                }}>
                {isExpanded ? "Show less" : "Show more"}
              </AppButton>
            </motion.span>
          )}
        </Typography>
      </LayoutGroup>
    </Box>

);
};

"use client";

import { useCallback, useState } from "react";
import { useGlobalContext, useSnackbar } from "@repo/shared-hooks";
import { FollowResponse, UserService } from "./service";
import { IUser } from "@repo/core";
import { delay } from "@repo/helpers";

export const useUser = () => {
const { fetchUser, fetchFollowers, followUser } = UserService();
const { setSBMessage } = useSnackbar();
const { setAuthUser } = useGlobalContext();

const [updatedUser, setUpdatedUser] = useState<FollowResponse>();
const [isLoading, setLoading] = useState(false);
const [followers, setFollowers] = useState<IUser[]>([]);
const [message, setMessage] = useState<string | null>(null);

const getUser = useCallback(
async (userId: string) => {
return await fetchUser(userId);
},
[fetchUser],
);

const getFollowers = useCallback(
async (userId: string) => {
if (!userId) return;
try {
setLoading(true);
setMessage(null);

        const res = await fetchFollowers(userId);

        if (res.status === "SUCCESS" && res.payload) {
          setFollowers(res.payload);
          setMessage(res.message);
        } else {
          setMessage(res.message || "Failed to load followers");
        }
        return res;
      } catch (error: any) {
        setMessage(error.message || "Something went wrong.");
      } finally {
        await delay();
        setLoading(false);
      }
    },
    [fetchFollowers],

);

const handleFollow = useCallback(
async (initialUser: IUser) => {
if (isLoading || !initialUser.\_id) return;
setLoading(true);
try {
const res = await followUser(initialUser.\_id);
setSBMessage({
msg: {
content: res.message,
msgStatus: res.status,
},
});

        if (res.status === "SUCCESS" && res.payload) {
          setAuthUser(res.payload.currentUser);
          setUpdatedUser(res.payload.targetUser);
        }
        return res;
      } finally {
        setLoading(false);
      }
    },
    [followUser, isLoading, setSBMessage, setAuthUser],

);

return {
handleFollow,
getFollowers,
getUser,
updatedUser,
isLoading,
followers,
message,
};
};

// export const apiClient = async <T>(
// endpoint: string,
// options: RequestInit = {},
// timeout = DEFAULT_TIMEOUT,
// ): Promise<T> => {
// const controller = new AbortController();
// const signal = options.signal || controller.signal;
// const timeoutId = setTimeout(() => controller.abort("timeout"), timeout);

// try {
// const headers = {
// "Content-Type": "application/json",
// ...options.headers,
// };

// const response = await fetch(`${BASE_URL}${endpoint}`, {
// ...options,
// method: options.method || "GET",
// headers,
// signal,
// credentials: "include",
// cache: "no-store",
// });

// clearTimeout(timeoutId);

// if (!response.ok) {
// let message = "Something went wrong";
// let status = "ERROR"; // The custom string (e.g., "UNAUTHORIZED")

// try {
// const errorData = await response.json();
// message = errorData?.message ?? message;
// status = errorData?.status ?? "ERROR";
// } catch {
// message =
// response.statusText || `Request failed with ${response.status}`;
// }

// const error = new Error(message) as any;
// error.httpStatus = response.status; // Always a Number (e.g., 401)
// error.status = status; // Always a String (e.g., "UNAUTHORIZED")
// throw error;
// }

// const data = await response.json();
// return {
// ...data, // This includes your "status": "DEACTIVATED" string
// httpStatus: response.status, // This is the 200 numeric code
// } as T;
// } catch (error: any) {
// clearTimeout(timeoutId);
// // AbortError name is standard; when abort("timeout") is used,
// // some envs set message to "timeout" but not name
// const isAbortOrTimeout =
// error?.name === "AbortError" || error?.message === "timeout";
// if (isAbortOrTimeout) {
// const timeoutErr = new Error("Connection timed out or failed.");
// (timeoutErr as any).status = 0;
// throw timeoutErr;
// }
// if (error.message === "Failed to fetch" || error instanceof TypeError) {
// error.status = 0;
// throw error;
// }
// // Ensure every thrown error has a status so callers can branch (e.g. 401 vs network)
// if (typeof (error as any).status !== "number") {
// (error as any).status = 0;
// }
// throw error;
// }
// };

// export const checkNetworkError = (err: any) => {
// const status = typeof err?.status === "number" ? err.status : undefined;
// const isNetworkError =
// status === undefined ||
// status === 0 ||
// status >= 500 ||
// err.name === "AbortError" ||
// err.name === "TypeError" ||
// err.message === "Failed to fetch" ||
// err.message === "Connection timed out or failed.";

// if (isNetworkError) {
// return {
// payload: null,
// status: "ERROR" as FetchStatus,
// message: "Network connection failed",
// };
// }
// return null;
// };
