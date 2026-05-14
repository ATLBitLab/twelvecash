import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Base URL is same domain, so no need to specify
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
