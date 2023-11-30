import { Role, type PrismaClient, type PrismaPromise } from "@prisma/client";
import { isEmpty, isNil } from "lodash";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { refreshLineToken } from "~/utils/server";
import { trimString } from "~/utils/ui";

const handleSetAdmin =
  (userId: string, role: Role, set: boolean) => async (tx: PrismaClient) => {
    const user = await tx.user.findUniqueOrThrow({
      select: { roles: true },
      where: {
        id: userId,
      },
    });

    let newRoles: Role[] = [];
    if (set) {
      newRoles = [...user.roles, role];
      newRoles = Array.from(new Set(newRoles));
    } else newRoles = user.roles.filter((_role) => role !== _role);

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        roles: newRoles,
      },
    });
  };

export const userRouter = createTRPCRouter({
  getLineImage: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      const user = await ctx.db.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          accounts: {
            select: {
              id: true,
              provider: true,
              providerAccountId: true,
              access_token: true,
              expires_at: true,
              refresh_token: true,
            },
          },
        },
      });

      for (const account of user.accounts) {
        if (account.provider !== "line") {
          continue;
        }

        let accessToken = account.access_token;

        if (
          account.refresh_token &&
          account.expires_at &&
          account.expires_at * 1000 < Date.now()
        ) {
          const {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: newExpiresIn,
          } = await refreshLineToken(account.refresh_token);

          await ctx.db.account.update({
            where: {
              id: account.id,
            },
            data: {
              access_token: newAccessToken,
              refresh_token: newRefreshToken,
              expires_at: Math.floor(Date.now() / 1000) + newExpiresIn,
            },
          });

          accessToken = newAccessToken;
        }

        const res = await fetch("https://api.line.me/v2/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const profile = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return String(profile.pictureUrl);
      }

      return undefined;
    }),

  updateUserProfile: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        image: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          image: input.image,
        },
      });
    }),

  createUser: protectedProcedure
    .input(
      z.object({
        username: z.preprocess(trimString, z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("只有管理員可以新增帳戶");

      if (isEmpty(input.username)) throw new Error("姓名不可為空");

      return await ctx.db.user.create({
        data: {
          name: input.username,
          roles: [],
        },
      });
    }),

  getUser: protectedProcedure
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
        throw new Error("只有管理員可以查看其他人的資料");

      return await ctx.db.user.findUnique({
        select: {
          id: true,
          name: true,
          roles: true,
        },
        where: {
          id: input.userId ?? ctx.session.user.id,
        },
      });
    }),

  getUsers: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    return await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        roles: true,
      },
    });
  }),

  getUsersWithImage: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.db.user.findMany({
        select: {
          id: true,
          name: true,
          image: true,
          roles: true,
        },
      });
    }),

  getActivityReviewers: protectedProcedure
    .input(z.object({}))
    .query(async ({ ctx }) => {
      return await ctx.db.activityReviewer.findMany({
        select: {
          userId: true,
        },
      });
    }),

  setIsTianiAdmin: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("Permission denied");

      const promises: PrismaPromise<unknown>[] = [];

      if (input.isAdmin)
        promises.push(
          ctx.db.activityReviewer.upsert({
            where: { userId: input.userId },
            create: { userId: input.userId },
            update: {},
          }),
        );
      else
        promises.push(
          ctx.db.activityReviewer.deleteMany({
            where: { userId: input.userId },
          }),
        );

      promises.push(
        ctx.db.user.update({
          where: {
            id: input.userId,
          },
          data: {
            roles: input.isAdmin ? [Role.TIANI_ADMIN] : [],
          },
        }),
      );

      await ctx.db.$transaction(promises);
    }),

  setIsVolunteerAdmin: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("Permission denied");

      await ctx.db.$transaction(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        handleSetAdmin(input.userId, Role.VOLUNTEER_ADMIN, input.isAdmin),
      );
    }),

  setIsYideclassAdmin: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user.role.is_tiani_admin)
        throw new Error("Permission denied");

      await ctx.db.$transaction(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        handleSetAdmin(input.userId, Role.YIDECLASS_ADMIN, input.isAdmin),
      );
    }),
});
