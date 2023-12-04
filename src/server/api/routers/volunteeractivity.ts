import { Prisma, PrismaClient } from "@prisma/client";
import { isNil, sum } from "lodash";
import { z } from "zod";

import moment from "moment-timezone";
import { approveActivityEventQueue } from "~/server/queue/approveActivity";
import { leaveActivityEventQueue } from "~/server/queue/leaveActivity";
import { participateActivityEventQueue } from "~/server/queue/participateActivity";
import { reviewActivityNotificationEventQueue } from "~/server/queue/reviewActivityNotification";
import type { ActivityCheckInHistory, CheckRecord } from "~/utils/types";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  activityIsOnGoing,
  getDistance,
} from "~/utils/ui";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function getCasualCheckHistories(db: PrismaClient, userId: string) {
  return db.casualCheckRecord.findMany({
    select: {
      id: true,
      checkInAt: true,
      checkOutAt: true,
    },
    where: {
      userId: userId,
    },
    orderBy: {
      checkInAt: "desc",
    },
  });
}

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
        select: { status: true, organiserId: true },
        where: {
          id: input.id,
        },
      });

      const isManager =
        ctx.session.user.id === orgActivity.organiserId ||
        ctx.session.user.role.is_volunteer_admin;
      if (!isManager) throw new Error("只有管理員可以修改活動");

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
          ctx.session.user.role.is_volunteer_admin);

      if (res?.status !== "PUBLISHED" && !isManager)
        return { activity: null, isParticipant: false };

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
      if (!ctx.session.user.role.is_tiani_admin) {
        throw new Error("Only tiani admins can approve activities");
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
      return ctx.db.volunteerActivityCheckRecord.findUnique({
        where: {
          userId_activityId: {
            userId: ctx.session.user.id,
            activityId: input.activityId,
          },
        },
      });
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

      const now = new Date();
      if (
        !activityIsOnGoing(activity.startDateTime, activity.endDateTime, now)
      ) {
        throw new Error("非工作時間，無法簽到");
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
        },
      });

      if (checkin) {
        await ctx.db.volunteerActivityCheckRecord.upsert({
          where: {
            id: checkin.id,
          },
          update: {
            checkOutAt: now,
            checkOutLatitude: input.latitude,
            checkOutLongitude: input.longitude,
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

            checkOutAt: now,
            checkOutLatitude: input.latitude,
            checkOutLongitude: input.longitude,
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
            checkInAt: now,
            checkInLatitude: input.latitude,
            checkInLongitude: input.longitude,
          },
        });
      }
    }),

  casualCheckIn: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const isOutOfRange = !TIANI_GPS_CENTERS.some(
        (center) =>
          getDistance(input.latitude, input.longitude, center[0], center[1]) <=
          TIANI_GPS_RADIUS_KM,
      );
      if (isOutOfRange) throw new Error("超出打卡範圍");

      const taipeiMoment = moment.tz("Asia/Taipei");
      const now = taipeiMoment.clone().tz(moment.tz.guess()).toDate();

      taipeiMoment.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      const targetMoment = taipeiMoment.clone().tz(moment.tz.guess());

      const latestCheck = await ctx.db.casualCheckRecord.findFirst({
        where: {
          userId: ctx.session.user.id,
          checkInAt: {
            gte: targetMoment.toDate(),
          },
        },
        orderBy: {
          checkInAt: "desc",
        },
      });

      if (latestCheck?.checkOutAt === null) {
        await ctx.db.casualCheckRecord.update({
          where: {
            id: latestCheck.id,
          },
          data: {
            checkOutAt: now,
            checkOutLatitude: input.latitude,
            checkOutLongitude: input.longitude,
          },
        });
      } else {
        await ctx.db.casualCheckRecord.create({
          data: {
            user: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            checkInAt: now,
            checkInLatitude: input.latitude,
            checkInLongitude: input.longitude,
          },
        });
      }
    }),

  getLatestCasualCheckIn: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const taipeiMoment = moment.tz("Asia/Taipei");
      taipeiMoment.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
      const targetMoment = taipeiMoment.clone().tz(moment.tz.guess());

      return await ctx.db.casualCheckRecord.findFirst({
        where: {
          userId: ctx.session.user.id,
          checkInAt: {
            gte: targetMoment.toDate(),
          },
        },
        orderBy: {
          checkInAt: "desc",
        },
      });
    }),

  getCasualCheckHistories: protectedProcedure
    .input(
      z.object({
        userId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_volunteer_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以查看其他人的工時");

      return await getCasualCheckHistories(
        ctx.db,
        input.userId ?? ctx.session.user.id,
      );
    }),

  getWorkingStats: protectedProcedure
    .input(
      z.object({
        userId: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (
        !ctx.session.user.role.is_volunteer_admin &&
        !isNil(input.userId) &&
        input.userId !== ctx.session.user.id
      )
        throw new Error("只有管理員可以查看其他人的工時");

      function getActivityCheckHistories() {
        return ctx.db.$queryRaw<ActivityCheckInHistory[]>`
        SELECT
          vacr. "activityId",
          vacr. "checkOutAt",
          vacr. "checkInAt",
          va. "title",
          va. "startDateTime"
        FROM
          "VolunteerActivityCheckRecord" AS vacr
          JOIN "VolunteerActivity" AS va ON vacr. "activityId" = va.id
        WHERE
          vacr. "userId" = ${input.userId ?? ctx.session.user.id}
          AND vacr. "checkOutAt" IS NOT NULL
        ORDER BY
          va. "startDateTime" DESC;
        `;
      }

      const [activityCheckHistories, casualCheckHistories] = await Promise.all([
        getActivityCheckHistories(),
        getCasualCheckHistories(ctx.db, input.userId ?? ctx.session.user.id),
      ]);

      const activityWorkingHours = sum(
        activityCheckHistories.map(
          (record) =>
            (record.checkOutAt.getTime() - record.checkInAt.getTime()) /
            1000 /
            60 /
            60,
        ),
      );

      const casualWorkingHours = sum(
        casualCheckHistories
          .filter((record) => !isNil(record.checkOutAt))
          .map(
            (record) =>
              (record.checkOutAt!.getTime() - record.checkInAt.getTime()) /
              1000 /
              60 /
              60,
          ),
      );

      const totalWorkingHours = activityWorkingHours + casualWorkingHours;

      return {
        activityCheckHistories,
        casualCheckHistories,
        totalWorkingHours,
      };
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

      if (!ctx.session.user.role.is_volunteer_admin)
        throw new Error("只有管理員可以修改打卡紀錄");

      await ctx.db.volunteerActivityCheckRecord.upsert({
        where: {
          userId_activityId: {
            userId: input.userId,
            activityId: input.activityId,
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

          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
        update: {
          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
      });
    }),

  modifyCasualCheckRecord: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        userId: z.string(),
        checkInAt: z.date(),
        checkOutAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_volunteer_admin)
        throw new Error("只有管理員可以修改打卡紀錄");

      if (input.checkInAt > input.checkOutAt) {
        throw new Error("簽退時間必須晚於簽到時間");
      }

      if (input.checkInAt.getTime() == input.checkOutAt.getTime()) {
        await ctx.db.casualCheckRecord.delete({
          where: {
            id: input.id,
          },
        });
        return;
      }

      await ctx.db.casualCheckRecord.update({
        where: {
          id: input.id,
        },
        data: {
          user: {
            connect: {
              id: input.userId,
            },
          },

          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
      });
    }),

  manualCasualCheckRecord: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        checkInAt: z.date(),
        checkOutAt: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_volunteer_admin)
        throw new Error("只有管理員可以修改打卡紀錄");

      if (input.checkInAt >= input.checkOutAt) {
        throw new Error("簽退時間必須晚於簽到時間");
      }

      await ctx.db.casualCheckRecord.create({
        data: {
          user: {
            connect: {
              id: input.userId,
            },
          },

          checkInAt: input.checkInAt,
          checkOutAt: input.checkOutAt,
        },
      });
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
          vacr. "checkInAt",
          vacr. "checkOutAt",
          name AS "userName"
        FROM
          "_ParticipatedVolunteerActivites" AS pva
          LEFT JOIN "VolunteerActivityCheckRecord" AS vacr ON vacr. "userId" = pva. "A"
            AND vacr. "activityId" = pva. "B"
          JOIN "User" ON pva. "A" = "User"."id"
        WHERE
          pva. "B" = ${input.activityId};
        `;
    }),

  getUsersByCheckIn: protectedProcedure
    .input(
      z.object({
        start: z.date().optional(),
        end: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_volunteer_admin)
        throw new Error("只有管理員可以查看工時");

      if (isNil(input.start) && isNil(input.end)) {
        return await ctx.db.user.findMany({
          select: {
            id: true,
            name: true,
          },
        });
      }

      return await ctx.db.$queryRaw<
        {
          id: string;
          name: string;
        }[]
      >`
        SELECT
          u.id,
          u.name
        FROM
          "User" u
          JOIN "CasualCheckRecord" c ON u.id = c. "userId"
          JOIN "VolunteerActivityCheckRecord" v ON u.id = v. "userId"
        WHERE
          ${
            isNil(input.start)
              ? Prisma.sql`true`
              : Prisma.sql`c. "checkInAt" >= ${input.start}`
          } AND ${
            isNil(input.end)
              ? Prisma.sql`true`
              : Prisma.sql`c. "checkInAt" <= ${input.end}`
          }
        GROUP BY
          u.id,
          u.name;
      `;
    }),
});
