"use client";

import { IPage } from "@repo/core";

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

export const routesRegistry = {
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

// Server Apis
export const apiBase = {
  auth: "/auth",
  user: "/user",
  // Posts
  feed: "/post/feed",
  gists: "post/gists",
  media: "/media",
  // Report
  report: "/report",
  // Admin
  admin: "/admin",
};

export const serverApi = {
  // Auth
  login: `${apiBase.auth}/login`,
  logout: `${apiBase.auth}/logout`,
  signup: `${apiBase.auth}/signup`,
  checkEmail: `${apiBase.auth}/check-email`,
  checkUsername: `${apiBase.auth}/check-username`,
  verifyAuthToken: `${apiBase.auth}/verify-auth`,
  refreshToken: `${apiBase.auth}/refresh`,

  // Media
  mediaUpload: `${apiBase.media}/get-upload-url`,

  // Feed
  userFeed: (id: string) => `${apiBase.feed}/${id}`,
  followersFeed: `${apiBase.feed}/followers`,

  // Gists
  likeGist: (id: string) => `${apiBase.gists}/${id}/like`,

  // Users
  getUser: (id: string) => `${apiBase.user}/${id}`,
  followers: (id: string) => `${apiBase.user}/${id}/followers`,
  follow: (id: string) => `${apiBase.user}/${id}/follow`,
};
