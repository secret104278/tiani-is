import { useClose } from "@headlessui/react";
import { api } from "~/utils/api";
import BaseCheckInDialogContent from "./BaseCheckInDialogContent";

export default function ClassActivityCheckInDialogContent({
  activityId,
  onCheckInSuccess,
}: {
  activityId: number;
  onCheckInSuccess?: () => void;
}) {
  const closeDialog = useClose();

  const {
    mutate: checkInActivity,
    isPending: checkInActivityIsPending,
    error: checkInActivityError,
  } = api.classActivity.checkInActivity.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeDialog();
    },
  });

  return (
    <BaseCheckInDialogContent
      onCheckIn={(data) =>
        checkInActivity({
          activityId,
          latitude: data.latitude,
          longitude: data.longitude,
          qrToken: data.qrToken,
        })
      }
      checkInIsLoading={checkInActivityIsPending}
      checkInError={checkInActivityError?.message}
    />
  );
}
