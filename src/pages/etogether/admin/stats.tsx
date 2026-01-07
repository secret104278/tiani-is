import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Fragment, useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import { Loading } from "~/components/utils/Loading";
import { api } from "~/utils/api";
import { formatDate, truncateTitle } from "~/utils/ui";

export default function EtogetherAdminStatsPage() {
  const { data: session } = useSession();
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear() - 1,
  );
  const [expandedActivityIds, setExpandedActivityIds] = useState<Set<number>>(
    new Set(),
  );

  const statsQuery = api.etogetherActivity.getActivitiesStats.useQuery({
    year: selectedYear,
  });

  const toggleExpand = (id: number) => {
    const next = new Set(expandedActivityIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedActivityIds(next);
  };

  if (!session?.user.role.is_etogether_admin) {
    return <AlertWarning>您沒有管理權限</AlertWarning>;
  }

  if (statsQuery.isLoading) return <Loading />;
  if (statsQuery.error)
    return <AlertWarning>{statsQuery.error.message}</AlertWarning>;

  const stats = statsQuery.data ?? [];

  const totalParticipants = stats.reduce(
    (acc, s) => acc + s.totalRegistrations,
    0,
  );
  const totalCheckedIn = stats.reduce((acc, s) => acc + s.totalCheckIns, 0);
  const averageAttendance =
    totalParticipants > 0 ? (totalCheckedIn / totalParticipants) * 100 : 0;

  return (
    <div className="flex flex-col space-y-6 pb-10">
      <div className="flex flex-row items-center justify-between">
        <article className="prose">
          <h1>活動統計分析</h1>
        </article>
        <select
          className="select select-bordered select-sm"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          <option value={2026}>2026 年</option>
          <option value={2025}>2025 年</option>
          <option value={2024}>2024 年</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="stats stats-vertical lg:stats-horizontal w-full shadow">
        <div className="stat">
          <div className="stat-title">年度總報名</div>
          <div className="stat-value">{totalParticipants}</div>
          <div className="stat-desc">所有活動累計</div>
        </div>
        <div className="stat">
          <div className="stat-title">年度實際出席</div>
          <div className="stat-value text-secondary">{totalCheckedIn}</div>
          <div className="stat-desc">已簽到人數</div>
        </div>
        <div className="stat">
          <div className="stat-title">平均出席率</div>
          <div className="stat-value text-primary">
            {averageAttendance.toFixed(1)}%
          </div>
          <div className="stat-progress">
            <progress
              className={`progress w-full ${averageAttendance > 70 ? "progress-success" : averageAttendance > 40 ? "progress-warning" : "progress-error"}`}
              value={averageAttendance}
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto rounded-md border border-base-200">
        <table className="table-zebra table w-full">
          <thead>
            <tr>
              <th className="w-10" />
              <th>日期 / 活動名稱</th>
              <th className="text-center">報名</th>
              <th className="text-center">簽到</th>
              <th className="text-center">出席率</th>
            </tr>
          </thead>
          <tbody>
            {stats.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-base-content/50"
                >
                  此年度尚無活動紀錄
                </td>
              </tr>
            ) : (
              stats.map((activity) => {
                const attendance =
                  activity.totalRegistrations > 0
                    ? (activity.totalCheckIns / activity.totalRegistrations) *
                      100
                    : 0;
                const isExpanded = expandedActivityIds.has(activity.id);

                return (
                  <Fragment key={activity.id}>
                    <tr
                      className="hover cursor-pointer"
                      onClick={() => toggleExpand(activity.id)}
                    >
                      <td>
                        {isExpanded ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </td>
                      <td>
                        <div className="font-bold">
                          {truncateTitle(activity.title)}
                        </div>
                        <div className="text-xs opacity-50">
                          {formatDate(activity.startDateTime)}
                        </div>
                      </td>
                      <td className="text-center">
                        {activity.totalRegistrations}
                      </td>
                      <td className="text-center">{activity.totalCheckIns}</td>
                      <td className="text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-semibold ${attendance > 80 ? "text-success" : attendance < 50 ? "text-error" : ""}`}
                          >
                            {attendance.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-base-200/50">
                        <td colSpan={5} className="p-0">
                          <div className="border-base-200 border-x bg-base-100/50 p-4">
                            <div className="mb-2 font-bold text-sm">
                              分組詳情：
                            </div>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {activity.subgroupStats.map((sub) => {
                                const subAttendance =
                                  sub.registrations > 0
                                    ? (sub.checkIns / sub.registrations) * 100
                                    : 0;
                                return (
                                  <div
                                    key={sub.id}
                                    className="flex flex-row justify-between rounded border border-base-200 bg-base-100 p-2 text-sm"
                                  >
                                    <span className="font-medium">
                                      {sub.title}
                                    </span>
                                    <div className="space-x-4">
                                      <span>報名: {sub.registrations}</span>
                                      <span>簽到: {sub.checkIns}</span>
                                      <span
                                        className={
                                          subAttendance > 80
                                            ? "text-success"
                                            : subAttendance < 50
                                              ? "text-error"
                                              : ""
                                        }
                                      >
                                        {subAttendance.toFixed(0)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 flex justify-end">
                              <Link
                                href={`/etogether/activity/detail/${activity.id}`}
                              >
                                <button className="btn btn-xs btn-outline">
                                  查看詳情
                                </button>
                              </Link>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
