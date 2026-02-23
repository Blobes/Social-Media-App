/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return "funstakes-build";
  },

  async rewrites() {
    return [
      // 1. Backend API Rewrite (Formerly in vercel.json)
      {
        source: "/api/:path*",
        destination: "https://funstakes.onrender.com/:path*",
      },
      // 2. Auth Microservice
      {
        source: "/login",
        destination: `${process.env.AUTH_APP_URL}/login`,
      },
      {
        source: "/signup",
        destination: `${process.env.AUTH_APP_URL}/signup`,
      },
      {
        // This forwards the auth app's code to the browser
        source: "/_next/static/:path*",
        destination: `${process.env.AUTH_APP_URL}/_next/static/:path*`,
      },
      // 3. Gist Microservice
      {
        source: "/gist",
        destination: `${process.env.GIST_APP_URL}/gist`,
      },
      // 4. Profile Microservice
      {
        source: "/profile",
        destination: `${process.env.PROFILE_APP_URL}/profile`,
      },
      // 5. Stake Microservice
      {
        source: "/stake",
        destination: `${process.env.STAKE_APP_URL}/stake`,
      },
      // 6. Marketing / Web Microservice
      {
        source: "/about",
        destination: `${process.env.WEB_APP_URL}/about`,
      },
      {
        source: "/pricing",
        destination: `${process.env.WEB_APP_URL}/pricing`,
      },
      {
        source: "/support",
        destination: `${process.env.WEB_APP_URL}/support`,
      },
    ];
  },
};

export default nextConfig;
