// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { env } = require("./src/env");

/**
 * MDK Lightning native module externals
 * These prevent webpack from trying to bundle the native Lightning module
 * and ensure Vercel includes the binaries in the deployment.
 */
const lightningPackage = "@moneydevkit/lightning-js";
const binaryPackages = [
  "@moneydevkit/lightning-js-linux-x64-gnu",
  "@moneydevkit/lightning-js-linux-x64-musl",
  "@moneydevkit/lightning-js-linux-arm64-gnu",
  "@moneydevkit/lightning-js-linux-arm64-musl",
  "@moneydevkit/lightning-js-linux-arm-gnueabihf",
  "@moneydevkit/lightning-js-android-arm64",
  "@moneydevkit/lightning-js-android-arm-eabi",
  "@moneydevkit/lightning-js-win32-x64-msvc",
  "@moneydevkit/lightning-js-win32-ia32-msvc",
  "@moneydevkit/lightning-js-win32-arm64-msvc",
  "@moneydevkit/lightning-js-darwin-x64",
  "@moneydevkit/lightning-js-darwin-arm64",
  "@moneydevkit/lightning-js-freebsd-x64",
];

/** @param {{ request?: string }} context @param {(error?: unknown, result?: string) => void} callback */
function lightningWebpackExternal(context, callback) {
  if (typeof context.request === "string") {
    if (
      context.request === lightningPackage ||
      context.request.startsWith(`${lightningPackage}-`)
    ) {
      callback(undefined, `commonjs ${context.request}`);
      return;
    }
  }
  callback();
}

/**
 * @type {import('next').NextConfig}
 * @link https://nextjs.org/docs/app/api-reference/config/next-config-js
 */
module.exports = {
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  typescript: {
    ignoreBuildErrors: true,
  },
  /** MDK: Externalize Lightning native packages from the server bundle (Next.js 15 stable API) */
  serverExternalPackages: [lightningPackage, ...binaryPackages],
  /** MDK: Ensure Vercel includes the Lightning native binaries in the deployment trace */
  outputFileTracingIncludes: {
    "/api/mdk/*": [
      "./node_modules/@moneydevkit/lightning-js/**/*",
      "./node_modules/@moneydevkit/lightning-js-*/**/*",
      "./node_modules/.pnpm/@moneydevkit+lightning-js*/**/*",
      "./node_modules/@moneydevkit/core/**/*",
      "./node_modules/.pnpm/@moneydevkit+core*/**/*",
    ],
  },
  /** MDK: Externalize Lightning JS native addon from webpack on the server side */
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = config.externals || [];
      config.externals = Array.isArray(existing)
        ? [...existing, lightningWebpackExternal]
        : [existing, lightningWebpackExternal];
    }
    return config;
  },
};
