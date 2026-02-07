import { createRequire } from "node:module";
import withMdkCheckout from "@moneydevkit/nextjs/next-plugin";

// Validate required env vars at build time
const require = createRequire(import.meta.url);
require("./src/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Expose Vercel's system VERCEL_URL as a client-safe NEXT_PUBLIC_ variable
  env: {
    NEXT_PUBLIC_VERCEL_URL: process.env.VERCEL_URL ?? "",
  },
  eslint: { ignoreDuringBuilds: !process.env.CI },
  // TODO: Fix outstanding type errors and remove this bypass.
  // See: https://github.com/ATLBitLab/twelvecash/issues/TBD
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withMdkCheckout(nextConfig);
