"use client";

import { useDialogContext } from "~/app/_components/basic/dialog";
import BaseCheckInDialogContent from "~/app/_components/check-in/base-dialog-content";
import { api } from "~/trpc/react";

export default function VolunteerActivityCheckInDialogContent({
  activityId,
  onCheckInSuccess,
}: {
  activityId: number;
  onCheckInSuccess?: () => void;
}) {
  const { closeModal } = useDialogContext();

  const {
    mutate: checkInActivity,
    isPending: checkInActivityIsLoading,
    error: checkInActivityError,
  } = api.volunteerActivity.checkInActivity.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeModal();
    },
  });

  return (
    <BaseCheckInDialogContent
      onCheckIn={(latitude, longitude) =>
        checkInActivity({ activityId, latitude, longitude })
      }
      checkInIsLoading={checkInActivityIsLoading}
      checkInError={checkInActivityError?.message}
    />
  );
}
