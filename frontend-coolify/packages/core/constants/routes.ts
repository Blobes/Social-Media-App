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
  verifyOtp: { title: "Verify Otp", path: "/verify-otp" },

  // Shell
  home: { title: "Home", path: "/" },
  explore: { title: "Explore", path: "/explore" },

  // Messaging
  inbox: { title: "Inbox", path: "/inbox" },

  // Wallet
  wallet: { title: "Wallet", path: "/wallet" },

  // Profile
  profile: { title: "Profile", path: "/profile" },
  bookmarks: { title: "Bookmarks", path: "/bookmarks" },
  notifications: { title: "Notifications", path: "/notifications" },
  settings: { title: "Settings", path: "/settings" },

  // Post
  gist: { title: "Gist", path: "/gist" },
  stakes: { title: "Stakes", path: "/stakes" },
  vibes: { title: "Vibes", path: "/vibes" },
  voices: { title: "Voices", path: "/voices" },

  // Offline
  offline: { title: "Offline", path: "/offline" },
} as const;

/** * Registry mapping logical application zones to their respective route paths.
 */
const OFFLINE_ROUTES = [CLIENT_ROUTES.offline.path];
export const DISALLOWED_ROUTES: string[] = [];

export const ROUTES_REGISTRY = {
  auth: [
    CLIENT_ROUTES.login.path,
    CLIENT_ROUTES.signup.path,
    CLIENT_ROUTES.restoreAccount.path,
  ],
  web: [
    CLIENT_ROUTES.about.path,
    CLIENT_ROUTES.pricing.path,
    CLIENT_ROUTES.blogs.path,
    CLIENT_ROUTES.support.path,
    CLIENT_ROUTES.privacy.path,
    CLIENT_ROUTES.terms.path,
    CLIENT_ROUTES.news.path,
  ],
  shell: [CLIENT_ROUTES.home.path, ...OFFLINE_ROUTES],
  post: [CLIENT_ROUTES.gist.path, CLIENT_ROUTES.stakes.path],
  offline: OFFLINE_ROUTES,
};

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
  sendOtp: `${API_BASE.auth}/send-otp`,
  verifyOtp: `${API_BASE.auth}/verify-otp`,

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
  verifyEmail: `${API_BASE.user}/verify-email`,
  verifyPhone: `${API_BASE.user}/verify-phone`,
};
