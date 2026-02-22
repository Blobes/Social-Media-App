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
