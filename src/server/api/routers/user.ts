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
});
