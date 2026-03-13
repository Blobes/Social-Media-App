"use client";

import { IPage } from "@repo/types";

const baseUrl = (port: number = 3001) => {
const isDev = process.env.NODE_ENV === "development";
return isDev ? `http://localhost:${port}` : "https://funstakes.vercel.app";
};

const mainBaseUrl = baseUrl();
const authBaseUrl = baseUrl(3002);
const webBaseUrl = baseUrl(3006);
const profileBaseUrl = baseUrl(3004);

export const clientRoutes: Record<string, IPage> = {
// Web
about: { title: "About", path: `${webBaseUrl}/about` },
pricing: { title: "Pricing", path: `${webBaseUrl}/pricing` },
blogs: { title: "Blogs", path: `${webBaseUrl}/blogs` },
support: { title: "Support", path: `${webBaseUrl}/support` },
privacy: { title: "Privacy", path: `${webBaseUrl}/privacy` },
terms: { title: "Terms", path: `${webBaseUrl}/terms` },
news: { title: "News", path: `${webBaseUrl}/news` },

// Auth
login: { title: "Login", path: `${authBaseUrl}/login` },
signup: { title: "Signup", path: `${authBaseUrl}/signup` },

// App
home: { title: "Home", path: `${mainBaseUrl}/` },
profile: { title: "Profile", path: `${profileBaseUrl}/profile` },
bookmarks: { title: "Bookmarks", path: `${profileBaseUrl}/bookmarks` },
stakes: { title: "Stakes", path: `${baseUrl(3005)}/stakes` },
explore: { title: "Explore", path: `${mainBaseUrl}/explore` },
inbox: { title: "Inbox", path: `${mainBaseUrl}/inbox` },
settings: { title: "Settings", path: `${mainBaseUrl}/settings` },
gist: { title: "Gist", path: `${baseUrl(3003)}/gist` },
notifications: { title: "Notifications", path: "/notifications" },
wallet: { title: "Wallet", path: `${mainBaseUrl}/wallet` },
vibes: { title: "Vibes", path: `${mainBaseUrl}/vibes` },
voices: { title: "Voices", path: `${mainBaseUrl}/voices` },

// Offline
offline: { title: "Home", path: `${mainBaseUrl}/offline` },
} as const;

export const registeredRoutes = {
auth: [clientRoutes.login.path, clientRoutes.signup.path],
web: [
clientRoutes.about.path,
clientRoutes.pricing.path,
clientRoutes.blogs.path,
clientRoutes.support.path,
clientRoutes.privacy.path,
clientRoutes.terms.path,
clientRoutes.news.path,
],
app: [clientRoutes.home.path, clientRoutes.gist.path],
offline: [clientRoutes.offline.path],
};

export const disallowedRoutes: string[] = [];

export const serverApi = {
// Auth
auth: "/api/auth",
login: "/api/auth/login",
logout: "/api/auth/logout",
signup: "/api/auth/signup",
checkEmail: "/api/auth/check-email",
verifyAuthToken: "/api/auth/verify",
refreshToken: "/api/auth/refresh",

// Gists
posts: "/api/posts",
likeGist: (id: string) => `/api/posts/${id}/like`,

// Users
users: "/api/users",
user: (id: string) => `/api/users/${id}`,
followers: (id: string) => `/api/users/${id}/followers`,
follow: (id: string) => `/api/users/${id}/follow`,
};

"use client";

import { grey, red } from "@mui/material/colors";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import baseStyles from "./baseStyles";

