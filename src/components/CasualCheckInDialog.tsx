import { forwardRef, useRef } from "react";
import { api } from "~/utils/api";
import type { CheckInDialogProps } from "./CheckInDialog";
import CheckInDialog from "./CheckInDialog";

const ForwardedCheckInDialog = forwardRef(CheckInDialog);

export interface CasualCheckInDialogProps
  extends Omit<
    CheckInDialogProps,
    "onCheckIn" | "checkInIsLoading" | "checkInError"
  > {
  onCheckInSuccess?: () => void;
}

export default function CasualCheckInDialog({
  onCheckInSuccess,
  ...props
}: CasualCheckInDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const {
    mutate: casualCheckIn,
    isLoading: casualCheckInIsLoading,
    error: casualCheckInError,
  } = api.volunteerActivity.casualCheckIn.useMutation({
    onSuccess: () => {
      dialogRef.current?.close();
      onCheckInSuccess?.();
    },
  });

  return (
    <ForwardedCheckInDialog
      ref={dialogRef}
      onCheckIn={(latitude, longitude) =>
        casualCheckIn({ latitude, longitude })
      }
      checkInIsLoading={casualCheckInIsLoading}
      checkInError={casualCheckInError?.message}
      {...props}
    />
  );
}
