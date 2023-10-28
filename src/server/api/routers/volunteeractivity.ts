import type { Prisma } from "@prisma/client";
import { isNil, sum } from "lodash";
import { z } from "zod";

import { approveActivityEventQueue } from "~/server/queue/approveActivity";
import { leaveActivityEventQueue } from "~/server/queue/leaveActivity";
import { participateActivityEventQueue } from "~/server/queue/participateActivity";
import type { CheckInHistory, CheckRecord } from "~/utils/types";
import { TIANI_GPS_CENTER, TIANI_GPS_RADIUS_KM, getDistance } from "~/utils/ui";
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

  getAllActivitiesInfinite: protectedProcedure
    .input(
      z.object({
        organizedByMe: z.boolean().optional(),
        participatedByMe: z.boolean().optional(),

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
        if (ctx.session.user.role !== "ADMIN") {
          filters.push({ status: "PUBLISHED" });
          filters.push({ organiserId: ctx.session.user.id });
        }
      }

      const items = await ctx.db.volunteerActivity.findMany({
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

  getCheckInActivityHistory: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const first = await ctx.db.volunteerActivityCheckIn.findFirst({
        where: {
          activityId: input.activityId,
          userId: ctx.session.user.id,
        },
        orderBy: {
          checkAt: "asc",
        },
      });
      const last = await ctx.db.volunteerActivityCheckIn.findFirst({
        where: {
          activityId: input.activityId,
          userId: ctx.session.user.id,
        },
        orderBy: {
          checkAt: "desc",
        },
      });

      if (!isNil(first) && !isNil(last)) {
        if (last.id === first.id) return { first, last: null };
        return { first, last };
      }
      return null;
    }),

  checkInActivity: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        activityId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.volunteerActivity.findUniqueOrThrow({
        where: { id: input.activityId },
      });

      const TWO_HOUR = 2 * 60 * 60 * 1000;
      const now = new Date();
      if (
        now.getUTCMilliseconds() - activity.startDateTime.getUTCMilliseconds() <
          -TWO_HOUR ||
        now.getUTCMilliseconds() - activity.endDateTime.getUTCMilliseconds() >
          TWO_HOUR
      ) {
        throw new Error("非活動時間，無法簽到");
      }

      const isOutOfRange =
        getDistance(
          input.latitude,
          input.longitude,
          TIANI_GPS_CENTER[0],
          TIANI_GPS_CENTER[1],
        ) > TIANI_GPS_RADIUS_KM;
      if (isOutOfRange) throw new Error("超出打卡範圍");

      await ctx.db.volunteerActivityCheckIn.create({
        data: {
          activity: {
            connect: {
              id: input.activityId,
            },
          },
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });
    }),

  getWorkingStats: protectedProcedure
    .input(
      z.object({
        userId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "ADMIN" &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以查看其他人的工時");

      async function getCheckInHistories() {
        return await ctx.db.$queryRaw<CheckInHistory[]>`
        SELECT
          a.*,
          b.title,
          b. "startDateTime"
        FROM (
          SELECT
            max("checkAt") AS checkOutAt,
            min("checkAt") AS checkInAt,
            "activityId"
          FROM
            "VolunteerActivityCheckIn"
          WHERE
            "userId" = ${input.userId ?? ctx.session.user.id}
          GROUP BY
            "activityId") AS a
          JOIN "VolunteerActivity" AS b ON a. "activityId" = b.id
        ORDER BY
          b. "startDateTime" DESC;
        `;
      }

      const checkInHistories = await getCheckInHistories();

      const totalWorkingHours = sum(
        checkInHistories.map(
          (record) =>
            (record.checkoutat.getTime() - record.checkinat.getTime()) /
            1000 /
            60 /
            60,
        ),
      );

      return { checkInHistories, totalWorkingHours };
    }),

  getActivityCheckRecords: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.$queryRaw<CheckRecord[]>`
        SELECT
          a.*,
          name,
          image
        FROM (
          SELECT
            max("checkAt") AS checkOutAt,
            min("checkAt") AS checkInAt,
            "A"
          FROM
            "_ParticipatedVolunteerActivites"
          LEFT JOIN "VolunteerActivityCheckIn" ON "A" = "userId"
            AND "B" = "activityId"
          JOIN "User" ON "A" = "User"."id"
        WHERE
          "B" = ${input.activityId}
        GROUP BY
          "A",
          "B") AS a
          JOIN "User" ON "A" = "id"
        `;
    }),
});
