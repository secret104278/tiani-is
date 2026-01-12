import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { formatDate, getUnitByName } from "~/utils/ui";

export default function WorkingStatsPage() {
  const router = useRouter();

  const { data: workingStats, isLoading: workingStatsIsLoading } =
    api.classActivity.getWorkingStats.useQuery({});

  if (workingStatsIsLoading) return <div className="loading" />;

  const ActivityCheckHistory = () => (
    <table className="table-sm table">
      <thead>
        <tr>
          <th>課程名稱</th>
          <th>簽到</th>
        </tr>
      </thead>
      <tbody>
        {workingStats?.activityCheckHistories.map((history) => {
          // @ts-ignore
          const unitSlug = getUnitByName(history.activity.unit)?.slug ?? "yide";
          return (
            <tr
              className="hover hover:cursor-pointer"
              key={history.activityId}
              onClick={() =>
                void router.push(
                  `/class/${unitSlug}/activity/detail/${history.activityId}`,
                )
              }
            >
              <td>{history.activity.title}</td>
              <td>
                {formatDate(history.checkAt)}
                <br />
                {history.checkAt.toLocaleTimeString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="flex flex-col space-y-4 overflow-x-auto">
      <article className="prose">
        <h1>打卡紀錄</h1>
      </article>
      <ActivityCheckHistory />
    </div>
  );
}
