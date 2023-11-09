import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getLineImage: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          accounts: {
            select: {
              provider: true,
              providerAccountId: true,
              access_token: true,
            },
          },
        },
      });

      for (const account of user.accounts) {
        if (account.provider !== "line") {
          continue;
        }

        const res = await fetch("https://api.line.me/v2/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const profile = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return String(profile.pictureUrl);
      }

      return undefined;
    }),

  updateUserProfile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        image: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          image: input.image,
        },
      });
    }),

  getUsers: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
      },
    });
  }),

  getUsersWithImage: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
          role: true,
        },
      });
    }),

  getActivityReviewers: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.db.activityReviewer.findMany({
        select: {
          userId: true,
        },
      });
    }),

  setIsAdmin: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // if (ctx.session.user.role !== "ADMIN")
      //   throw new Error("Permission denied");

      return await ctx.db.user.update({
        where: {
          id: input.userId,
        },
        data: {
          role: input.isAdmin ? "ADMIN" : "USER",
        },
      });
    }),

  setIsActivityReviewer: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isReviewer: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // if (ctx.session.user.role !== "ADMIN")
      //   throw new Error("Permission denied");

      if (!input.isReviewer)
        await ctx.db.activityReviewer.deleteMany({
          where: { userId: input.userId },
        });
      else {
        await ctx.db.$transaction([
          ctx.db.activityReviewer.upsert({
            where: { userId: input.userId },
            create: { userId: input.userId },
            update: {},
          }),
          ctx.db.user.update({
            where: {
              id: input.userId,
            },
            data: {
              role: "ADMIN",
            },
          }),
        ]);
      }
    }),
});
