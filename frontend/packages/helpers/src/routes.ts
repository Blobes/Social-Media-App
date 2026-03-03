"use client";

import { IPage } from "@repo/types";

export const clientRoutes: Record<string, IPage> = {
  // Web
  about: { title: "About", path: "/about" },
  pricing: { title: "Pricing", path: "/pricing" },
  blogs: { title: "Blogs", path: "/blogs" },
  support: { title: "Support", path: "/support" },
  privacy: { title: "Privacy", path: "/privacy" },
  terms: { title: "Terms", path: "/terms" },
  news: { title: "News", path: "/news" },

  // Auth
  login: { title: "Login", path: "/login" },
  signup: { title: "Signup", path: "/signup" },

  // App
  home: { title: "Home", path: "/" },
  profile: { title: "Profile", path: "/profile" },
  bookmarks: { title: "Bookmarks", path: "/bookmarks" },
  stakes: { title: "Stakes", path: "/stakes" },
  explore: { title: "Explore", path: "/explore" },
  inbox: { title: "Inbox", path: "/inbox" },
  settings: { title: "Settings", path: "/settings" },
  gist: { title: "Gist", path: "/gist" },
  notifications: { title: "Notifications", path: "/notifications" },
  wallet: { title: "Wallet", path: "/wallet" },
  vibes: { title: "Vibes", path: "/vibes" },
  voices: { title: "Voices", path: "/voices" },

  // Offline
  offline: { title: "Offline", path: "/offline" },
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
  mediaUpload: "/api/media/get-upload-url",

  // Gists
  gists: "/api/gists",
  likeGist: (id: string) => `/api/gists/${id}/like`,

  // Users
  users: "/api/users",
  user: (id: string) => `/api/users/${id}`,
  followers: (id: string) => `/api/users/${id}/followers`,
  follow: (id: string) => `/api/users/${id}/follow`,
};
