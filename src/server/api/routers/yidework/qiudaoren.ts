import { z } from "zod";
import { birthYearSchema, phoneNumberSchema } from "~/utils/phoneValidation";
import { activityManageProcedure } from "../../procedures/yidework";
import { createTRPCRouter } from "../../trpc";
import { type TempleGender, calculateTempleGender } from "./templeGenderUtils";

export const qiudaorenRouter = createTRPCRouter({
  createQiudaoren: activityManageProcedure
    .input(
      z.object({
        activityId: z.number(),
        name: z.string().min(1),
        gender: z.enum(["MALE", "FEMALE"]),
        birthYear: birthYearSchema,
        phone: phoneNumberSchema,
        yinShi: z.string().optional(),
        yinShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
        yinShiPhone: phoneNumberSchema,
        baoShi: z.string().optional(),
        baoShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
        baoShiPhone: phoneNumberSchema,
      }),
    )
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
        },
      });

      return user;
    }),

  updateQiudaoren: activityManageProcedure
    .input(
      z.object({
        activityId: z.number(),
        userId: z.string(),
        name: z.string().min(1).optional(),
        gender: z.enum(["MALE", "FEMALE"]).optional(),
        birthYear: birthYearSchema.optional(),
        phone: phoneNumberSchema,
        yinShi: z.string().optional(),
        yinShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
        yinShiPhone: phoneNumberSchema,
        baoShi: z.string().optional(),
        baoShiGender: z.enum(["MALE", "FEMALE"]).nullish(),
        baoShiPhone: phoneNumberSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activityId, userId, ...updateData } = input;

      await ctx.db.user.update({
        where: { id: userId },
        data: updateData,
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

  getQiudaorenByActivity: activityManageProcedure.query(
    async ({ ctx, input }) => {
      const qiudaoren = await ctx.db.qiudaorenOnActivity.findMany({
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
        },
      });

      const grouped: Record<TempleGender, typeof qiudaoren> = {
        QIAN: [],
        TONG: [],
        KUN: [],
        NV: [],
      };

      for (const item of qiudaoren) {
        const templeGender = calculateTempleGender(
          item.user.gender,
          item.user.birthYear,
        );
        if (templeGender) {
          grouped[templeGender].push(item);
        }
      }

      return grouped;
    },
  ),

  searchQiudaoren: activityManageProcedure
    .input(
      z.object({
        activityId: z.number(),
        searchTerm: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.user.findMany({
        where: {
          name: {
            contains: input.searchTerm,
            mode: "insensitive",
          },
          gender: { not: null },
          birthYear: { not: null },
        },
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
        take: 20,
      });

      return users.map((user) => ({
        ...user,
        templeGender: calculateTempleGender(user.gender, user.birthYear),
      }));
    }),
});
