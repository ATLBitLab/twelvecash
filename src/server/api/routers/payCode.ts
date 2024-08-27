import { payCodeInput, randomPayCodeInput } from "@/lib/util/constant";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import {
  InvoiceKind,
  InvoiceStatus,
  PayCodeStatus,
  Prisma,
} from "@prisma/client";
import {
  createBip21,
  createBip21FromParams,
  createPayCodeParams,
} from "@/lib/util";
import axios from "axios";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { z } from "zod";
import { createInvoice, lookupInvoice } from "@/server/lnd";

const domainMap = JSON.parse(process.env.DOMAINS!);

export const payCodeRouter = createTRPCRouter({
  createRandomPayCode: publicProcedure
    .input(randomPayCodeInput)
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

      let create = [];
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

      return payCode;
    }),

  createPayCode: publicProcedure
    .input(payCodeInput)
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

      let create = [];
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

      // TODO: calculate price
      const priceMsats = 5000000;
      let invoice;

      try {
        invoice = await createInvoice(priceMsats, "Purchase pay code.");
      } catch (e: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create invoice",
        });
      }

      // finally, create the paycode, but set to PENDING
      const data: Prisma.PayCodeCreateInput = {
        userName: input.userName,
        domain: input.domain,
        status: PayCodeStatus.PENDING,
        params: {
          create: create,
        },
        invoices: {
          create: [
            {
              maxAgeSeconds: 600,
              description: "purchase",
              status: InvoiceStatus.OPEN,
              bolt11: invoice.payment_request,
              kind: InvoiceKind.PURCHASE,
              hash: invoice.r_hash,
              mSatsTarget: priceMsats,
            },
          ],
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
            invoices: true,
          },
        })
        .catch((e: any) => {
          console.error(e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to add paycode to database",
          });
        });

      console.debug("paycode.invoices", payCode.invoices[0].id);

      return {
        invoice: payCode.invoices[0],
        payCodeId: payCode.id,
      };
    }),

  checkPayment: publicProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.invoice
        .findUnique({
          where: {
            id: input.invoiceId,
          },
        })
        .catch((e: any) => {
          console.error("e", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to lookup invoice",
          });
        });

      if (!invoice) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice does not exist",
        });
      }
      // Final states, no need for invoice lookup
      if (
        invoice.status === InvoiceStatus.SETTLED ||
        invoice.status === InvoiceStatus.CANCELED
      ) {
        return { status: invoice.status };
      }

      let lndInvoice;
      try {
        lndInvoice = await lookupInvoice(invoice.hash);
      } catch (e: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to fetch invoice from lnd node",
        });
      }
      console.debug("lndInvoice state", lndInvoice.state);
      if (lndInvoice.status !== invoice.status) {
        const updateInvoice = await ctx.db.invoice.update({
          where: {
            id: input.invoiceId,
          },
          data: {
            status: lndInvoice.state, // using same strings
          },
        });
        return { status: updateInvoice.status };
      }
      return { status: invoice.status };
    }),

  redeemPayCode: publicProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // first make sure the invoice hasn't already been redeemed
      const invoice = await ctx.db.invoice
        .findFirst({
          where: {
            AND: [{ id: input.invoiceId }, { redeemed: false }],
          },
        })
        .catch((e: any) => {
          console.error("e", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to lookup invoice",
          });
        });

      if (!invoice) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice does not exist or is already redeemed",
        });
      }
      // TODO: If the CF post fails, paycode should still be taken by user since they purchased it.
      // TODO: If the transaction takes long (like 5s or something) it will time out and fail...
      // can happen if ex. CF api is slow. Better way?
      const payCode = await ctx.db
        .$transaction(async (transactionPrisma) => {
          const updateInvoice = await transactionPrisma.invoice.update({
            where: {
              id: input.invoiceId,
            },
            data: {
              redeemed: true,
            },
          });
          const updatePayCode = await transactionPrisma.payCode.update({
            where: {
              id: updateInvoice.payCodeId,
            },
            data: {
              status: PayCodeStatus.ACTIVE,
            },
            include: {
              params: true, // don't need
            },
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
          console.error("Failed to complete transaction", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to redeem pay code.",
          });
        });

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
