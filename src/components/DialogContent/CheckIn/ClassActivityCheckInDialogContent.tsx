import { api } from "~/utils/api";
import { useDialogContext } from "../../utils/Dialog";
import BaseCheckInDialogContent from "./BaseCheckInDialogContent";

export default function ClassActivityCheckInDialogContent({
  activityId,
  onCheckInSuccess,
}: {
  activityId: number;
  onCheckInSuccess?: () => void;
}) {
  const { closeModal } = useDialogContext();

  const {
    mutate: checkInActivity,
    isLoading: checkInActivityIsLoading,
    error: checkInActivityError,
  } = api.classActivity.checkInActivity.useMutation({
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
