"use client";

import { ArrowDownOnSquareIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import Dialog from "~/app/_components/basic/dialog";
import Loading from "~/app/_components/basic/loading";
import { api } from "~/trpc/react";
import { formatDateTime } from "~/utils/ui";
import CasualCheckInDialogContent from "./casual-check-in-dialog-content";

export default function CasualCheckInCard() {
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const {
    data: latestCasualCheckIn,
    isLoading: latestCasualCheckInIsLoading,
    refetch: refetchLatestCasualCheckIn,
  } = api.volunteerActivity.getLatestCasualCheckIn.useQuery();

  return (
    <div>
      <div className="card card-compact w-full shadow-lg">
        <div className="card-body">
          <h2 className="card-title">日常工作</h2>
          <div className="flex items-center"></div>
          {latestCasualCheckInIsLoading && <Loading />}
          {!latestCasualCheckIn && "今日尚未簽到"}
          {latestCasualCheckIn && (
            <div className="flex items-center">
              <p>簽到：{formatDateTime(latestCasualCheckIn.checkInAt)}</p>
            </div>
          )}
          {latestCasualCheckIn?.checkOutAt && (
            <div className="flex items-center">
              <p>簽退：{formatDateTime(latestCasualCheckIn.checkOutAt)}</p>
            </div>
          )}
          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              onClick={() => setCheckInDialogOpen(true)}
            >
              <ArrowDownOnSquareIcon className="h-4 w-4" />
              {!latestCasualCheckIn && "簽到"}
              {latestCasualCheckIn?.checkOutAt ? "再次簽到" : "簽退"}
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
