import { z } from "zod";
import { isValidQrToken } from "~/config/checkin";
import {
  activityManageProcedure,
  activityPublishedOnlyProcedure,
  representableProcedure,
} from "../../procedures/etogether";
import { createTRPCRouter } from "../../trpc";

export const checkinRouter = createTRPCRouter({
  checkInActivityMainRegister: activityPublishedOnlyProcedure
    .input(
      z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        qrToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasValidGeo =
        !Number.isNaN(input.latitude) && !Number.isNaN(input.longitude);
      const hasValidQr = !!(input.qrToken && isValidQrToken(input.qrToken));

      if (!hasValidGeo && !hasValidQr) {
        throw new Error("無效的檢查方式");
      }

      return ctx.db.$transaction(async (db) => {
        const mainRegister =
          await db.etogetherActivityRegister.findUniqueOrThrow({
            where: {
              userId_activityId: {
                userId: ctx.session.user.id,
                activityId: input.activityId,
              },
            },
            include: {
              externalRegisters: {
                select: {
                  id: true,
                },
              },
            },
          });

        await db.etogetherActivityCheckRecord.create({
          data: {
            registerId: mainRegister.id,

            latitude: input.latitude,
            longitude: input.longitude,
          },
        });

        await db.externalEtogetherActivityCheckRecord.createMany({
          data: mainRegister.externalRegisters.map((e) => ({
            registerId: e.id,
          })),
        });
      });
    }),

  checkInActivityIndividually: activityManageProcedure
    .input(
      z.object({
        activityId: z.number(),
        registerId: z.number(),
        isExternal: z.boolean(),
        checked: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.checked) {
        if (input.isExternal) {
          await ctx.db.externalEtogetherActivityCheckRecord.upsert({
            where: {
              registerId: input.registerId,
            },
            create: {
              register: {
                connect: {
                  id: input.registerId,
                },
              },
            },
            update: {},
          });
        } else {
          await ctx.db.etogetherActivityCheckRecord.upsert({
            where: {
              registerId: input.registerId,
            },
            create: {
              register: {
                connect: {
                  id: input.registerId,
                },
              },
            },
            update: {},
          });
        }
      } else {
        if (input.isExternal) {
          await ctx.db.externalEtogetherActivityCheckRecord.delete({
            where: {
              registerId: input.registerId,
            },
          });
        } else {
          await ctx.db.etogetherActivityCheckRecord.delete({
            where: {
              registerId: input.registerId,
            },
          });
        }
      }
    }),

  getCheckRecord: representableProcedure
    .input(
      z.object({
        activityId: z.number(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.db.etogetherActivityRegister.findUnique({
        where: {
          userId_activityId: {
            userId: ctx.input.userId,
            activityId: input.activityId,
          },
        },
        select: {
          checkRecord: true,
          externalRegisters: {
            select: {
              checkRecord: true,
            },
          },
        },
      }),
    ),
});
