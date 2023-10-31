import { VolunteerActivityCheckRecordType, type Prisma } from "@prisma/client";
import { isNil, sum } from "lodash";
import { z } from "zod";

import { approveActivityEventQueue } from "~/server/queue/approveActivity";
import { leaveActivityEventQueue } from "~/server/queue/leaveActivity";
import { participateActivityEventQueue } from "~/server/queue/participateActivity";
import { reviewActivityNotificationEventQueue } from "~/server/queue/reviewActivityNotification";
import type { CheckInHistory, CheckRecord } from "~/utils/types";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  getDistance,
} from "~/utils/ui";
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
      const orgActivity = await ctx.db.volunteerActivity.findUniqueOrThrow({
        select: { status: true },
        where: {
          id: input.id,
        },
      });

      const res = await ctx.db.volunteerActivity.update({
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

      if (!input.isDraft && orgActivity.status === "DRAFT")
        void reviewActivityNotificationEventQueue.push({
          activityId: input.id,
        });

      return res;
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

      if (!isManager && !isParticipant) {
        // always join participants and hide participants if not organizer or participant for convenience
        res.participants = [];
      }

      return { activity: res, isParticipant: isParticipant };
    }),

  // getAllActivities: protectedProcedure
  //   .input(
  //     z.object({
  //       organizedByMe: z.boolean().optional(),
  //       participatedByMe: z.boolean().optional(),
  //     }),
  //   )
  //   .query(async ({ ctx, input }) => {
  //     const filters: Prisma.VolunteerActivityWhereInput[] = [];
  //     if (input.organizedByMe) {
  //       filters.push({ organiserId: ctx.session.user.id });
  //     }
  //     if (input.participatedByMe) {
  //       filters.push({ participants: { some: { id: ctx.session.user.id } } });
  //     }

  //     if (filters.length === 0) {
  //       if (ctx.session.user.role !== "ADMIN") {
  //         filters.push({ status: "PUBLISHED" });
  //         filters.push({ organiserId: ctx.session.user.id });
  //       }
  //     }

  //     return await ctx.db.volunteerActivity.findMany({
  //       where: filters.length === 0 ? undefined : { OR: filters },
  //       orderBy: { startDateTime: "desc" },
  //     });
  //   }),

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
        if (ctx.session.user.role !== "ADMIN") {
          filters.push({ status: "PUBLISHED" });
          filters.push({ organiserId: ctx.session.user.id });
        }
      }

      const items = await ctx.db.volunteerActivity.findMany({
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
        },

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
        select: { organiserId: true },
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

      await reviewActivityNotificationEventQueue.push({
        activityId: input.activityId,
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
        select: { organiserId: true },
        where: { id: input.activityId },
      });

      if (activity.organiserId !== ctx.session.user.id)
        throw new Error("Only organizer can send review notification");

      await reviewActivityNotificationEventQueue.push({
        activityId: input.activityId,
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
      const [checkin, checkout] = await Promise.all([
        ctx.db.volunteerActivityCheckRecord.findUnique({
          where: {
            userId_activityId_type: {
              userId: ctx.session.user.id,
              activityId: input.activityId,
              type: VolunteerActivityCheckRecordType.CHECKIN,
            },
          },
        }),
        ctx.db.volunteerActivityCheckRecord.findUnique({
          where: {
            userId_activityId_type: {
              userId: ctx.session.user.id,
              activityId: input.activityId,
              type: VolunteerActivityCheckRecordType.CHECKOUT,
            },
          },
        }),
      ]);

      if (!isNil(checkin)) {
        return { checkin, checkout };
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

      const isOutOfRange = !TIANI_GPS_CENTERS.some(
        (center) =>
          getDistance(input.latitude, input.longitude, center[0], center[1]) <=
          TIANI_GPS_RADIUS_KM,
      );
      if (isOutOfRange) throw new Error("超出打卡範圍");

      const checkin = await ctx.db.volunteerActivityCheckRecord.findFirst({
        where: {
          activityId: input.activityId,
          userId: ctx.session.user.id,
          type: VolunteerActivityCheckRecordType.CHECKIN,
        },
      });

      if (checkin) {
        await ctx.db.volunteerActivityCheckRecord.upsert({
          where: {
            userId_activityId_type: {
              userId: ctx.session.user.id,
              activityId: input.activityId,
              type: VolunteerActivityCheckRecordType.CHECKOUT,
            },
          },
          update: {
            checkAt: now,
            latitude: input.latitude,
            longitude: input.longitude,
          },
          create: {
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            activity: {
              connect: {
                id: input.activityId,
              },
            },
            type: VolunteerActivityCheckRecordType.CHECKOUT,
            checkAt: now,
            latitude: input.latitude,
            longitude: input.longitude,
          },
        });
      } else {
        await ctx.db.volunteerActivityCheckRecord.create({
          data: {
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            activity: {
              connect: {
                id: input.activityId,
              },
            },
            type: VolunteerActivityCheckRecordType.CHECKIN,
            checkAt: now,
            latitude: input.latitude,
            longitude: input.longitude,
          },
        });
      }
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
          r1. "activityId",
          r1. "checkAt" AS checkOutAt,
          r2. "checkAt" AS checkInAt,
          va. "title",
          va. "startDateTime"
        FROM
          "VolunteerActivityCheckRecord" AS r1
          JOIN "VolunteerActivityCheckRecord" AS r2 ON r1. "userId" = r2. "userId"
            AND r1. "activityId" = r2. "activityId"
            AND r1. "type" = 'CHECKOUT'
            AND r2. "type" = 'CHECKIN'
          JOIN "VolunteerActivity" AS va ON r1. "activityId" = va.id
          WHERE r1. "userId" = ${input.userId ?? ctx.session.user.id}
        ORDER BY
          va. "startDateTime" DESC;
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

  modifyActivityCheckRecord: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        userId: z.string(),
        checkInAt: z.date(),
        checkOutAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.checkInAt >= input.checkOutAt) {
        throw new Error("簽退時間必須晚於簽到時間");
      }

      const activity = await ctx.db.volunteerActivity.findUniqueOrThrow({
        select: { organiserId: true },
        where: { id: input.activityId },
      });

      if (
        !(
          ctx.session.user.role === "ADMIN" ||
          ctx.session.user.id === activity.organiserId
        )
      )
        throw new Error("只有管理員可以修改打卡紀錄");

      const upsertCheckIn = ctx.db.volunteerActivityCheckRecord.upsert({
        where: {
          userId_activityId_type: {
            userId: input.userId,
            activityId: input.activityId,
            type: VolunteerActivityCheckRecordType.CHECKIN,
          },
        },
        create: {
          user: {
            connect: {
              id: input.userId,
            },
          },
          activity: {
            connect: {
              id: input.activityId,
            },
          },
          type: VolunteerActivityCheckRecordType.CHECKIN,
          checkAt: input.checkInAt,
        },
        update: {
          checkAt: input.checkInAt,
        },
      });

      const upsertCheckOut = ctx.db.volunteerActivityCheckRecord.upsert({
        where: {
          userId_activityId_type: {
            userId: input.userId,
            activityId: input.activityId,
            type: VolunteerActivityCheckRecordType.CHECKOUT,
          },
        },
        create: {
          user: {
            connect: {
              id: input.userId,
            },
          },
          activity: {
            connect: {
              id: input.activityId,
            },
          },
          type: VolunteerActivityCheckRecordType.CHECKOUT,
          checkAt: input.checkOutAt,
        },
        update: {
          checkAt: input.checkOutAt,
        },
      });

      await ctx.db.$transaction([upsertCheckIn, upsertCheckOut]);
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
          pva. "A" AS "userId",
          pva. "B" AS "activityId",
          r1. "checkAt" AS checkOutAt,
          r2. "checkAt" AS checkInAt,
          name AS "userName",
          image
        FROM
          "_ParticipatedVolunteerActivites" AS pva
          LEFT JOIN "VolunteerActivityCheckRecord" AS r1 ON r1. "userId" = pva. "A"
            AND r1. "activityId" = pva. "B"
            AND r1. "type" = 'CHECKOUT'
          LEFT JOIN "VolunteerActivityCheckRecord" AS r2 ON r2. "userId" = pva. "A"
            AND r2. "activityId" = pva. "B"
            AND r2. "type" = 'CHECKIN'
          JOIN "User" ON pva. "A" = "User"."id"
        WHERE
          pva. "B" = ${input.activityId};
        `;
    }),
});