// Theme configuration
let designSystem = createTheme({
colorSchemes: {
light: {
palette: {
primary: {
light: "#8395FF",
main: "#506AFF",
dark: "#3D59D4",
},
gray: {
0: "#ffffff",
50: "#E8ECF5",
100: "#B9C7DB",
200: "#536077",
300: "#101926",
trans: {
1: "rgba(1, 20, 35, 0.06)",
2: "rgba(1, 20, 35, 0.12)",
overlay: (trans?: number) => `rgba(1, 6, 19, ${trans ?? 0.5})`,
},
},
info: {
light: "#C6CFF1",
main: "#90A5FC",
dark: "#10142C",
},
error: {
main: "#ef5350",
},
tonalOffset: 0.6,
contrastThreshold: 4.5,
},
},
dark: {
palette: {
primary: {
light: "#485BC6",
main: "#5D71EC",
dark: "#8497FF",
},
gray: {
0: "#010516",
50: "#171D3A",
100: "#324763",
200: "#8399B4",
300: "#ffffff",
trans: {
1: "rgba(173, 218, 255, 0.08)",
2: "rgba(173, 218, 255, 0.20)",
overlay: (trans?: number) => `rgba(1, 6, 19, ${trans ?? 0.5})`,
},
},
info: {
light: "#10142C",
main: "#333F83",
dark: "#BBC4E8",
},
error: {
main: red[300],
},
tonalOffset: 0.6,
contrastThreshold: 4.5,
},
},
},
// Fixed colors
fixedColors: {
gray50: grey[50],
gray800: "#06122B",
mainTrans: "rgba(72, 107, 246, 0.12)",
},

// Overriding & Setting Typography
typography: {
fontFamily: "'Manrope','Cabinet Grotesk', Arial, sans-serif",
h1: { fontWeight: 600 },
h2: { fontWeight: 600 },
h4: { fontWeight: 600 },
h5: { fontWeight: 600, fontSize: "26px" },
h6: { fontWeight: 600, fontSize: "24px" },
subtitle1: {
fontSize: "20px",
fontWeight: 600,
},
body1: { fontSize: "18px" },
body2: { fontSize: "15px" },
body3: { fontSize: "14px" },
caption: {},
overline: {},
button: { textTransform: "unset", fontSize: "16px" },
},

// Radius
radius: {
0: "0px",
1: "4px",
2: "8px",
3: "12px",
4: "16px",
5: "20px",
6: "24px",
full: "1000px",
},
// Padding & Margin Spacing
boxSpacing: (top, right, bottom, left) => {
return `${top * 2}px ${right || right === 0 ? right * 2 + "px" : ""} ${
      bottom || bottom === 0 ? bottom * 2 + "px" : ""
    } ${left || left === 0 ? left * 2 + "px" : ""}`;
},

// Spacing Between Elements
gap: (value = 0) => `${value * 2}px`,
});

designSystem = responsiveFontSizes(designSystem);

// Merge both the design system theme and the component theme
const theme = createTheme({
...designSystem,
components: {
...baseStyles.components,
},
});
export default theme;

// transpilePackages: [
// "@repo/shared-ui",
// "@repo/shared-state",
// "@repo/helpers",
// "@repo/theme",
// "@repo/types",
// "@repo/auth/shared",
// "@repo/gist/shared",
// "@repo/stake/shared",
// "@repo/profile/shared",
// ],

// const isProd = process.env.NODE_NODE === "production";

    // const getTarget = (prodPath, localPort) => {
    //   return isProd ? prodPath : `http://localhost:${localPort}`;
    // };

Team members default workspace setups

- Initialize & Set Frontend Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend

- Frontend Shell Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend/apps/shell frontend/public frontend/libs frontend/package.json frontend/package-lock.json frontend/next.config.js

- Auth Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend/apps/auth frontend/libs frontend/package.json frontend/package-lock.json

- Feed & Profile Team View
  git sparse-checkout init --cone
  git sparse-checkout set .github frontend/apps/feed frontend/apps/profile frontend/libs frontend/package.json frontend/package-lock.json

- Initialize & Set Backend View:
  git sparse-checkout init --cone
  git sparse-checkout set .github backend

- AUTOMATED COMMAND: Running the automated command. Ensure you are in the root directory of the project when running the command.

- To allow your system to run the command use:
  chmod +x ws-setup.sh

- Frontend view command:
  ./ws-setup.sh frontend

- Backend view command:
  ./ws-setup.sh backend

- To disable run:
  git sparse-checkout disable

workspace setup
#!/bin/bash
TEAM=$1

# Initialize or re-verify cone mode

git sparse-checkout init --cone

if [ "$TEAM" == "frontend" ]; then
echo "Setting up Frontend Feature Workspace..."
git sparse-checkout set .github frontend

elif [ "$TEAM" == "frontend-shell" ]; then
echo "Setting up Frontend Shell Workspace"
git sparse-checkout set .github frontend/apps/shell frontend/apps/feed frontend/public frontend/libs frontend/.next

elif [ "$TEAM" == "backend" ]; then
echo "Setting up Backend Feature Workspace..."
git sparse-checkout set .github backend
else
echo "Please specify 'frontend' or 'backend'"
fi

