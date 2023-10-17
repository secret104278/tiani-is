import { z } from "zod";
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
          organiser: {
            connect: {
              id: ctx.session.user.id,
            },
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
    .input(z.object({}))
    .query(async ({ ctx }) => {
      if (ctx.session.user.role === "ADMIN") {
        return await ctx.db.volunteerActivity.findMany({});
      }

      return await ctx.db.volunteerActivity.findMany({
        where: {
          OR: [{ status: "PUBLISHED" }, { organiserId: ctx.session.user.id }],
        },
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
                  } 需要審核囉！\n${getActivityDetailURL(input.activityId)}`,
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
            text: `你的志工工作申請 ${
              activity.title
            } 已經通過審核囉！\n${getActivityDetailURL(input.activityId)}`,
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

      const targets = await ctx.db.activityAdvertisingTarget.findMany();

      await Promise.all(
        targets.map((target) =>
          ctx.bot.pushMessage({
            to: target.lineId,
            messages: [
              {
                type: "text",
                text: `有新的志工工作 ${
                  activity.title
                }，快來報名吧！\n${getActivityDetailURL(input.activityId)}`,
              },
            ],
          }),
        ),
      );
    }),

  participateActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          participants: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      const organizer = await ctx.db.user.findFirstOrThrow({
        select: {
          name: true,
          accounts: { select: { providerAccountId: true } },
        },
        where: {
          id: activity.organiserId,
          accounts: { every: { provider: "line" } },
        },
      });

      const userLineAccount = await ctx.db.account.findFirst({
        select: { providerAccountId: true },
        where: {
          userId: ctx.session.user.id,
          provider: "line",
        },
      });

      if (userLineAccount)
        await ctx.bot.pushMessage({
          to: userLineAccount.providerAccountId,
          messages: [
            {
              type: "text",
              text: `你完成報名了 ${organizer.name} 主辦的志工工作 ${
                activity.title
              }！\n${getActivityDetailURL(input.activityId)}`,
            },
          ],
        });

      if (organizer.accounts[0])
        await ctx.bot.pushMessage({
          to: organizer.accounts[0].providerAccountId,
          messages: [
            {
              type: "text",
              text: `${ctx.session.user.name} 報名了你主辦的志工工作 ${
                activity.title
              }！\n${getActivityDetailURL(input.activityId)}`,
            },
          ],
        });
    }),

  leaveActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          participants: {
            disconnect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      const organizer = await ctx.db.user.findFirstOrThrow({
        select: {
          name: true,
          accounts: { select: { providerAccountId: true } },
        },
        where: {
          id: activity.organiserId,
          accounts: { every: { provider: "line" } },
        },
      });

      const userLineAccount = await ctx.db.account.findFirst({
        select: { providerAccountId: true },
        where: {
          userId: ctx.session.user.id,
          provider: "line",
        },
      });

      if (userLineAccount)
        await ctx.bot.pushMessage({
          to: userLineAccount.providerAccountId,
          messages: [
            {
              type: "text",
              text: `你取消報名了 ${organizer.name} 主辦的志工工作 ${
                activity.title
              }！\n${getActivityDetailURL(input.activityId)}`,
            },
          ],
        });

      if (organizer.accounts[0])
        await ctx.bot.pushMessage({
          to: organizer.accounts[0].providerAccountId,
          messages: [
            {
              type: "text",
              text: `${ctx.session.user.name} 取消報名了你主辦的志工工作 ${
                activity.title
              }！\n${getActivityDetailURL(input.activityId)}`,
            },
          ],
        });
    }),
});
