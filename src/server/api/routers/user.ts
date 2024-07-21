import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const userRouter = createTRPCRouter({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    console.debug("GET ME");
    console.debug("user", ctx.user);
    const tokenUser = ctx.user;
    try {
      return await ctx.db.user.findUnique({
        where: {
          id: tokenUser?.id,
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found.",
      });
    }
  }),
});
