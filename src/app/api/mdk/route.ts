// Work around a Next.js production bundling issue with `ws` optional native helpers
// (`bufferutil` / `utf-8-validate`) that can crash MDK checkout requests on Vercel
// with `TypeError: ...mask is not a function`.
process.env.WS_NO_BUFFER_UTIL = "1";
process.env.WS_NO_UTF_8_VALIDATE = "1";

const { GET, POST } = require("@moneydevkit/nextjs/server/route");

export { GET, POST };
