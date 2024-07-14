// @ts-check
/**
 * This file is included in `/next.config.js` which ensures the app isn't built with invalid env vars.
 * It has to be a `.js`-file to be imported there.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const { z } = require("zod");

/*eslint sort-keys: "error"*/
const envSchema = z.object({
  NETWORK: z.enum(["", "testnet", "regtest"]),
  DOMAIN: z.string(),
  PROVIDER: z.enum(["cloudflare"]),
  CF_TOKEN: z.string(),
  CF_DOMAIN_ID: z.string(),
  NODE_ENV: z.enum(["development", "test", "production"]),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(env.error.format(), null, 4)
  );
  process.exit(1);
}
module.exports.env = env.data;
