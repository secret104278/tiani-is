import { forwardRef, useRef } from "react";
import { api } from "~/utils/api";
import type { CheckInDialogProps } from "./CheckInDialog";
import CheckInDialog from "./CheckInDialog";

const ForwardedCheckInDialog = forwardRef(CheckInDialog);

export interface ActivityCheckInDialogProps
  extends Omit<
    CheckInDialogProps,
    "onCheckIn" | "checkInIsLoading" | "checkInError"
  > {
  activityId: number;
  onCheckInSuccess: () => void;
}

export default function ActivityCheckInDialog({
  activityId,
  onCheckInSuccess,
  ...props
}: ActivityCheckInDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const {
    mutate: checkInActivity,
    isLoading: checkInActivityIsLoading,
    error: checkInActivityError,
  } = api.volunteerActivity.checkInActivity.useMutation({
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
