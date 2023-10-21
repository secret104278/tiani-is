import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { approveActivityEventQueue } from "~/server/queue/approveActivity";
import { leaveActivityEventQueue } from "~/server/queue/leaveActivity";
import { participateActivityEventQueue } from "~/server/queue/participateActivity";
import { getActivityDetailURL } from "~/utils/url";
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
        isDraft: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.volunteerActivity.create({
        data: {
          title: input.title,
          description: input.description,
          headcount: input.headcount,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          status: input.isDraft ? "DRAFT" : "INREVIEW",
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

  updateActivity: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string(),
        description: z.string().nullable(),
        headcount: z.number(),
        location: z.string(),
        startDateTime: z.date(),
        endDateTime: z.date(),
        isDraft: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.volunteerActivity.update({
        where: {
          id: input.id,
        },
        data: {
          title: input.title,
          description: input.description,
          headcount: input.headcount,
          location: input.location,
          startDateTime: input.startDateTime,
          endDateTime: input.endDateTime,
          status: input.isDraft ? "DRAFT" : undefined,
          version: {
            increment: 1,
          },
        },
      });
    }),

  deleteActivity: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.volunteerActivity.delete({
        where: { id: input.id },
      });
    }),

  getActivity: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const res = await ctx.db.volunteerActivity.findUnique({
        where: { id: input.id },
        include: {
          organiser: true,
          participants: true,
        },
      });

      const isParticipant =
        res?.participants.find((p) => p.id === ctx.session.user.id) !==
        undefined;

      const isManager =
        res &&
        (ctx.session.user.id === res.organiserId ||
          ctx.session.user.role === "ADMIN");

      if (res?.status !== "PUBLISHED" && !isManager)
        return { activity: null, isParticipant: false };

      if (!isManager) {
        // always join participants and hide participants if not organizer for convenience
        res.participants = [];
      }

      return { activity: res, isParticipant: isParticipant };
    }),

  getAllActivities: protectedProcedure
    .input(
      z.object({
        organizedByMe: z.boolean().optional(),
        participatedByMe: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const filters: Prisma.VolunteerActivityWhereInput[] = [];
      if (input.organizedByMe) {
        filters.push({ organiserId: ctx.session.user.id });
      }
      if (input.participatedByMe) {
        filters.push({ participants: { some: { id: ctx.session.user.id } } });
      }

      if (filters.length === 0) {
        if (ctx.session.user.role !== "ADMIN") {
          filters.push({ status: "PUBLISHED" });
          filters.push({ organiserId: ctx.session.user.id });
        }
      }

      return await ctx.db.volunteerActivity.findMany({
        where: filters.length === 0 ? undefined : { OR: filters },
        orderBy: { startDateTime: "desc" },
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
        include: {
          organiser: true,
        },
      });

      if (activity.organiserId !== ctx.session.user.id) {
        throw new Error("Only organizer can send review notification");
      }

      const reviewers = await ctx.db.activityReviewer.findMany({
        select: {
          user: {
            select: {
              accounts: {
                select: {
                  providerAccountId: true,
                },
              },
            },
          },
        },
        where: {
          user: {
            accounts: {
              every: {
                provider: "line",
              },
            },
          },
        },
      });

      await Promise.all(
        reviewers
          .flatMap((reviewer) => reviewer.user.accounts)
          .map((account) =>
            ctx.bot.pushMessage({
              to: account.providerAccountId,
              messages: [
                {
                  type: "text",
                  text: `有新的志工工作申請 ${activity.title} 來自 ${
                    activity.organiser.name
                  } 需要審核囉！\n${getActivityDetailURL(activity)}`,
                },
              ],
            }),
          ),
      );
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

      await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          status: "PUBLISHED",
        },
      });

      void approveActivityEventQueue.push({ activityId: input.activityId });
    }),

  // sendActivityAdvertisement: protectedProcedure
  //   .input(
  //     z.object({
  //       activityId: z.number(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const activity = await ctx.db.volunteerActivity.findUniqueOrThrow({
  //       where: { id: input.activityId },
  //     });

  //     if (
  //       ctx.session.user.id !== activity.organiserId &&
  //       ctx.session.user.role !== "ADMIN"
  //     ) {
  //       throw new Error("Only organizer or admin can advertise activities");
  //     }

  //     const targets = await ctx.db.activityAdvertisingTarget.findMany();

  //     await Promise.all(
  //       targets.map((target) =>
  //         ctx.bot.pushMessage({
  //           to: target.lineId,
  //           messages: [
  //             {
  //               type: "text",
  //               text: `有新的志工工作 ${
  //                 activity.title
  //               }，快來報名吧！\n${getActivityDetailURL(input.activityId)}`,
  //             },
  //           ],
  //         }),
  //       ),
  //     );
  //   }),

  participateActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          participants: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      void participateActivityEventQueue.push({
        activityId: input.activityId,
        user: ctx.session.user,
      });
    }),

  leaveActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          participants: {
            disconnect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      void leaveActivityEventQueue.push({
        activityId: input.activityId,
        user: ctx.session.user,
      });
    }),
});
