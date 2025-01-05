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
      onCheckIn={(latitude, longitude) =>
        checkInActivity({ activityId, latitude, longitude })
      }
      checkInIsLoading={checkInActivityIsPending}
      checkInError={checkInActivityError?.message}
    />
  );
}
