import { XMarkIcon } from "@heroicons/react/20/solid";
import { isEmpty } from "lodash";
import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { useGeolocation } from "react-use";
import { api } from "~/utils/api";
import { TIANI_GPS_CENTER, TIANI_GPS_RADIUS_KM, getDistance } from "~/utils/ui";
import { AlertWarning } from "./Alert";
import CheckInMap from "./CheckInMap";
import ReactiveButton from "./ReactiveButton";
import ViewFocus from "./ViewFocus";

export interface CheckInModalProps {
  activityId: number;
  open: boolean;
  onClose: () => void;
  onCheckIn: () => void;
}

const InnerModal = ({
  dialogRef,
  activityId,
  onCheckIn,
}: {
  dialogRef: RefObject<HTMLDialogElement>;
  activityId: number;
  onCheckIn: () => void;
}) => {
  const geoState = useGeolocation();
  const {
    mutate: checkInActivity,
    isLoading: checkInActivityIsLoading,
    error: checkInActivityError,
  } = api.volunteerActivity.checkInActivity.useMutation({
    onSuccess: () => {
      dialogRef.current?.close();
      onCheckIn();
    },
  });

  if (geoState.error)
    return <AlertWarning>{geoState.error.message}</AlertWarning>;

  const isOutOfRange =
    getDistance(
      geoState.latitude ?? 0,
      geoState.longitude ?? 0,
      TIANI_GPS_CENTER[0],
      TIANI_GPS_CENTER[1],
    ) > TIANI_GPS_RADIUS_KM;

  return (
    <>
      <div className="modal-box flex h-full flex-col space-y-4">
        <form method="dialog" className="flex flex-row items-center">
          <h3 className="text-lg font-bold">定位打卡</h3>
          <div className="flex-grow" />
          <button className="btn btn-circle btn-ghost btn-sm">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </form>
        <CheckInMap>
          {!geoState.loading && (
            <>
              <ViewFocus
                showMarker
                center={[geoState.latitude!, geoState.longitude!]}
              />
            </>
          )}
        </CheckInMap>
        <div className="modal-action">
          <ReactiveButton
            className="btn btn-primary"
            disabled={
              geoState.loading || !isEmpty(geoState.error) || isOutOfRange
            }
            loading={checkInActivityIsLoading}
            error={checkInActivityError?.message}
            onClick={() =>
              checkInActivity({
                activityId: activityId,
                latitude: geoState.latitude ?? 0,
                longitude: geoState.longitude ?? 0,
              })
            }
          >
            {geoState.loading
              ? "定位中..."
              : isOutOfRange
              ? "超出範圍"
              : "打卡"}
          </ReactiveButton>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </>
  );
};

// 這裡用 open/onClose 是因為希望在 dialog 開起來之前，不要去執行裡面那些跟 useGeolocation 有關的 hook
export default function CheckInModal({
  activityId,
  open,
  onClose,
  onCheckIn,
}: CheckInModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open && dialogRef.current?.open === false)
      dialogRef.current?.showModal();
    if (!open && dialogRef.current?.open === true) dialogRef.current?.close();
  }, [open]);

  useEffect(() => {
    if (dialogRef.current) dialogRef.current.onclose = (_) => onClose();
  }, [dialogRef, onClose]);

  return (
    <dialog className="modal" ref={dialogRef}>
      {open && (
        <InnerModal
          dialogRef={dialogRef}
          activityId={activityId}
          onCheckIn={onCheckIn}
        />
      )}
    </dialog>
  );
}
