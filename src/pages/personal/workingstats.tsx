import { isNil } from "lodash";
import { api } from "~/utils/api";
import type { CheckInHistory } from "~/utils/types";

export default function WorkingStatsPage() {
  const { data: workingStats, isLoading: workingStatsIsLoading } =
    api.volunteerActivity.getWorkingStats.useQuery({});

  if (workingStatsIsLoading) return <div className="loading" />;

  const groupedData = workingStats?.checkInHistories.reduce(
    (result: Record<string, CheckInHistory[]>, item: CheckInHistory) => {
      const startDate = item.startDateTime.toLocaleDateString();
      if (isNil(result[startDate])) {
        result[startDate] = [];
      }
      result[startDate]?.push(item);
      return result;
    },
    {},
  );

  return (
    <div className="flex flex-col space-y-4 overflow-x-auto">
      <article className="prose">
        <h1>打卡紀錄</h1>
      </article>
      <table className="table table-sm">
        <thead>
          <tr>
            <th>工作名稱</th>
            <th>簽到</th>
            <th>簽退</th>
          </tr>
        </thead>
        {Object.entries(groupedData ?? {}).map(([date, histories]) => (
          <>
            <thead>
              <tr>
                <th>{date}</th>
              </tr>
            </thead>
            <tbody>
              {histories.map((history) => (
                <tr key={history.activityId}>
                  <td>{history.title}</td>
                  <td>{history.checkinat.toLocaleTimeString()}</td>
                  <td>{history.checkoutat.toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </>
        ))}
      </table>
    </div>
  );
}
