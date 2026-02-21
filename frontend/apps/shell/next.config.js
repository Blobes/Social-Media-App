/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@repo/shared-ui",
    "@repo/shared-state",
    "@repo/helpers",
    "@repo/theme",
    "@repo/types",
    "@repo/auth/shared",
    "@repo/gist/shared",
    "@repo/stake/shared",
    "@repo/profile/shared",
  ],
  async rewrites() {
    // Helper to ensure we don't pass 'undefined' to the destination
    const getUrl = (envVar) => envVar || "http://localhost:3001";

    return [
      {
        source: "/login",
        destination: `${getUrl(process.env.NEXT_PUBLIC_AUTH_URL)}/login`,
      },
      {
        source: "/signup",
        destination: `${getUrl(process.env.NEXT_PUBLIC_AUTH_URL)}/signup`,
      },
      {
        source: "/gist",
        destination: `${getUrl(process.env.NEXT_PUBLIC_GIST_URL)}/gist`,
      },
      {
        source: "/profile",
        destination: `${getUrl(process.env.NEXT_PUBLIC_PROFILE_URL)}/profile`,
      },
      {
        source: "/stake",
        destination: `${getUrl(process.env.NEXT_PUBLIC_STAKE_URL)}/stake`,
      },
      {
        source: "/about",
        destination: `${getUrl(process.env.NEXT_PUBLIC_WEB_URL)}/about`,
      },
      {
        source: "/pricing",
        destination: `${getUrl(process.env.NEXT_PUBLIC_WEB_URL)}/pricing`,
      },
      {
        source: "/support",
        destination: `${getUrl(process.env.NEXT_PUBLIC_WEB_URL)}/support`,
      },
    ];
  },
};

export default nextConfig;
