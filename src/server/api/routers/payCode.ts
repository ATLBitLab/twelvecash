import { randomPayCodeInput } from "@/lib/util/constant";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { PayCodeStatus, Prisma } from "@prisma/client";
import { createBip21, createPayCodeParams } from "@/lib/util";
import axios from "axios";
import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { createGzip } from "zlib";

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

        const CF_URL = `${CF_BASE_URL}?name=${fullName}&type=TXT`;

        // First check to see if this user name already exists in DNS
        // Eventually, all paycodes will be in the DB.
        const res = await axios
          .get(CF_URL, {
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
          redeemed: true,
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
