import {
  createPayCodeInput,
  createRandomPayCodeInput,
  PAY_CODE_PRICE_SATS,
} from "@/lib/util/constant";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { createMdkCheckout, getMdkCheckout, isCheckoutPaid } from "@/server/mdk";
import { TRPCError } from "@trpc/server";
import {
  PayCodeStatus,
  Prisma,
} from "@prisma/client";
import {
  createBip21,
  createBip21FromParams,
  createPayCodeParams,
} from "@/lib/util";
import { logPayCodeActivity } from "@/lib/notifications";
import axios from "axios";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { z } from "zod";

const domainMap = JSON.parse(process.env.DOMAINS!);
const supportedDomains = Object.keys(domainMap);

// The short lease covers the MDK call between reserving a name and receiving
// the checkout's authoritative expiry. A successfully-created checkout then
// owns the name until its expiry plus a grace period for users who paid but did
// not immediately return to the success page.
const CHECKOUT_CREATION_RESERVATION_MS = 10 * 60 * 1000;
const CHECKOUT_REDEMPTION_GRACE_MS = 24 * 60 * 60 * 1000;

const caseInsensitiveNameWhere = (userName: string, domain: string) => ({
  userName: { equals: userName, mode: Prisma.QueryMode.insensitive },
  domain: { equals: domain, mode: Prisma.QueryMode.insensitive },
});

const isPrismaUniqueConstraintError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === "P2002";

const nameTakenError = () =>
  new TRPCError({
    code: "CONFLICT",
    message: "User name is taken",
  });

