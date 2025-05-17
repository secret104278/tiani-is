import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { approveActivityEventQueue } from "~/server/queue/approveActivity";
import { reviewActivityNotificationEventQueue } from "~/server/queue/reviewActivityNotification";
import {
  activityManageProcedure,
  adminProcedure,
} from "../../procedures/volunteer";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const activityRouter = createTRPCRouter({
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
      const activity = await ctx.db.volunteerActivity.create({
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

      if (!input.isDraft)
        void reviewActivityNotificationEventQueue.push({
          activityId: activity.id,
        });

      return activity;
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
          ctx.session.user.role.is_volunteer_admin);

      if (res?.status !== "PUBLISHED" && !isManager)
        return { activity: null, isParticipant: false };

      return { activity: res, isParticipant: isParticipant };
    }),

  updateActivity: activityManageProcedure
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
      const originActivity = await ctx.db.volunteerActivity.findUniqueOrThrow({
        where: { id: input.activityId },
        select: { status: true },
      });

      const res = await ctx.db.volunteerActivity.update({
        where: {
          id: input.activityId,
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

      if (!input.isDraft && originActivity.status === "DRAFT")
        void reviewActivityNotificationEventQueue.push({
          activityId: input.activityId,
        });

      return res;
    }),

  deleteActivity: activityManageProcedure.mutation(async ({ ctx, input }) =>
    ctx.db.volunteerActivity.delete({
      where: { id: input.activityId },
    }),
  ),

  getAllActivitiesInfinite: protectedProcedure
    .input(
      z.object({
        organizedByMe: z.boolean().optional(),
        participatedByMe: z.boolean().optional(),
        notFull: z.boolean().optional(),

        limit: z.number().min(1).max(100).default(10),
        cursor: z.object({ startDateTime: z.date(), id: z.number() }).nullish(),
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
        if (!ctx.session.user.role.is_volunteer_admin) {
          filters.push({ status: "PUBLISHED" });
          filters.push({ organiserId: ctx.session.user.id });
        }
      }

      const items = await ctx.db.volunteerActivity.findMany({
        // TODO: too many cost to count participants
        // include: {
        //   _count: {
        //     select: {
        //       participants: true,
        //     },
        //   },
        // },

        where: filters.length === 0 ? undefined : { OR: filters },
        orderBy: { startDateTime: "desc" },

        take: input.limit + 1,
        cursor: input.cursor
          ? { startDateTime: input.cursor.startDateTime, id: input.cursor.id }
          : undefined,
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = {
          startDateTime: nextItem!.startDateTime,
          id: nextItem!.id,
        };
      }

      return { items, nextCursor };
    }),

  submitActivityForReview: activityManageProcedure.mutation(
    async ({ ctx, input }) => {
      const res = await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          status: "INREVIEW",
        },
      });

      void reviewActivityNotificationEventQueue.push({
        activityId: input.activityId,
      });

      return res;
    },
  ),

  sendReviewNotification: activityManageProcedure.mutation(({ input }) => {
    void reviewActivityNotificationEventQueue.push({
      activityId: input.activityId,
    });
  }),

  approveActivity: adminProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const res = await ctx.db.volunteerActivity.update({
        where: { id: input.activityId },
        data: {
          status: "PUBLISHED",
        },
      });

      void approveActivityEventQueue.push({ activityId: input.activityId });

      return res;
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
});
