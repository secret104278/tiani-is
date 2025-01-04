"use client";

import { isEmpty, isNumber } from "lodash";
import dynamic from "next/dynamic";
import { useGeolocation } from "react-use";
import AlertWarning from "~/app/_components/basic/alert-warning";
import ReactiveButton from "~/app/_components/basic/reactive-button";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  getDistance,
} from "~/utils/ui";

const ViewFocus = dynamic(() => import("~/app/_components/map/view-focus"), {
  ssr: false,
});

const CheckInMap = dynamic(() => import("~/app/_components/map/check-in-map"), {
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
  let geoState = useGeolocation();
  if (process.env.NODE_ENV === "development") {
    geoState = {
      error: undefined,
      latitude: TIANI_GPS_CENTERS.at(0)!.at(0)!,
      longitude: TIANI_GPS_CENTERS.at(0)!.at(1)!,
      loading: false,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: null,
    };
  }

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
