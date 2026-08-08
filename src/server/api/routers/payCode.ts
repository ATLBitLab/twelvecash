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

      let errMsg = "";
      let userName = "";
      let fullName = "";
      const CF_BASE_URL = `https://api.cloudflare.com/client/v4/zones/${
        domainMap[input.domain]
      }/dns_records`;
      for (let i = 0; i < 5; i++) {
        userName = uniqueNamesGenerator({
          dictionaries: [adjectives, animals],
          length: 2,
          separator: ".",
        });
        fullName = process.env.NETWORK
          ? `${userName}.user._bitcoin-payment.${process.env.NETWORK}.${input.domain}`
          : `${userName}.user._bitcoin-payment.${input.domain}`;

        // First check to see if this user name already exists in DNS
        // Eventually, all paycodes will be in the DB.
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
          errMsg = "Name is already taken.";
          continue;
        }

        // Check if the paycode exists in the our database
        const existingPayCode = await ctx.db.payCode
          .findFirst({
            where: {
              AND: [
                { userName: userName },
                { domain: input.domain },
                { status: PayCodeStatus.ACTIVE },
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
        if (!existingPayCode) {
          // username doesn't exist in DNS or database, break out of the loop and create
          errMsg = "";
          break;
        }
      }

      if (errMsg) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate random paycode",
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

      const payCode = await ctx.db.$transaction(async (transactionPrisma) => {
        const data: Prisma.PayCodeCreateInput = {
          userName: userName,
          domain: input.domain,
          status: PayCodeStatus.ACTIVE,
          params: {
            create: create,
          },
        };

        if (ctx.user) {
          data.user = {
            connect: { id: ctx.user.id },
          };
        }

        let innerPaycode = await transactionPrisma.payCode
          .create({
            data: data,
            include: {
              params: true, // Include params in the response
            },
          })
          .catch((e: any) => {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to add paycode to database",
            });
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
          .catch((e: any) => {
            console.error("Failed to post record to CloudFlare", e);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to post record to CloudFlare",
            });
          });

        return innerPaycode;
      });
      // TODO: catch and throw again?

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
      // Check if the paycode exists in the our database
      // TODO: Should probably make sure there isn't any open invoices
      // for the paycode.. someone could be in the middle of purchasing the same name...
      const existingPayCode = await ctx.db.payCode
        .findFirst({
          where: {
            AND: [
              { userName: input.userName },
              { domain: input.domain },
              { status: PayCodeStatus.ACTIVE },
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

      // Create the paycode in PENDING state
      const data: Prisma.PayCodeCreateInput = {
        userName: input.userName,
        domain: input.domain,
        status: PayCodeStatus.PENDING,
        params: {
          create: create,
        },
      };

      if (ctx.user) {
        data.user = {
          connect: { id: ctx.user.id },
        };
      }

      const payCode = await ctx.db.payCode
        .create({
          data: data,
          include: {
            params: true,
          },
        })
        .catch((e: any) => {
          console.error(e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to add paycode to database",
          });
        });

      // Create the MDK checkout server-side so the price and the
      // paycode<->checkout binding cannot be tampered with by the client.
      let checkoutId: string;
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
      } catch (e: any) {
        console.error("Failed to create MDK checkout", e);
        // Best-effort cleanup of the just-created PENDING row (params first —
        // the relation has no onDelete: Cascade). A leftover PENDING orphan is
        // harmless: only ACTIVE rows reserve a name, and the user can retry.
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

      // Persist the checkout id so redeemPayCode can verify payment later.
      // If this fails, do not hand back a checkout URL — the user would pay
      // but redemption could never verify the binding.
      await ctx.db.payCode
        .update({
          where: { id: payCode.id },
          data: { checkoutId },
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
            data: { status: PayCodeStatus.ACTIVE },
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
