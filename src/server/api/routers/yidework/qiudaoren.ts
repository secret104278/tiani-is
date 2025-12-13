import { z } from "zod";
import { birthYearSchema, phoneNumberSchema } from "~/utils/phoneValidation";
import { activityManageProcedure } from "../../procedures/yidework";
import { createTRPCRouter } from "../../trpc";

const qiudaorenSchema = z.object({
  activityId: z.number(),
  name: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE"]),
  birthYear: birthYearSchema,
  phone: phoneNumberSchema.optional(),
  yinShi: z.string().min(1),
  yinShiGender: z.enum(["MALE", "FEMALE"]),
  yinShiPhone: phoneNumberSchema.optional(),
  baoShi: z.string().min(1),
  baoShiGender: z.enum(["MALE", "FEMALE"]),
  baoShiPhone: phoneNumberSchema.optional(),
});

export const qiudaorenRouter = createTRPCRouter({
  createQiudaoren: activityManageProcedure
    .input(qiudaorenSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          gender: input.gender,
          birthYear: input.birthYear,
          phone: input.phone,
          yinShi: input.yinShi,
          yinShiGender: input.yinShiGender,
          yinShiPhone: input.yinShiPhone,
          baoShi: input.baoShi,
          baoShiGender: input.baoShiGender,
          baoShiPhone: input.baoShiPhone,
        },
      });

      await ctx.db.qiudaorenOnActivity.create({
        data: {
          userId: user.id,
          activityId: input.activityId,
          createdById: ctx.session.user.id,
        },
      });

      return user;
    }),

  updateQiudaoren: activityManageProcedure
    .input(
      qiudaorenSchema.extend({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activityId, userId, ...updateData } = input;

      await ctx.db.user.update({
        where: { id: userId },
        data: updateData,
      });

      await ctx.db.qiudaorenOnActivity.update({
        where: {
          userId_activityId: {
            userId,
            activityId,
          },
        },
        data: {
          updatedById: ctx.session.user.id,
        },
      });

      return ctx.db.user.findUnique({
        where: { id: userId },
      });
    }),

  deleteQiudaoren: activityManageProcedure
    .input(
      z.object({
        activityId: z.number(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.qiudaorenOnActivity.delete({
        where: {
          userId_activityId: {
            userId: input.userId,
            activityId: input.activityId,
          },
        },
      });
    }),

  getQiudaorensByActivity: activityManageProcedure.query(
    async ({ ctx, input }) => {
      const qiudaorens = await ctx.db.qiudaorenOnActivity.findMany({
        where: { activityId: input.activityId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              gender: true,
              birthYear: true,
              phone: true,
              yinShi: true,
              yinShiGender: true,
              yinShiPhone: true,
              baoShi: true,
              baoShiGender: true,
              baoShiPhone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return qiudaorens;
    },
  ),

  getQiudaorensByActivityAndCreatedBy: activityManageProcedure.query(
    async ({ ctx, input }) => {
      const qiudaorens = await ctx.db.qiudaorenOnActivity.findMany({
        where: {
          activityId: input.activityId,
          createdById: ctx.session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              gender: true,
              birthYear: true,
              phone: true,
              yinShi: true,
              yinShiGender: true,
              yinShiPhone: true,
              baoShi: true,
              baoShiGender: true,
              baoShiPhone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return qiudaorens;
    },
  ),

  toggleCheckIn: activityManageProcedure
    .input(
      z.object({
        activityId: z.number(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const qiudaoren = await ctx.db.qiudaorenOnActivity.findUniqueOrThrow({
        where: {
          userId_activityId: {
            userId: input.userId,
            activityId: input.activityId,
          },
        },
      });

      const newCheckInDate = qiudaoren.checkInDate ? null : new Date();

      await ctx.db.qiudaorenOnActivity.update({
        where: {
          userId_activityId: {
            userId: input.userId,
            activityId: input.activityId,
          },
        },
        data: {
          checkInDate: newCheckInDate,
        },
      });

      return { checkInDate: newCheckInDate };
    }),
});
