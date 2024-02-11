import { ArrowDownOnSquareIcon } from "@heroicons/react/20/solid";
import { isEmpty, isNil } from "lodash";
import { useState } from "react";
import { api } from "~/utils/api";
import { formatDateTime } from "~/utils/ui";
import CasualCheckInDialogContent from "./DialogContent/CheckIn/CasualCheckInDialogContent";
import Dialog from "./utils/Dialog";

export function CasualCheckInCard() {
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const {
    data: latestCasualCheckIn,
    isLoading: latestCasualCheckInIsLoading,
    refetch: refetchLatestCasualCheckIn,
  } = api.volunteerActivity.getLatestCasualCheckIn.useQuery({});

  return (
    <div>
      <div className="card card-compact w-full shadow-lg">
        <div className="card-body">
          <h2 className="card-title">日常工作</h2>
          <div className="flex items-center"></div>
          {latestCasualCheckInIsLoading && <div className="loading" />}
          {isEmpty(latestCasualCheckIn) && "今日尚未簽到"}
          {!isEmpty(latestCasualCheckIn) && (
            <div className="flex items-center">
              <p>簽到：{formatDateTime(latestCasualCheckIn.checkInAt)}</p>
            </div>
          )}
          {!isNil(latestCasualCheckIn?.checkOutAt) && (
            <div className="flex items-center">
              <p>簽退：{formatDateTime(latestCasualCheckIn!.checkOutAt)}</p>
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
      <Dialog
        title="定位打卡"
        show={checkInDialogOpen}
        closeModal={() => setCheckInDialogOpen(false)}
      >
        <CasualCheckInDialogContent
          onCheckInSuccess={() => void refetchLatestCasualCheckIn()}
        />
      </Dialog>
    </div>
  );
}
