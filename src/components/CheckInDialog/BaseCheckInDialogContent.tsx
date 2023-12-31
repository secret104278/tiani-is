import { isEmpty, isNumber } from "lodash";
import { useGeolocation } from "react-use";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  getDistance,
} from "~/utils/ui";
import { AlertWarning } from "../Alert";

import ReactiveButton from "../ReactiveButton";

import dynamic from "next/dynamic";

const ViewFocus = dynamic(() => import("~/components/ViewFocus"), {
  ssr: false,
});

const CheckInMap = dynamic(() => import("~/components/CheckInMap"), {
  ssr: false,
});

export default function BaseCheckInDialogContent({
  checkInIsLoading,
  checkInError,
  onCheckIn,
}: {
  checkInIsLoading?: boolean;
  checkInError?: string;
  onCheckIn: (latitude: number, longitude: number) => void;
}) {
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
    <div className="flex h-96 flex-col space-y-4">
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
      <ReactiveButton
        className="btn btn-primary"
        disabled={geoState.loading || !isEmpty(geoState.error) || isOutOfRange}
        loading={checkInIsLoading}
        error={checkInError}
        onClick={() =>
          isNumber(geoState.latitude) &&
          isNumber(geoState.longitude) &&
          isFinite(geoState.latitude) &&
          isFinite(geoState.longitude) &&
          onCheckIn(geoState.latitude, geoState.longitude)
        }
      >
        {geoState.loading ? "定位中..." : isOutOfRange ? "超出範圍" : "打卡"}
      </ReactiveButton>
    </div>
  );
}