{
// "extends": "@repo/typescript-config/nextjs.json",
"compilerOptions": {
"plugins": [{ "name": "next" }],
"jsx": "preserve", // Or "react-jsx" for React 17+
"lib": ["dom", "dom.iterable", "esnext"],
"allowJs": true,
"skipLibCheck": true,
"strict": true,
"forceConsistentCasingInFileNames": true,
"noEmit": true,
"incremental": true,
"module": "esnext",
"moduleResolution": "node",
"resolveJsonModule": true,
"isolatedModules": true
},
"include": [
"**/*.js",
"**/*.ts",
"**/*.tsx",
"next-env.d.ts",
"next.config.js",
".next/types/**/*.ts"
],
"exclude": ["node_modules"]
}

export const cacheFeed = async (newFeed: IPost[]) => {
const now = new Date();
const DAY*IN_MS = 1000 * 60 \_ 60 \* 24;

// 1. Retrieve current cache
const savedPost = ((await get("feed")) as Cached[]) || [];
const authorDictionary = (await get("cached-authors")) || {};

// 2. Filter existing posts (7-day rule)
const filteredSavedFeed = savedPost.filter((item) => {
const lastViewed = new Date(item.lastViewed);
const diffInDays = Math.floor(
(now.getTime() - lastViewed.getTime()) / DAY_IN_MS,
);
return diffInDays <= 7;
});

// 3. Merge old posts with new posts
const postMap = new Map<string, Cached>();
filteredSavedFeed.forEach((item) => postMap.set(item.post.\_id, item));

newFeed.forEach((item) => {
postMap.set(item.\_id, { post: item, lastViewed: new Date() });
});

const finalFeed = Array.from(postMap.values());

// 4. AUTHOR CLEANUP
// Create a Set of all author IDs that have at least one post in the final list
const activeAuthorIds = new Set(finalFeed.map((item) => item.post.authorId));

// Get all IDs currently in the author cache
const cachedAuthorIds = Object.keys(authorDictionary);

cachedAuthorIds.forEach((id) => {
// If an author in the cache is NOT linked to any current post, delete them
if (!activeAuthorIds.has(id)) {
delete authorDictionary[id];
}
});

// 5. Save back to IndexedDB
await Promise.all([
set("feed", finalFeed),
set("cached-authors", authorDictionary),
]);
};

// const handleVisibility = async () => {
// const recentlyAway = getCookie("recently_away");

    //   if (document.visibilityState === "visible") {
    //     if (!recentlyAway) {
    //       //   await verifyAuth();
    //     }
    //   }
    //   if (document.visibilityState === "hidden") {
    //     setCookie("recently_away", "true", 12);
    //   }
    // };

     // Fetch Author

const fetchAuthor = useCallback(async (authorId: string) => {
try {
const res = await fetcher<ISingleResponse<IUser>>(
serverApi.user(authorId),
);
return res.payload;
} catch {
return null;
}
}, []);

import { useState, useCallback, useEffect } from "react";
import { IAuthor, IUser, UIMode } from "@repo/types";
import { getCachedAuthor } from "@repo/helpers";

export const useGistAuthor = (
gistAuthor: IAuthor,
fetchAuthor: (id: string) => Promise<any>,
mode?: UIMode,
) => {
const [author, setAuthor] = useState<IUser | null>(null);
const [error, setError] = useState<string | null>(null);

const handleAuthor = useCallback(async () => {
if (!authorId || author) return;
try {
// Fecth author based on online or offline mode
const authorRes =
mode === "ONLINE" ? author : await getCachedAuthor(authorId);
if (authorRes) {
setAuthor(authorRes);
} else {
setError("Failed to load author");
}
} catch {
setError("Failed to load author");
}
}, [authorId, fetchAuthor, author, getCachedAuthor]);

useEffect(() => {
handleAuthor();
}, [handleAuthor]);

return { author, error };
};

// export const cacheAuthor = async (author: IAuthor) => {
// if (!author || !author.\_id) return;

// try {
// // 1. Get the existing dictionary or initialize an empty object
// const cachedAuthors = (await get("cached-authors")) || {};

// // 2. Add/Update the author using their ID as the key
// cachedAuthors[author._id] = author;

// // 3. Save back to IndexedDB
// await set("cached-authors", cachedAuthors);
// } catch (error) {
// console.error("Failed to cache author:", error);
// }
// };

"use client";

