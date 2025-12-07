import { isEmpty, isNumber } from "lodash";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useGeolocation } from "react-use";
import { isValidQrToken, parseQrContent } from "~/config/checkin";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  getDistance,
} from "~/utils/ui";
import { AlertWarning } from "../../utils/Alert";
import ReactiveButton from "../../utils/ReactiveButton";

const ViewFocus = dynamic(() => import("~/components/Map/ViewFocus"), {
  ssr: false,
});

const CheckInMap = dynamic(() => import("~/components/Map/CheckInMap"), {
  ssr: false,
});

const QrScannerComponent = dynamic(
  () => import("~/components/Map/QrScannerComponent"),
  {
    ssr: false,
  },
);

export default function BaseCheckInDialogContent({
  checkInIsLoading,
  checkInError,
  onCheckIn,
}: {
  checkInIsLoading?: boolean;
  checkInError?: string;
  onCheckIn: (data: {
    latitude?: number;
    longitude?: number;
    qrToken?: string;
  }) => void;
}) {
  const geoState = useGeolocation();
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const handleQrScan = (scannedText: string) => {
    const token = parseQrContent(scannedText);
    if (token && isValidQrToken(token)) {
      onCheckIn({ qrToken: token });
      setShowQrScanner(false);
      setQrError(null);
    } else {
      setQrError("無效的QR code");
    }
  };

  if (showQrScanner) {
    return (
      <div className="space-y-4">
        {qrError && <AlertWarning>{qrError}</AlertWarning>}
        <QrScannerComponent
          onScan={handleQrScan}
          onClose={() => setShowQrScanner(false)}
        />
      </div>
    );
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
    <div className="flex flex-col space-y-4">
      <div className="h-96">
        <CheckInMap>
          {!geoState.loading && (
            <ViewFocus
              showMarker
              center={[geoState.latitude!, geoState.longitude!]}
            />
          )}
        </CheckInMap>
      </div>
      <div className="flex gap-2">
        <ReactiveButton
          className="btn btn-primary flex-1"
          disabled={
            geoState.loading || !isEmpty(geoState.error) || isOutOfRange
          }
          loading={checkInIsLoading}
          error={checkInError}
          onClick={() =>
            isNumber(geoState.latitude) &&
            isNumber(geoState.longitude) &&
            Number.isFinite(geoState.latitude) &&
            Number.isFinite(geoState.longitude) &&
            onCheckIn({
              latitude: geoState.latitude,
              longitude: geoState.longitude,
            })
          }
        >
          {geoState.loading ? "定位中..." : isOutOfRange ? "超出範圍" : "打卡"}
        </ReactiveButton>
        <button
          className="btn btn-secondary flex-1"
          onClick={() => setShowQrScanner(true)}
        >
          掃描 QR
        </button>
      </div>
    </div>
  );
}
