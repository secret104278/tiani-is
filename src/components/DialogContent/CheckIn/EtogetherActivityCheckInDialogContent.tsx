import { useClose } from "@headlessui/react";
import { api } from "~/utils/api";
import BaseCheckInDialogContent from "./BaseCheckInDialogContent";

export default function EtogetherActivityCheckInDialogContent({
  activityId,
  onCheckInSuccess,
}: {
  activityId: number;
  onCheckInSuccess?: () => void;
}) {
  const closeDialog = useClose();

  const {
    mutate: checkInActivityMainRegister,
    isLoading: checkInActivityMainRegisterIsLoading,
    error: checkInActivityMainRegisterError,
  } = api.etogetherActivity.checkInActivityMainRegister.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeDialog();
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
