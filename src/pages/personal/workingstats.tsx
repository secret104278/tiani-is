import { isNil } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";
import type { CheckInHistory } from "~/utils/types";

export default function WorkingStatsPage() {
  const router = useRouter();

  const { data: workingStats, isLoading: workingStatsIsLoading } =
    api.volunteerActivity.getWorkingStats.useQuery({});

  const [activeTab, setActiveTab] = useState<"activity" | "casual">("activity");

  if (workingStatsIsLoading) return <div className="loading" />;

  const groupedData = workingStats?.activityCheckHistories.reduce(
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

  const ActivityCheckHistory = () => (
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
              <tr
                className="hover hover:cursor-pointer"
                key={history.activityId}
                onClick={() =>
                  void router.push(
                    `/volunteeractivity/detail/${history.activityId}`,
                  )
                }
              >
                <td>{history.title}</td>
                <td>
                  {history.checkinat.toLocaleDateString()}
                  <br />
                  {history.checkinat.toLocaleTimeString()}
                </td>
                <td>
                  {history.checkoutat.toLocaleDateString()}
                  <br />
                  {history.checkoutat.toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </>
      ))}
    </table>
  );

  const CasualCheckHistory = () => (
    <table className="table table-sm">
      <thead>
        <tr>
          <th>日期</th>
          <th>簽到</th>
          <th>簽退</th>
        </tr>
      </thead>
      <tbody>
        {workingStats?.casualCheckHistories.map((history) => (
          <tr className="hover hover:cursor-pointer" key={history.id}>
            <td>{history.checkInAt.toLocaleDateString()}</td>
            <td>{history.checkInAt.toLocaleTimeString()}</td>
            <td>{history.checkOutAt?.toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="flex flex-col space-y-4 overflow-x-auto">
      <article className="prose">
        <h1>打卡紀錄</h1>
      </article>
      <div className="flex flex-row justify-center">
        <div className="tabs-boxed tabs">
          <a
            className={"tab" + (activeTab === "activity" ? " tab-active" : "")}
            onClick={() => setActiveTab("activity")}
          >
            主題工作
          </a>
          <a
            className={"tab" + (activeTab === "casual" ? " tab-active" : "")}
            onClick={() => setActiveTab("casual")}
          >
            日常工作
          </a>
        </div>
      </div>
      <div hidden={activeTab !== "activity"}>
        <ActivityCheckHistory />
      </div>
      <div hidden={activeTab !== "casual"}>
        <CasualCheckHistory />
      </div>
    </div>
  );
}
