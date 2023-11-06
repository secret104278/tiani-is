import { forwardRef, useRef } from "react";
import { api } from "~/utils/api";
import type { CheckInDialogProps } from "./CheckInDialog";
import CheckInDialog from "./CheckInDialog";

const ForwardedCheckInDialog = forwardRef(CheckInDialog);

export interface ClassActivityCheckInDialogProps
  extends Omit<
    CheckInDialogProps,
    "onCheckIn" | "checkInIsLoading" | "checkInError"
  > {
  activityId: number;
  onCheckInSuccess: () => void;
}

export default function ClassActivityCheckInDialog({
  activityId,
  onCheckInSuccess,
  ...props
}: ClassActivityCheckInDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const {
    mutate: checkInActivity,
    isLoading: checkInActivityIsLoading,
    error: checkInActivityError,
  } = api.classActivity.checkInActivity.useMutation({
    onSuccess: () => {
      dialogRef.current?.close();
      onCheckInSuccess();
    },
  });

  return (
    <ForwardedCheckInDialog
      ref={dialogRef}
      onCheckIn={(latitude, longitude) =>
        checkInActivity({ activityId, latitude, longitude })
      }
      checkInIsLoading={checkInActivityIsLoading}
      checkInError={checkInActivityError?.message}
      {...props}
    />
  );
}
