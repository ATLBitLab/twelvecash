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
  logout: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.resHeaders?.resHeaders.set(
      "Set-Cookie",
      `access-token=; Path=/; HttpOnly; SameSite=Strict; Expires ${new Date(0)}`
    );
    return { result: "Success" };
  }),
});
