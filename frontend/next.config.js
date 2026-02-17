/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Webpack (Production/Fallback)
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  // 2. Turbopack (Next.js 16 Top-Level Key)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              icon: true, // Optimizes the SVG for use as an icon
              svgo: false, // Prevents SVGO from stripping vital attributes
            },
          },
        ],
        as: "*.js", // Tells Turbopack to treat the SVGR output as a JS module
      },
    },
  },
};

export default nextConfig;
