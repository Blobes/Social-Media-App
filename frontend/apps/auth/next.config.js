import { withCommonConfig } from "@repo/env-config";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withCommonConfig(nextConfig, process.env.NEXT_PUBLIC_API_URL);
