/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ skips ESLint on Vercel
  },
};

module.exports = nextConfig;
