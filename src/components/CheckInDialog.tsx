import { XMarkIcon } from "@heroicons/react/20/solid";
import type { ForwardedRef } from "react";
import { useEffect, useImperativeHandle, useRef } from "react";
import { useGeolocation } from "react-use";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  getDistance,
} from "~/utils/ui";
import { AlertWarning } from "./Alert";
import CheckInMap from "./CheckInMap";
import ReactiveButton from "./ReactiveButton";
import ViewFocus from "./ViewFocus";

interface InnerDialogProps {
  checkInIsLoading?: boolean;
  checkInError?: string;
  onCheckIn: (latitude: number, longitude: number) => void;
}

const InnerDialog = ({
  checkInIsLoading,
  checkInError,
  onCheckIn,
}: InnerDialogProps) => {
  const geoState = useGeolocation();

  if (geoState.error)
    return <AlertWarning>{geoState.error.message}</AlertWarning>;

  const isOutOfRange = !TIANI_GPS_CENTERS.some(
    (center) =>
      getDistance(
        geoState.latitude ?? 0,
        geoState.longitude ?? 0,
        center[0],
        center[1],
      ) <= TIANI_GPS_RADIUS_KM,
  );

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
            // disabled={
            //   // geoState.loading || !isEmpty(geoState.error) || isOutOfRange
            // }
            loading={checkInIsLoading}
            error={checkInError}
            onClick={() =>
              // isNumber(geoState.latitude) &&
              // isNumber(geoState.longitude) &&
              // isFinite(geoState.latitude) &&
              // isFinite(geoState.longitude) &&
              // onCheckIn(geoState.latitude, geoState.longitude)
              onCheckIn(TIANI_GPS_CENTERS[0]![0], TIANI_GPS_CENTERS[0]![1])
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

export interface CheckInDialogProps extends InnerDialogProps {
  open: boolean;
  onClose: () => void;
}

// 這裡用 open/onClose 是因為希望在 dialog 開起來之前，不要去執行裡面那些跟 useGeolocation 有關的 hook
export default function CheckInDialog(
  { open, onClose, ...props }: CheckInDialogProps,
  ref: ForwardedRef<HTMLDialogElement>,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useImperativeHandle(ref, () => dialogRef.current!, []);

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
      {open && <InnerDialog {...props} />}
    </dialog>
  );
}