import { fetcher, checkNetworkError, serverApi } from "@repo/helpers";
import { useSnackbar } from "@repo/shared-state";
import { IUser, IListResponse, ISingleResponse } from "@repo/types";

export const useUser = () => {
const { setSBMessage } = useSnackbar();

const getUser = async (
userId: string,
): Promise<{
payload: IUser | null;
message: string;
}> => {
try {
const res = await fetcher<ISingleResponse<IUser>>(
serverApi.user(userId),
{
method: "GET",
},
);
return { payload: res.payload ?? null, message: res.message };
} catch (error: any) {
const networkError = checkNetworkError(error);
if (networkError) return networkError;
return {
payload: null,
message: error.message ?? "Something went wrong",
};
}
};

interface Followers {
payload: any[] | null;
message: string;
}
const getFollowers = async (userId: string): Promise<Followers> => {
try {
const res = await fetcher<IListResponse<any>>(
serverApi.followers(userId),
{
method: "GET",
},
);

      return { payload: res.payload ?? null, message: res.message };
    } catch (error: any) {
      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }

};

interface FollowResponse {
payload: { currentUser: IUser; targetUser: IUser } | null;
message: string;
}
const handleFollow = async (userId: string): Promise<FollowResponse> => {
try {
const res = await fetcher<FollowResponse>(serverApi.follow(userId), {
method: "PUT",
});
setSBMessage({
msg: {
content: res.message,
duration: 2,
msgStatus: "SUCCESS",
},
});
return { payload: res.payload ?? null, message: res.message };
} catch (error: any) {
const networkError = checkNetworkError(error);
if (networkError) {
setSBMessage({
msg: {
content: networkError.message,
duration: 2,
msgStatus: "ERROR",
},
});
return networkError;
}

      return {
        payload: null,
        message: error.message ?? "Something went wrong",
      };
    }

};

return { handleFollow, getFollowers, getUser };
};

"use client"

import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import Image from "next/image";
import { IMedia } from "@repo/types";
import { DoubleTap } from "../DoubleTap";

export interface MediaStyle {
container?: { base?: any; smallScreen?: any };
content?: any;
}

export interface MediaHooks {
useImageColors: (src: string) => { isPortrait: boolean };
useMisc: () => { isDesktop: boolean };
}

export interface MediaProps extends IMedia {
style?: MediaStyle;
onSingleTap?: (media?: IMedia) => void;
onDoubleTap?: (media?: IMedia) => void;
hooks?: MediaHooks;
}

export const Media = ({ \_id, url, type, alt, onSingleTap,
onDoubleTap, style, viewMode = "ISOLATED", dimensions, hooks }: MediaProps) => {

    const theme = useTheme();
    const mediaType = type ?? "IMAGE"

    const isPortrait = hooks?.useImageColors
        ? hooks.useImageColors(url).isPortrait
        : false; // Fallback to false (landscape/square) if no hook provided

    const isDesktop = hooks?.useMisc
        ? hooks.useMisc().isDesktop
        : true; // Fallback to true if no hook provided

    const contentStyle = {
        height: isPortrait ? "80svh" : "auto",
        width: isPortrait ? "auto" : "100%",
        maxHeight: "80svh",
        maxWidth: "100%",
        objectFit: "contain",
        zIndex: 4,
        // Responsive Breakpoints
        ...(!isDesktop && {
            width: "100%",
            height: isPortrait ? "auto" : "unset",
            maxHeight: isPortrait ? "none" : "60svh",
        }),
        ...style?.content,
    }

    return (
        <DoubleTap
            onSingleTap={() => onSingleTap && onSingleTap()}
            onDoubleTap={() => onDoubleTap && onDoubleTap()}>
            <Box
                sx={{
                    position: "relative",
                    overflow: "hidden",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    bgcolor: theme.palette.gray.trans[1],
                    cursor: "pointer",
                    ...style?.container?.base,
                    [theme.breakpoints.down("md")]: {
                        ...style?.container?.smallScreen
                    },
                }}>
                {/* Blurred backround */}
                <Image
                    src={url}
                    alt=""
                    fill
                    style={{
                        objectFit: 'cover',
                        filter: 'blur(8px)',
                        opacity: 1
                    }}
                    priority={false}
                />
                {mediaType === "IMAGE" ? (
                    < Image
                        src={url}
                        width={dimensions?.width || 0}
                        height={dimensions?.height || 0}
                        sizes="100vw"
                        loading="lazy"
                        alt={alt || "Post image"}
                        style={{ ...contentStyle }} />
                ) : (
                    <Box
                        component="video" src={url}
                        autoPlay loop muted playsInline
                        controls
                        sx={{ ...contentStyle }} />
                )}
            </Box >
        </DoubleTap >
    );

};

