import {
  FetchCreateContextFnOptions,
  fetchRequestHandler,
} from "@trpc/server/adapters/fetch";
import { type NextRequest, type NextResponse } from "next/server";

import { env } from "@/env";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (
  req: NextRequest,
  resHeaders: FetchCreateContextFnOptions
) => {
  return createTRPCContext({
    headers: req.headers,
    // resHeaders added in so we can set the JWT in the cookie after authentication
    resHeaders: resHeaders,
  });
};

const handler = (req: NextRequest, res: NextResponse) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: (resHeaders) => createContext(req, resHeaders),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
