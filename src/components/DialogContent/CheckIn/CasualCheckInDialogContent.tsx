import { api } from "~/utils/api";
import { useDialogContext } from "../../utils/Dialog";
import BaseCheckInDialogContent from "./BaseCheckInDialogContent";

export default function CasualCheckInDialogContent({
  onCheckInSuccess,
}: {
  onCheckInSuccess?: () => void;
}) {
  const { closeModal } = useDialogContext();

  const {
    mutate: casualCheckIn,
    isLoading: casualCheckInIsLoading,
    error: casualCheckInError,
  } = api.volunteerActivity.casualCheckIn.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeModal();
    },
  });

  return (
    <BaseCheckInDialogContent
      onCheckIn={(latitude, longitude) =>
        casualCheckIn({ latitude, longitude })
      }
      checkInIsLoading={casualCheckInIsLoading}
      checkInError={casualCheckInError?.message}
    />
  );
}
