"use client";

import { PencilSquareIcon } from "@heroicons/react/20/solid";
import classNames from "classnames";
import { sortBy } from "lodash";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { volunteerActivityDetailHref } from "~/utils/navigation";

import { formatDate } from "~/utils/ui";

interface ActivityCheckInHistory {
  checkInAt: Date;
  checkOutAt: Date | null;
  activityId: number;
  activity: { title: string; startDateTime: Date };
}

interface CasualCheckInHistory {
  id: number;
  checkInAt: Date;
  checkOutAt: Date | null;
}

export default function WorkingStatsPanel({
  workingStats,
  isAdmin,
  onModifyActivityCheckRecord,
  onModifyCasualCheckRecord,
}: {
  workingStats: {
    activityCheckHistories: ActivityCheckInHistory[];
    casualCheckHistories: CasualCheckInHistory[];
    totalWorkingHours: number;
  };
  isAdmin?: boolean;
  onModifyActivityCheckRecord?: (history: ActivityCheckInHistory) => void;
  onModifyCasualCheckRecord?: (history: CasualCheckInHistory) => void;
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"all" | "activity" | "casual">(
    "all",
  );

  const allActivityCheckHistories = sortBy(
    [
      ...(workingStats?.activityCheckHistories.map((history) => ({
        checkInAt: history.checkInAt,
        checkOutAt: history.checkOutAt,
        title: history.activity.title,
        activityId: history.activityId,
      })) ?? []),
      ...(workingStats?.casualCheckHistories.map((history) => ({
        checkInAt: history.checkInAt,
        checkOutAt: history.checkOutAt,
        title: "日常工作",
        activityId: undefined,
      })) ?? []),
    ],
    (a) => a.checkInAt.valueOf(),
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
              history.activityId &&
              void router.push(volunteerActivityDetailHref(history.activityId))
            }
          >
            <td>{formatDate(history.checkInAt)}</td>
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
          {isAdmin && <th>補正</th>}
        </tr>
      </thead>
      <tbody>
        {workingStats?.activityCheckHistories.map((history) => (
          <tr
            className={classNames({
              "hover hover:cursor-pointer": !isAdmin,
            })}
            key={history.activityId}
            onClick={() =>
              !isAdmin &&
              void router.push(volunteerActivityDetailHref(history.activityId))
            }
          >
            <td>{formatDate(history.checkInAt)}</td>
            <td>{history.activity.title}</td>
            <td>{history.checkInAt.toLocaleTimeString()}</td>
            <td>{history.checkOutAt?.toLocaleTimeString()}</td>
            {isAdmin && (
              <td>
                <button
                  className="btn btn-sm"
                  onClick={() => onModifyActivityCheckRecord?.(history)}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </td>
            )}
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
          {isAdmin && <th>補正</th>}
        </tr>
      </thead>
      <tbody>
        {workingStats?.casualCheckHistories.map((history) => (
          <tr
            className={classNames({
              hover: !isAdmin,
            })}
            key={history.id}
          >
            <td>{formatDate(history.checkInAt)}</td>
            <td>{history.checkInAt.toLocaleTimeString()}</td>
            <td>{history.checkOutAt?.toLocaleTimeString()}</td>
            {isAdmin && (
              <td>
                <button
                  className="btn btn-sm"
                  onClick={() => onModifyCasualCheckRecord?.(history)}
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-row justify-center">
        <div className="tabs-boxed tabs">
          <a
            className={classNames("tab", {
              "tab-active": activeTab === "all",
            })}
            onClick={() => setActiveTab("all")}
          >
            全部
          </a>
          <a
            className={classNames("tab", {
              "tab-active": activeTab === "activity",
            })}
            onClick={() => setActiveTab("activity")}
          >
            主題工作
          </a>
          <a
            className={classNames("tab", {
              "tab-active": activeTab === "casual",
            })}
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
