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
    PROVIDER: z.enum(["cloudflare"]),
    CF_TOKEN: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]),
  })
  .refine(
    (data) => Object.keys(data.DOMAINS).length > 0,
    "Requires at least one domain: domainId pair"
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
