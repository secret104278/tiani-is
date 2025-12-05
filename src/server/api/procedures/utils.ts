import type { PrismaClient } from "@prisma/client";
import { isNil } from "lodash";
import { z } from "zod";
import { Site } from "~/utils/ui";
import { enforceUserIsAuthed, trpcContext as t } from "../trpc";

const getActivity = (db: PrismaClient, site: Site, activityId: number) => {
  switch (site) {
    case Site.Volunteer:
      return db.volunteerActivity.findUniqueOrThrow({
        select: { organiserId: true, status: true },
        where: {
          id: activityId,
        },
      });
    case Site.Yideclass:
      return db.classActivity.findUniqueOrThrow({
        select: { organiserId: true, status: true },
        where: {
          id: activityId,
        },
      });
    case Site.Etogether:
      return db.etogetherActivity.findUniqueOrThrow({
        select: { organiserId: true, status: true },
        where: {
          id: activityId,
        },
      });
    case Site.YideWork:
      return db.yideWorkActivity.findUniqueOrThrow({
        select: {
          organiserId: true,
          status: true,
          staffs: { select: { userId: true } },
        },
        where: {
          id: activityId,
        },
      });
    default:
      throw new Error("Invalid site");
  }
};

export const buildCollectActivity = (site: Site) =>
  t.procedure
    .use(enforceUserIsAuthed)
    .input(z.object({ activityId: z.number() }))
    .use(async ({ ctx, input, next }) => {
      const activity = await getActivity(ctx.db, site, input.activityId);

      let isManager =
        ctx.session.user.id === activity.organiserId ||
        ctx.session.user.role[`is_${site}_admin`];

      // Check if user is a staff for YideWork activities
      if (site === Site.YideWork && !isManager && "staffs" in activity) {
        isManager = activity.staffs.some(
          (staff) => staff.userId === ctx.session.user.id,
        );
      }

      return next({
        ctx: {
          activity,
          isManager,
        },
      });
    });

export const buildActivityManageProcedure = (site: Site) =>
  buildCollectActivity(site).use(async ({ ctx, next }) => {
    if (!ctx.isManager) throw new Error("只有管理員可以進行此操作");

    return next();
  });

export const buildActivityRepresentableProcedure = (site: Site) =>
  buildCollectActivity(site)
    .input(z.object({ userId: z.string().optional() }))
    .use(async ({ ctx, input, next }) => {
      if (
        !(
          ctx.isManager ||
          isNil(input.userId) ||
          input.userId === ctx.session.user.id
        )
      )
        throw new Error("只有管理員或本人可以進行此操作");

      return next({
        ctx: {
          input: {
            userId: input.userId ?? ctx.session.user.id,
          },
        },
      });
    });

export const buildActivityPublishedOnlyProcedure = (site: Site) =>
  buildCollectActivity(site).use(async ({ ctx, next }) => {
    if (!(ctx.isManager || ctx.activity.status === "PUBLISHED"))
      throw new Error("只有管理員可以進行此操作");

    return next();
  });

export const buildAdminProcedure = (site: Site | "tiani") =>
  t.procedure.use(enforceUserIsAuthed).use(({ ctx, next }) => {
    if (!ctx.session.user.role[`is_${site}_admin`])
      throw new Error("只有管理員可以進行此操作");

    return next();
  });

export const buildRepresentableProcedure = (site: Site | "tiani") =>
  t.procedure
    .use(enforceUserIsAuthed)
    .input(z.object({ userId: z.string().optional() }))
    .use(({ ctx, input, next }) => {
      if (
        !(
          ctx.session.user.role[`is_${site}_admin`] ||
          isNil(input.userId) ||
          input.userId === ctx.session.user.id
        )
      )
        throw new Error("只有管理員或本人可以進行此操作");

      return next({
        ctx: {
          input: {
            userId: input.userId ?? ctx.session.user.id,
          },
        },
      });
    });