"use client";

import { Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext, usePost, usePostLike } from "@repo/shared-state";
import { GenericObject, UIMode, IGist } from "@repo/types";
import { useGistService } from "../app/service";
import { getCachedAuthor, summarizeNum } from "@repo/helpers";
import { Empty, MediaProps, PostObserver, Strip } from "@repo/shared-ui";
import { useSnackbar, useMisc } from "@repo/shared-state";
import { mediaData } from "@repo/test-data";
import { GistMedia } from "../app/components/GistMedia";
import { useGistLike } from "../app/hooks/useGistLike";
import { GistHeader } from "../app/components/GistHeader";
import { GistEngagement } from "../app/components/GistEngagement";

interface GistProps {
gist: IGist;
style?: GenericObject<string>;
mode?: UIMode
}

export const GistCard = ({ gist, style = {}, mode = "ONLINE" }: GistProps) => {
const theme = useTheme();
const { setSBMessage } = useSnackbar();
const { handleGistLike, getPendingLike,
setPendingLike, clearPendingLike } = useGistService()
const { authStatus, setModalContent } = useGlobalContext();
const { isOffline, isUnstableNetwork } = useMisc();

    const { postData: gistData, isLiking, handleLike } = usePostLike(
        gist, handleGistLike,
        {
            getPendingLike, setPendingLike, clearPendingLike,
            authStatus, setModalContent, isOffline,
            isUnstableNetwork, setSBMessage, mode,
            LoginPrompt: <Typography>Login to engage</Typography>
        }
    );
    const { likeCount, likedByMe, content, media, authorId, author } = gistData;
    const gistMedia: MediaProps[] = (media && media.length > 0)
        ? (media as MediaProps[]) : mediaData;

    // Gist Author
    const { cachedAuthor } = usePost(authorId);
    const gistAuthor = mode === "ONLINE" || !cachedAuthor ? author : cachedAuthor

    if (gistData.status === "DELETED") return <Empty tagline="Deleted by author." />;

    return (
        <PostObserver post={gistData} type="GIST">
            <Stack
                sx={{
                    gap: theme.gap(0),
                    flexGrow: "0",
                    flexShrink: "0",
                    borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                    ...style,
                }}>
                <GistHeader author={gistAuthor} createdAt={gistData.createdAt} />

                {/* Gist content */}
                <Typography variant="body2" sx={{
                    padding: theme.boxSpacing(6, 0),
                    [theme.breakpoints.down("md")]: {
                        padding: theme.boxSpacing(6),
                    }
                }}>{content}</Typography>

                {/* Gist media */}
                <GistMedia mediaList={gistMedia} likedByMe={likedByMe}
                    handleLike={handleLike} />

                {/* Gist info strip */}
                <Strip
                    items={[
                        {
                            text: likeCount > 1 ? "Likes" : "Like",
                            element: (
                                <strong style={{ color: theme.palette.gray[300] as string }}>
                                    {summarizeNum(likeCount)}
                                </strong>
                            ),
                        },
                        {
                            text: 1500 > 1 ? "Replies" : "Reply",
                            element: (
                                <strong style={{ color: theme.palette.gray[300] as string }}>
                                    {summarizeNum(1500)}
                                </strong>
                            ),
                        },
                        {
                            text: 20000 > 1 ? " Views" : " View",
                            element: (
                                <strong style={{ color: theme.palette.gray[300] as string }}>
                                    {summarizeNum(20000)}
                                </strong>
                            ),
                        },
                    ]}
                    style={{
                        padding: theme.boxSpacing(4, 0),
                        [theme.breakpoints.down("md")]: {
                            padding: theme.boxSpacing(4, 6),
                        },
                        borderBottom: `1px solid ${theme.palette.gray.trans[1]}`,
                        fontSize: "14px"
                    }}
                />

                {/* Gist engagement  */}
                <GistEngagement
                    likedByMe={likedByMe}
                    isLiking={isLiking}
                    handleLike={handleLike}
                    mode={mode}
                />
            </Stack>
        </PostObserver>
    );

};
