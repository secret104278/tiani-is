import { isNil, sortBy } from "lodash";
import { useRouter } from "next/router";
import { useState } from "react";
import { api } from "~/utils/api";

export default function WorkingStatsPage() {
  const router = useRouter();

  const { data: workingStats, isLoading: workingStatsIsLoading } =
    api.volunteerActivity.getWorkingStats.useQuery({});

  const [activeTab, setActiveTab] = useState<"all" | "activity" | "casual">(
    "all",
  );

  if (workingStatsIsLoading) return <div className="loading" />;

  const allActivityCheckHistories = sortBy(
    [
      ...(workingStats?.activityCheckHistories.map((history) => ({
        checkInAt: history.checkInAt,
        checkOutAt: history.checkOutAt,
        title: history.title,
        activityId: history.activityId,
      })) ?? []),
      ...(workingStats?.casualCheckHistories.map((history) => ({
        checkInAt: history.checkInAt,
        checkOutAt: history.checkOutAt,
        title: "日常工作",
        activityId: undefined,
      })) ?? []),
    ],
    "checkInAt",
  ).reverse();

  const AllCheckHistory = () => (
    <table className="table table-sm overflow-x-auto">
      <thead>
        <tr>
          <th>日期</th>
          <th>工作名稱</th>
          <th>簽到</th>
          <th>簽退</th>
        </tr>
      </thead>
      <tbody>
        {allActivityCheckHistories.map((history, idx) => (
          <tr
            className="hover hover:cursor-pointer"
            key={idx}
            onClick={() =>
              !isNil(history.activityId) &&
              void router.push(
                `/volunteer/activity/detail/${history.activityId}`,
              )
            }
          >
            <td>{history.checkInAt.toLocaleDateString()}</td>
            <td>{history.title}</td>
            <td>{history.checkInAt.toLocaleTimeString()}</td>
            <td>{history.checkOutAt?.toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const ActivityCheckHistory = () => (
    <table className="table table-sm">
      <thead>
        <tr>
          <th>日期</th>
          <th>工作名稱</th>
          <th>簽到</th>
          <th>簽退</th>
        </tr>
      </thead>
      <tbody>
        {workingStats?.activityCheckHistories.map((history) => (
          <tr
            className="hover hover:cursor-pointer"
            key={history.activityId}
            onClick={() =>
              void router.push(
                `/volunteer/activity/detail/${history.activityId}`,
              )
            }
          >
            <td>{history.checkInAt.toLocaleDateString()}</td>
            <td>{history.title}</td>
            <td>{history.checkInAt.toLocaleTimeString()}</td>
            <td>{history.checkOutAt.toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
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
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>打卡紀錄</h1>
      </article>
      <div className="flex flex-row justify-center">
        <div className="tabs-boxed tabs">
          <a
            className={"tab" + (activeTab === "all" ? " tab-active" : "")}
            onClick={() => setActiveTab("all")}
          >
            全部
          </a>
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
      <div className="overflow-x-auto break-keep">
        <div hidden={activeTab !== "all"}>
          <AllCheckHistory />
        </div>
        <div hidden={activeTab !== "activity"}>
          <ActivityCheckHistory />
        </div>
        <div hidden={activeTab !== "casual"}>
          <CasualCheckHistory />
        </div>
      </div>
    </div>
  );
}
