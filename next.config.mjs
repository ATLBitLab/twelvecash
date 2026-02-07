import { createRequire } from "node:module";
import withMdkCheckout from "@moneydevkit/nextjs/next-plugin";

const require = createRequire(import.meta.url);
const { env } = require("./src/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withMdkCheckout(nextConfig);
