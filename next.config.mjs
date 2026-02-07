import { createRequire } from "node:module";
import withMdkCheckout from "@moneydevkit/nextjs/next-plugin";

// Validate required env vars at build time
const require = createRequire(import.meta.url);
require("./src/env");

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: !process.env.CI },
  // TODO: Fix outstanding type errors and remove this bypass.
  // See: https://github.com/ATLBitLab/twelvecash/issues/TBD
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withMdkCheckout(nextConfig);