export const payCodeRouter = createTRPCRouter({
  createRandomPayCode: publicProcedure
    .input(createRandomPayCodeInput(supportedDomains))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      console.debug("user", user);
      console.debug("input", input);

      let bip21: string;
      try {
        bip21 = createBip21(
          input.onChain,
          input.label,
          input.lno,
          input.sp,
          input.lnurl,
          input.custom
        );
      } catch (e: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e.message,
        });
      }
      console.debug("bip21", bip21);

      let create: Prisma.PayCodeParamCreateWithoutPayCodeInput[] = [];
      try {
        create = createPayCodeParams(
          input.onChain,
          input.label,
          input.lno,
          input.sp,
          input.lnurl,
          input.custom
        );
      } catch (e: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create pay code params",
        });
      }

      const CF_BASE_URL = `https://api.cloudflare.com/client/v4/zones/${
        domainMap[input.domain]
      }/dns_records`;
      let payCode:
        | Prisma.PayCodeGetPayload<{ include: { params: true } }>
        | undefined;

      // Generation is intentionally bounded. Each candidate expires a stale
      // PENDING lease before checking live reservations, and the database index
      // still resolves a race between that check and the ACTIVE insert. A
      // unique collision simply burns this candidate and generates another.
      for (let attempt = 0; attempt < 5; attempt++) {
        const userName = uniqueNamesGenerator({
          dictionaries: [adjectives, animals],
          length: 2,
          separator: ".",
        });
        const fullName = process.env.NETWORK
          ? `${userName}.user._bitcoin-payment.${process.env.NETWORK}.${input.domain}`
          : `${userName}.user._bitcoin-payment.${input.domain}`;

        const res = await axios
          .get(`${CF_BASE_URL}?name=${fullName}&type=TXT`, {
            headers: {
              Content_Type: "application/json",
              Authorization: `Bearer ${process.env.CF_TOKEN}`,
            },
          })
          .catch(() => {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Server failed to talk to DNS",
            });
          });
        if (res.data.result.length > 0) continue;

        try {
          payCode = await ctx.db.$transaction(async (transactionPrisma) => {
            const now = new Date();
            await transactionPrisma.payCode.updateMany({
              where: {
                ...caseInsensitiveNameWhere(userName, input.domain),
                status: PayCodeStatus.PENDING,
                reservationExpiresAt: { lte: now },
              },
              data: { status: PayCodeStatus.EXPIRED },
            });

            const existingPayCode = await transactionPrisma.payCode.findFirst({
              where: {
                ...caseInsensitiveNameWhere(userName, input.domain),
                OR: [
                  { status: PayCodeStatus.ACTIVE },
                  {
                    status: PayCodeStatus.PENDING,
                    reservationExpiresAt: { gt: now },
                  },
                  {
                    status: PayCodeStatus.PENDING,
                    reservationExpiresAt: null,
                  },
                ],
              },
            });
            if (existingPayCode) return undefined;

            const data: Prisma.PayCodeCreateInput = {
              userName,
              domain: input.domain,
              status: PayCodeStatus.ACTIVE,
              params: { create },
            };
            if (ctx.user) {
              data.user = { connect: { id: ctx.user.id } };
            }

            const createdPayCode = await transactionPrisma.payCode.create({
              data,
              include: { params: true },
            });

            await axios
              .post(
                CF_BASE_URL,
                {
                  content: bip21,
                  name: fullName,
                  proxied: false,
                  type: "TXT",
                  comment: "Twelve Cash User DNS Update",
                  ttl: 3600,
                },
                {
                  method: "POST",
                  headers: {
                    Content_Type: "application/json",
                    Authorization: `Bearer ${process.env.CF_TOKEN}`,
                  },
                }
              )
              .catch((e: unknown) => {
                console.error("Failed to post record to CloudFlare", e);
                throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Failed to post record to CloudFlare",
                });
              });

            return createdPayCode;
          });
        } catch (e: unknown) {
          if (isPrismaUniqueConstraintError(e)) continue;
          if (e instanceof TRPCError) throw e;
          console.error("Failed to create random paycode", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to add paycode to database",
          });
        }

        if (payCode) break;
      }

      if (!payCode) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate random paycode",
        });
      }

      // Log activity (non-blocking, fire-and-forget)
      logPayCodeActivity({ type: "free", domain: input.domain });

      return payCode;
    }),

  createPayCode: publicProcedure
    .input(createPayCodeInput(supportedDomains))
    .mutation(async ({ ctx, input }) => {
      const fullName = process.env.NETWORK
        ? `${input.userName}.user._bitcoin-payment.${process.env.NETWORK}.${input.domain}`
        : `${input.userName}.user._bitcoin-payment.${input.domain}`;

      // First check to see if this user name already exists in DNS
      // Eventually, all paycodes will be in the DB.
      const CF_BASE_URL = `https://api.cloudflare.com/client/v4/zones/${
        domainMap[input.domain]
      }/dns_records`;
      const res = await axios
        .get(`${CF_BASE_URL}?name=${fullName}&type=TXT`, {
          headers: {
            Content_Type: "application/json",
            Authorization: `Bearer ${process.env.CF_TOKEN}`,
          },
        })
        .catch((e: any) => {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Server failed to talk to DNS",
          });
        });
      if (res.data.result.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User name is taken",
        });
      }
      // This read provides a fast, friendly conflict response. The partial
      // unique index is still the authority: this read alone cannot prevent two
      // concurrent callers from choosing the same name.
      const existingPayCode = await ctx.db.payCode
        .findFirst({
          where: {
            AND: [
              caseInsensitiveNameWhere(input.userName, input.domain),
              {
                OR: [
                  { status: PayCodeStatus.ACTIVE },
                  {
                    status: PayCodeStatus.PENDING,
                    reservationExpiresAt: { gt: new Date() },
                  },
                  {
                    status: PayCodeStatus.PENDING,
                    reservationExpiresAt: null,
                  },
                ],
              },
            ],
          },
        })
        .catch((e: any) => {
          console.error("e", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to lookup paycode",
          });
        });
      if (existingPayCode) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User name is taken",
        });
      }

      let create: Prisma.PayCodeParamCreateWithoutPayCodeInput[] = [];
      try {
        create = createPayCodeParams(
          input.onChain,
          input.label,
          input.lno,
          input.sp,
          input.lnurl,
          input.custom
        );
      } catch (e: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create pay code params",
        });
      }

      const now = new Date();
      const initialReservationExpiry = new Date(
        now.getTime() + CHECKOUT_CREATION_RESERVATION_MS
      );

      // Expire a stale checkout lease and claim the name in one transaction.
      // PostgreSQL's partial unique index on lower(userName), lower(domain)
      // serializes racing inserts for PENDING/ACTIVE names. The preflight read
      // above is deliberately not treated as a lock.
      let payCode: Prisma.PayCodeGetPayload<{ include: { params: true } }>;
      try {
        payCode = await ctx.db.$transaction(async (transactionPrisma) => {
          await transactionPrisma.payCode.updateMany({
            where: {
              ...caseInsensitiveNameWhere(input.userName, input.domain),
              status: PayCodeStatus.PENDING,
              reservationExpiresAt: { lte: now },
            },
            data: { status: PayCodeStatus.EXPIRED },
          });

          const data: Prisma.PayCodeCreateInput = {
            userName: input.userName,
            domain: input.domain,
            status: PayCodeStatus.PENDING,
            reservationExpiresAt: initialReservationExpiry,
            params: {
              create: create,
            },
          };

          if (ctx.user) {
            data.user = {
              connect: { id: ctx.user.id },
            };
          }

          return transactionPrisma.payCode.create({
            data,
            include: { params: true },
          });
        });
      } catch (e: unknown) {
        if (isPrismaUniqueConstraintError(e)) throw nameTakenError();
        if (e instanceof TRPCError) throw e;
        console.error("Failed to reserve paycode", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add paycode to database",
        });
      }

      // Create the MDK checkout server-side so the price and the
      // paycode<->checkout binding cannot be tampered with by the client.
      let checkoutId: string;
      let checkoutExpiresAt: Date;
      try {
        const checkout = await createMdkCheckout({
          type: "AMOUNT",
          amount: PAY_CODE_PRICE_SATS,
          currency: "SAT",
          title: "Purchase Pay Code",
          description: `Purchase pay code: ${payCode.userName}@${payCode.domain}`,
          successUrl: `/new/success?payCodeId=${payCode.id}`,
          metadata: {
            payCodeId: payCode.id,
            userName: payCode.userName,
            domain: payCode.domain,
          },
        });
        checkoutId = checkout.id;
        checkoutExpiresAt = new Date(checkout.expiresAt);
        if (
          Number.isNaN(checkoutExpiresAt.getTime()) ||
          checkoutExpiresAt.getTime() <= Date.now()
        ) {
          throw new Error("MDK returned an invalid checkout expiry");
        }
      } catch (e: any) {
        console.error("Failed to create MDK checkout", e);
        // Best-effort cleanup of the just-created PENDING row (params first —
        // the relation has no onDelete: Cascade). If cleanup itself fails, the
        // short creation lease releases the name for retry.
        await ctx.db
          .$transaction([
            ctx.db.payCodeParam.deleteMany({ where: { payCodeId: payCode.id } }),
            ctx.db.payCode.delete({ where: { id: payCode.id } }),
          ])
          .catch((err: any) =>
            console.error("Failed to clean up orphan pay code", err)
          );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout",
        });
      }

      const reservationExpiresAt = new Date(
        checkoutExpiresAt.getTime() + CHECKOUT_REDEMPTION_GRACE_MS
      );

      // Persist the checkout id so redeemPayCode can verify payment later, and
      // align the lease with MDK's checkout lifetime. If this fails, do not hand
      // back a checkout URL — the user would pay but redemption could not prove
      // the binding.
      await ctx.db.payCode
        .update({
          where: { id: payCode.id },
          data: { checkoutId, reservationExpiresAt },
        })
        .catch((e: any) => {
          console.error("Failed to store checkout id", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout",
          });
        });

      return {
        payCodeId: payCode.id,
        userName: payCode.userName,
        domain: payCode.domain,
        checkoutUrl: `/checkout/${checkoutId}`,
      };
    }),

  redeemPayCode: publicProcedure
    .input(
      z.object({
        payCodeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Look up the pay code and make sure it's in PENDING state
      const pendingPayCode = await ctx.db.payCode
        .findFirst({
          where: {
            AND: [
              { id: input.payCodeId },
              { status: PayCodeStatus.PENDING },
            ],
          },
          include: { params: true },
        })
        .catch((e: any) => {
          console.error("e", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to lookup pay code",
          });
        });

      if (!pendingPayCode) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pay code does not exist or is already redeemed",
        });
      }

      // Server-side payment verification (fail closed). Never trust the client:
      // confirm with MDK that the checkout bound to this paycode was actually
      // paid before publishing DNS. Done before the transaction so the MDK
      // network call cannot blow the transaction timeout.
      if (!pendingPayCode.checkoutId) {
        // Legacy/orphan PENDING rows created before server-side checkouts.
        // No payment can be proven -> refuse.
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "No payment is associated with this pay code. Please create it again.",
        });
      }

      let checkout;
      try {
        checkout = await getMdkCheckout(pendingPayCode.checkoutId);
      } catch (e: any) {
        console.error("Failed to fetch checkout from MDK", e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify payment. Please try again.",
        });
      }

      if (checkout.id !== pendingPayCode.checkoutId) {
        console.error("MDK returned a checkout with the wrong id");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify payment. Please try again.",
        });
      }

      if (!isCheckoutPaid(checkout, PAY_CODE_PRICE_SATS)) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Payment has not been received for this pay code.",
        });
      }

      // TODO: If the CF post fails, paycode should still be taken by user since they purchased it.
      // TODO: If the transaction takes long (like 5s or something) it will time out and fail...
      // can happen if ex. CF api is slow. Better way?
      const payCode = await ctx.db
        .$transaction(async (transactionPrisma) => {
          // Atomically claim the paycode: only flip it if it is still PENDING.
          // A concurrent redeem blocks on the row lock, re-evaluates the
          // predicate after the winner commits, matches 0 rows, and loses here
          // — preventing a double DNS publish.
          const claimed = await transactionPrisma.payCode.updateMany({
            where: { id: input.payCodeId, status: PayCodeStatus.PENDING },
            data: {
              status: PayCodeStatus.ACTIVE,
              reservationExpiresAt: null,
            },
          });
          if (claimed.count === 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Pay code was already redeemed",
            });
          }
          const updatePayCode = await transactionPrisma.payCode.findUniqueOrThrow({
            where: { id: input.payCodeId },
            include: { params: true },
          });
          // Double check that there isn't already a record there...
          const CF_BASE_URL = `https://api.cloudflare.com/client/v4/zones/${
            domainMap[updatePayCode.domain]
          }/dns_records`;
          const fullName = process.env.NETWORK
            ? `${updatePayCode.userName}.user._bitcoin-payment.${process.env.NETWORK}.${updatePayCode.domain}`
            : `${updatePayCode.userName}.user._bitcoin-payment.${updatePayCode.domain}`;

          const res = await axios
            .get(`${CF_BASE_URL}?name=${fullName}&type=TXT`, {
              headers: {
                Content_Type: "application/json",
                Authorization: `Bearer ${process.env.CF_TOKEN}`,
              },
            })
            .catch((e: any) => {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Server failed to talk to DNS",
              });
            });
          if (res.data.result.length > 0) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "User name is taken",
            });
          }

          let bip21: string;
          try {
            // use native type returned instead of mapping
            bip21 = createBip21FromParams(
              updatePayCode.params.map((p) => ({
                prefix: p.prefix,
                value: p.value,
                type: p.type,
              }))
            );
          } catch (e: any) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: e.message,
            });
          }

          await axios
            .post(
              CF_BASE_URL,
              {
                content: bip21,
                name: fullName,
                proxied: false,
                type: "TXT",
                comment: "Twelve Cash User DNS Update",
                ttl: 3600,
              },
              {
                method: "POST",
                headers: {
                  Content_Type: "application/json",
                  Authorization: `Bearer ${process.env.CF_TOKEN}`,
                },
              }
            )
            .catch((e: any) => {
              console.error("Failed to post record to CloudFlare", e);
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to post record to CloudFlare",
              });
            });

          return updatePayCode;
        })
        .catch((e: any) => {
          // Preserve typed errors (CONFLICT, PRECONDITION_FAILED, etc.) thrown
          // inside the transaction instead of masking them as 500s.
          if (e instanceof TRPCError) throw e;
          console.error("Failed to complete transaction", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to redeem pay code.",
          });
        });

      // Log activity (non-blocking, fire-and-forget)
      logPayCodeActivity({ type: "paid", domain: payCode.domain });

      return payCode;
    }),

  getUserPaycodes: protectedProcedure.query(async ({ ctx }) => {
    console.debug("Getting user's paycodes!");
    // TODO: Select only values we need
    return await ctx.db.payCode
      .findMany({
        where: {
          userId: ctx.user.id,
          status: PayCodeStatus.ACTIVE,
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
      .catch((e: any) => {
        console.error(e);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get user's paycodes",
        });
      });
  }),
});
