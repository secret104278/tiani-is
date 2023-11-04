import { ArrowDownOnSquareIcon } from "@heroicons/react/20/solid";
import { isEmpty, isNil } from "lodash";
import dynamic from "next/dynamic";
import { useState } from "react";
import { api } from "~/utils/api";

const CasualCheckInDialog = dynamic(
  () => import("~/components/CasualCheckInDialog"),
  {
    ssr: false,
  },
);

export function CasualCheckInCard() {
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const {
    data: latestCasualCheckIn,
    isLoading: latestCasualCheckInIsLoading,
    refetch: refetchLatestCasualCheckIn,
  } = api.volunteerActivity.getLatestCasualCheckIn.useQuery({});

  return (
    <div>
      <div className="card-compact card w-full shadow-lg">
        <div className="card-body">
          <h2 className="card-title">日常工作</h2>
          <div className="flex items-center"></div>
          {latestCasualCheckInIsLoading && <div className="loading" />}
          {isEmpty(latestCasualCheckIn) && "今日尚未簽到"}
          {!isEmpty(latestCasualCheckIn) && (
            <div className="flex items-center">
              <p>簽到：{latestCasualCheckIn.checkInAt.toLocaleString()}</p>
            </div>
          )}
          {!isNil(latestCasualCheckIn?.checkOutAt) && (
            <div className="flex items-center">
              <p>簽退：{latestCasualCheckIn!.checkOutAt.toLocaleString()}</p>
            </div>
          )}
          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              onClick={() => setCheckInDialogOpen(true)}
            >
              <ArrowDownOnSquareIcon className="h-4 w-4" />
              {isEmpty(latestCasualCheckIn) && "簽到"}
              {!isEmpty(latestCasualCheckIn) &&
              latestCasualCheckIn.checkOutAt !== null
                ? "再次簽到"
                : "簽退"}
            </button>
          </div>
        </div>
      </div>
      <CasualCheckInDialog
        open={checkInDialogOpen}
        onClose={() => setCheckInDialogOpen(false)}
        onCheckInSuccess={() => void refetchLatestCasualCheckIn()}
      />
    </div>
  );
}
