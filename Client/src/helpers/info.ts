"use client";
// default page
export const defaultPage = {
  title: "home",
  path: "/",
};

export const routes = {
  about: "/about",
  pricing: "/pricing",
  blogs: "/blogs",
  support: "/support",
  login: "/auth/login",
  signup: "/auth/signup",
  profile: "/profile",
  bookmarks: "/bookmarks",
  timeline: "/timeline",
  stakes: "/stakes",
  explore: "/explore",
  inbox: "/inbox",
  settings: "/settings",
};

export const flaggedRoutes = {
  auth: [routes.login, routes.signup],
  web: [
    defaultPage.path,
    routes.about,
    routes.pricing,
    routes.blogs,
    routes.support,
  ],
};
