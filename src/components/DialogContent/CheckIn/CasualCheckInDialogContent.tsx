import { useClose } from "@headlessui/react";
import { api } from "~/utils/api";
import BaseCheckInDialogContent from "./BaseCheckInDialogContent";

export default function CasualCheckInDialogContent({
  onCheckInSuccess,
}: {
  onCheckInSuccess?: () => void;
}) {
  const closeDialog = useClose();

  const {
    mutate: casualCheckIn,
    isPending: casualCheckInIsPending,
    error: casualCheckInError,
  } = api.volunteerActivity.casualCheckIn.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeDialog();
    },
  });

  return (
    <BaseCheckInDialogContent
      onCheckIn={(latitude, longitude) =>
        casualCheckIn({ latitude, longitude })
      }
      checkInIsLoading={casualCheckInIsPending}
      checkInError={casualCheckInError?.message}
    />
  );
}
