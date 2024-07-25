import { createHash, randomBytes } from "crypto";
import { verifyEvent } from "nostr-tools/pure";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

const CHALLENGE_TIMEOUT_MS = 5 * 60 * 1000; // 5 min

export const authRouter = createTRPCRouter({
  getChallenge: publicProcedure.query(async ({ ctx }) => {
    const secret = randomBytes(32).toString("hex");
    await ctx.db.userAuth.create({
      data: {
        challengeHash: createHash("sha256").update(secret).digest("hex"),
      },
    });
    return {
      challenge: secret,
    };
  }),

  nostrLogin: publicProcedure
    .input(
      z.object({
        event: z.string(), // TODO: Don't stringify json?
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.debug("nostrLogin input", input);
      const signedEvent = JSON.parse(input.event);
      if (!verifyEvent(signedEvent))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid signed event",
        });

      // signature and event okay... now check challenge
      let challenge = null;
      const challengeTag = signedEvent.tags.find(
        ([t, v]) => t === "payload" && v
      );
      if (challengeTag && challengeTag[1]) challenge = challengeTag[1];
      else
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Missing challenge secret",
        });

      // whole event is signed... just check if this hash is in the db
      const challengeHash = createHash("sha256")
        .update(challenge)
        .digest("hex");

      const userAuth = await ctx.db.userAuth.findFirst({
        where: { challengeHash },
      });
      if (!userAuth) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No such challenge",
        });
      }

      // Check if the challenge has expired
      const expiresAt = new Date(
        userAuth.createdAt.getTime() + CHALLENGE_TIMEOUT_MS
      );
      const currentTime = new Date();
      if (currentTime > expiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge has expired",
        });
      }

      // Now create a new user or return the existing user
      const user = await ctx.db.$transaction(async (transactionPrisma) => {
        let innerUser;
        innerUser = await transactionPrisma.user.findUnique({
          where: {
            nostrPublicKey: signedEvent.pubkey,
          },
        });

        if (!innerUser) {
          innerUser = await transactionPrisma.user.create({
            data: {
              nostrPublicKey: signedEvent.pubkey,
            },
          });
        }

        return innerUser;
      });

      // Delete the challengeHash that was used and any challenges older than 5 minutes
      const fiveMinutesAgo = new Date(
        currentTime.getTime() - CHALLENGE_TIMEOUT_MS
      );
      await ctx.db.userAuth.deleteMany({
        where: {
          OR: [{ challengeHash }, { createdAt: { lt: fiveMinutesAgo } }],
        },
      });
      const authToken = jwt.sign({ ...user }, process.env.JWT_SECRET!);
      // use better lib
      ctx.resHeaders?.resHeaders.set(
        "Set-Cookie",
        `access-token=${authToken}; Path=/; HttpOnly; SameSite=Strict`
      );
      return { user: user };
    }),
});
