/** @type {import('next').NextConfig} */
const nextConfig = {
  // basePath: "/auth",
  assetPrefix: "/auth-assets",

  generateBuildId: async () => {
    return "funstakes-build";
  },
  async rewrites() {
    return [
      {
        source: "/auth-assets/_next/:path*",
        destination: "/_next/:path*",
      },
    ];
  },
};

export default nextConfig;
