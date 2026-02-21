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
    return [
      {
        source: "/login",
        destination: `${process.env.NEXT_PUBLIC_AUTH_URL}/login`,
      },
      {
        source: "/signup",
        destination: `${process.env.NEXT_PUBLIC_AUTH_URL}/signup`,
      },
      {
        source: "/gist",
        destination: `${process.env.NEXT_PUBLIC_GIST_URL}/gist`,
      },
      {
        source: "/profile",
        destination: `${process.env.NEXT_PUBLIC_PROFILE_URL}/profile`,
      },
      {
        source: "/stake",
        destination: `${process.env.NEXT_PUBLIC_STAKE_URL}/stake`,
      },
      {
        source: "/about",
        destination: `${process.env.NEXT_PUBLIC_WEB_URL}/about`,
      },
      {
        source: "/pricing",
        destination: `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`,
      },
      {
        source: "/support",
        destination: `${process.env.NEXT_PUBLIC_WEB_URL}/support`,
      },
    ];
  },
};

export default nextConfig;
