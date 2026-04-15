"use client";

import { IPage } from "../types/ui-state";

export const CLIENT_ROUTES: Record<string, IPage> = {
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
  restoreAccount: { title: "Restore Account", path: "/restore-account" },

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

export const ROUTES_REGISTRY = {
  auth: [CLIENT_ROUTES.login.path, CLIENT_ROUTES.signup.path],
  web: [
    CLIENT_ROUTES.about.path,
    CLIENT_ROUTES.pricing.path,
    CLIENT_ROUTES.blogs.path,
    CLIENT_ROUTES.support.path,
    CLIENT_ROUTES.privacy.path,
    CLIENT_ROUTES.terms.path,
    CLIENT_ROUTES.news.path,
  ],
  app: [CLIENT_ROUTES.home.path, CLIENT_ROUTES.gist.path],
  offline: [CLIENT_ROUTES.offline.path],
};

export const DISALLOWED_ROUTES: string[] = [];

// Server Apis
export const API_BASE = {
  auth: "/auth",
  user: "/user",
  // Posts
  feed: "/feed",
  gists: "/gists",
  media: "/media",
  // Report
  report: "/report",
  // Admin
  admin: "/admin",
};

export const SERVER_API = {
  // Auth
  login: `${API_BASE.auth}/login`,
  logout: `${API_BASE.auth}/logout`,
  signup: `${API_BASE.auth}/signup`,
  checkEmail: `${API_BASE.auth}/check-email`,
  checkPhone: `${API_BASE.auth}/check-phone`,
  checkUsername: `${API_BASE.auth}/check-username`,
  verifyUserSession: `${API_BASE.auth}/verify-session`,
  refreshToken: `${API_BASE.auth}/refresh`,

  // Media
  mediaUpload: `${API_BASE.media}/get-upload-url`,

  // Feed
  userFeed: (id: string) => `${API_BASE.feed}/${id}`,
  followersFeed: `${API_BASE.feed}/followers`,

  // Gists
  likeGist: (id: string) => `${API_BASE.gists}/${id}/like`,

  // Users
  getUser: (id: string) => `${API_BASE.user}/${id}`,
  followers: (id: string) => `${API_BASE.user}/${id}/followers`,
  follow: (id: string) => `${API_BASE.user}/${id}/follow`,
};
