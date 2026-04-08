/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
const { z } = require("zod");

let domainMap = {};
if (process.env.DOMAINS) {
  try {
    domainMap = JSON.parse(process.env.DOMAINS);
  } catch (e) {
    console.error("Failed to parse DOMAIN_MAP:", e);
    process.exit(1);
  }
}

const envSchema = z
  .object({
    NETWORK: z.enum(["", "testnet", "regtest"]),
    DOMAINS: z.record(z.string(), z.string()),
    CF_TOKEN: z.string(),
    DATABASE_URL: z.string(),
    JWT_SECRET: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    // VERCEL is "1" on Vercel deployments; VERCEL_URL is the deployment URL.
    // VERCEL_URL is mapped to NEXT_PUBLIC_VERCEL_URL in next.config.mjs so
    // client code (src/trpc/react.tsx getBaseUrl) can read it.
    VERCEL: z.string().optional(),
    VERCEL_URL: z.string().optional(),
  })
  .refine(
    (data) => Object.keys(data.DOMAINS).length > 0,
    "Requires at least one domain: domainId pair"
  )
  .refine(
    (data) => !data.VERCEL || data.VERCEL_URL,
    "VERCEL_URL must be set on Vercel deployments (used as NEXT_PUBLIC_VERCEL_URL)"
  );
const env = envSchema.safeParse({ ...process.env, DOMAINS: domainMap });

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(env.error.format(), null, 4)
  );
  process.exit(1);
}

module.exports.env = env.data;
