import { withMicrofrontends } from "@vercel/microfrontends/next/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Return an OBJECT, not an array
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${process.env.BACKEND_API_URL}/:path*`,
        },
      ],
    };
  },
};

export default withMicrofrontends(nextConfig);
