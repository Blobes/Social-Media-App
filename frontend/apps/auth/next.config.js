/** @type {import('next').NextConfig} */
const nextConfig = {
  // basePath: "/auth",

  generateBuildId: async () => {
    return "funstakes-build";
  },
};

export default nextConfig;
