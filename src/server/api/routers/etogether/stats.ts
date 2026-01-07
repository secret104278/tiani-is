import { z } from "zod";
import { adminProcedure } from "../../procedures/etogether";
import { createTRPCRouter } from "../../trpc";

export const statsRouter = createTRPCRouter({
  getActivitiesStats: adminProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const year = input.year;

      const activities = await ctx.db.etogetherActivity.findMany({
        where: year
          ? {
              startDateTime: {
                gte: new Date(`${year}-01-01`),
                lte: new Date(`${year}-12-31`),
              },
            }
          : undefined,
        include: {
          subgroups: {
            include: {
              _count: {
                select: {
                  registers: true,
                  externalRegisters: true,
                },
              },
              registers: {
                select: {
                  checkRecord: { select: { id: true } },
                },
              },
              externalRegisters: {
                select: {
                  checkRecord: { select: { id: true } },
                },
              },
            },
          },
          _count: {
            select: {
              registers: true,
              externalRegisters: true,
            },
          },
        },
        orderBy: {
          startDateTime: "desc",
        },
      });

      return activities.map((activity) => {
        const totalRegistrations =
          activity._count.registers + activity._count.externalRegisters;

        // Calculate total check-ins across all subgroups
        let totalCheckIns = 0;
        const subgroupStats = activity.subgroups.map((subgroup) => {
          const subgroupRegistrations =
            subgroup._count.registers + subgroup._count.externalRegisters;

          const subgroupMainCheckIns = subgroup.registers.filter(
            (r) => !!r.checkRecord,
          ).length;
          const subgroupExternalCheckIns = subgroup.externalRegisters.filter(
            (r) => !!r.checkRecord,
          ).length;
          const subgroupTotalCheckIns =
            subgroupMainCheckIns + subgroupExternalCheckIns;

          totalCheckIns += subgroupTotalCheckIns;

          return {
            id: subgroup.id,
            title: subgroup.title,
            registrations: subgroupRegistrations,
            checkIns: subgroupTotalCheckIns,
          };
        });

        return {
          id: activity.id,
          title: activity.title,
          startDateTime: activity.startDateTime,
          location: activity.location,
          totalRegistrations,
          totalCheckIns,
          subgroupStats,
        };
      });
    }),
});
