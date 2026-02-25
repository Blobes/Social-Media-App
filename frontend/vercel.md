/\*_ @type {import('next').NextConfig} _/
const nextConfig = {
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
source: "/auth-assets/_next/:path*",
destination: `${process.env.AUTH_APP_URL}/_next/:path*`,
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

Auth
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

/\*_ @type {import('next').NextConfig} _/
const nextConfig = {
// basePath: "/auth",
assetPrefix: "/auth-assets",

async rewrites() {
return [
{
source: "/auth-assets/_next/:path*",
destination: "/_next/:path*",
},
];
},
};

export default withMicrofrontends(nextConfig);

name: v2 Pre-merge Workflow

on:
pull_request: # Only listen to the v2 branch and nothing else
branches: - v2-main # Only trigger if files in your monorepo folders change
paths: - "backend/**" - "frontend/**"

jobs:
v2-build:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"
          cache-dependency-path: |
            frontend/package.json
            frontend/pnpm-lock.yaml

      - uses: pnpm/action-setup@v4
        with:
          version: 10.30.1 # or your preferred version

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: |
            backend/package.json
            backend/package-lock.json

      - name: Install Frontend
        run: cd frontend && pnpm install --frozen-lockfile

      - name: Install Backend
        run: cd backend && npm ci

      - name: Build All
        run: npm run build

import { withMicrofrontends } from "@vercel/microfrontends/next/config";

/\*_ @type {import('next').NextConfig} _/
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
