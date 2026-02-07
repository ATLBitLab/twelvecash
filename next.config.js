// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { env } = require("./src/env");

/**
 * MDK Lightning native module externals (replaces @moneydevkit/nextjs/next-plugin for CJS config)
 * This prevents webpack from trying to bundle the native Lightning module.
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
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
module.exports = {
  /**
   * Dynamic configuration available for the browser and server.
   * Note: requires `ssr: true` or a `getInitialProps` in `_app.tsx`
   * @link https://nextjs.org/docs/api-reference/next.config.js/runtime-configuration
   */
  publicRuntimeConfig: {
    NODE_ENV: env.NODE_ENV,
  },
  /** We run eslint as a separate task in CI */
  eslint: { ignoreDuringBuilds: !!process.env.CI },
  /** We run typechecking as a separate task in CI */
  typescript: {
    ignoreBuildErrors: true,
  },
  /** MDK: Externalize Lightning native packages from server bundle (Next.js 14 uses experimental.) */
  experimental: {
    serverComponentsExternalPackages: [lightningPackage, ...binaryPackages],
  },
  /** MDK: Include Lightning native binaries in output file tracing (for Vercel/pnpm) */
  outputFileTracingIncludes: {
    "*": [
      "./node_modules/@moneydevkit/lightning-js/**",
      "./node_modules/@moneydevkit/lightning-js-*/**",
      "./node_modules/.pnpm/@moneydevkit+lightning-js*/**",
      "./node_modules/@moneydevkit/core/**",
      "./node_modules/.pnpm/@moneydevkit+core*/**",
    ],
  },
  /** MDK: Externalize Lightning JS from webpack on the server */
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
