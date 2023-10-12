import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const volunteerActivityRouter = createTRPCRouter({
  createActivity: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        headcount: z.number(),
        location: z.string(),
        startDateTime: z.date(),
        endDateTime: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.volunteerActivity.create({
        data: {
          title: input.title,
          description: input.description,
          headcount: input.headcount,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          organiser: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
        include: {
          organiser: true,
        },
      });
    }),

  getActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.volunteerActivity.findUnique({
        where: { id: input.id },
      });
    }),

  getOrganizedActivities: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.db.volunteerActivity.findMany({
        where: { organiserId: ctx.session.user.id },
      });
    }),

  submitActivityForReview: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.volunteerActivity.findUniqueOrThrow({
        where: { id: input.activityId },
      });

      if (ctx.session.user.id !== activity.organiserId) {
        throw new Error("Only organizer can submit activities for review");
      }

      await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          status: "INREVIEW",
        },
      });
    }),

  sendReviewNotification: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.volunteerActivity.findUniqueOrThrow({
        where: { id: input.activityId },
      });

      if (activity.organiserId !== ctx.session.user.id) {
        throw new Error("Only organizer can send review notification");
      }

      await ctx.bot.pushMessage({
        to: "U2e7b3e36921c71636fb4ab3ee49baa62",
        messages: [
          {
            type: "text",
            text: `有新的志工活動申請 ${activity.title} 需要審核囉`,
          },
        ],
      });
    }),

  approveActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new Error("Only admins can approve activities");
      }

      const activity = await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          status: "PUBLISHED",
        },
      });

      const lineAccount = await ctx.db.account.findFirstOrThrow({
        select: { providerAccountId: true },
        where: { userId: activity.organiserId, provider: "line" },
      });

      await ctx.bot.pushMessage({
        to: lineAccount.providerAccountId,
        messages: [
          {
            type: "text",
            text: `你的志工活動申請 ${activity.title} 已經通過審核囉`,
          },
        ],
      });
    }),

  sendActivityAdvertisement: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.volunteerActivity.findUniqueOrThrow({
        where: { id: input.activityId },
      });

      if (
        ctx.session.user.id !== activity.organiserId &&
        ctx.session.user.role !== "ADMIN"
      ) {
        throw new Error("Only organizer or admin can advertise activities");
      }

      await ctx.bot.pushMessage({
        to: "U2e7b3e36921c71636fb4ab3ee49baa62",
        messages: [
          {
            type: "text",
            text: `有新的志工活動 ${activity.title} ，快來報名吧！`,
          },
        ],
      });
    }),
});
