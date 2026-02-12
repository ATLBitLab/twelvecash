import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Require email verification before account is active
    requireEmailVerification: false, // Set to true when email sending is configured
  },
  session: {
    // Session expires in 7 days
    expiresIn: 60 * 60 * 24 * 7,
    // Refresh session when it's less than 1 day from expiring
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  // Enable account linking so users can link email to existing Nostr accounts
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["email"],
    },
  },
});

export type Session = typeof auth.$Infer.Session;
