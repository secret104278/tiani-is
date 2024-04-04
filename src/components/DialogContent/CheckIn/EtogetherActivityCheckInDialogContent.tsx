import { api } from "~/utils/api";
import { useDialogContext } from "../../utils/Dialog";
import BaseCheckInDialogContent from "./BaseCheckInDialogContent";

export default function EtogetherActivityCheckInDialogContent({
  activityId,
  onCheckInSuccess,
}: {
  activityId: number;
  onCheckInSuccess?: () => void;
}) {
  const { closeModal } = useDialogContext();

  const {
    mutate: checkInActivityMainRegister,
    isLoading: checkInActivityMainRegisterIsLoading,
    error: checkInActivityMainRegisterError,
  } = api.etogetherActivity.checkInActivityMainRegister.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeModal();
    },
  });

  return (
    <BaseCheckInDialogContent
      onCheckIn={(latitude, longitude) =>
        checkInActivityMainRegister({
          activityId,
          latitude,
          longitude,
        })
      }
      checkInIsLoading={checkInActivityMainRegisterIsLoading}
      checkInError={checkInActivityMainRegisterError?.message}
    />
  );
}
