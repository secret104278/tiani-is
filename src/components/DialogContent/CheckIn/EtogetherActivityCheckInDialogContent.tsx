import { api } from "~/utils/api";
import { useDialogContext } from "../../utils/Dialog";
import BaseCheckInDialogContent from "./BaseCheckInDialogContent";

export default function EtogetherActivityCheckInDialogContent({
  activityId,
  subgroupId,
  externals,
  onCheckInSuccess,
}: {
  activityId: number;
  subgroupId: number;
  externals: {
    username: string;
    subgroupId: number;
  }[];
  onCheckInSuccess?: () => void;
}) {
  const { closeModal } = useDialogContext();

  const {
    mutate: checkInActivity,
    isLoading: checkInActivityIsLoading,
    error: checkInActivityError,
  } = api.etogetherActivity.checkInActivity.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeModal();
    },
  });

  return (
    <BaseCheckInDialogContent
      onCheckIn={(latitude, longitude) =>
        checkInActivity({
          activityId,
          subgroupId,
          externals,
          latitude,
          longitude,
        })
      }
      checkInIsLoading={checkInActivityIsLoading}
      checkInError={checkInActivityError?.message}
    />
  );
}
