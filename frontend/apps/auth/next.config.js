import { withMicrofrontends } from "@vercel/microfrontends/next/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [];
  },
};

export default withMicrofrontends(nextConfig);
