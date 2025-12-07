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
    isPending: checkInActivityMainRegisterIsPending,
    error: checkInActivityMainRegisterError,
  } = api.etogetherActivity.checkInActivityMainRegister.useMutation({
    onSuccess: () => {
      onCheckInSuccess?.();
      closeDialog();
    },
  });

  return (
    <BaseCheckInDialogContent
      onCheckIn={(data) =>
        checkInActivityMainRegister({
          activityId,
          latitude: data.latitude,
          longitude: data.longitude,
          qrToken: data.qrToken,
        })
      }
      checkInIsLoading={checkInActivityMainRegisterIsPending}
      checkInError={checkInActivityMainRegisterError?.message}
    />
  );
}
