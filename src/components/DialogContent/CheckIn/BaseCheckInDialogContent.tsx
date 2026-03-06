import { isEmpty, isNumber } from "lodash";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useGeolocation } from "react-use";
import { isValidQrToken, parseQrContent } from "~/config/checkin";
import {
  TIANI_GPS_CENTERS,
  TIANI_GPS_RADIUS_KM,
  getDistance,
} from "~/utils/ui";
import { AlertWarning } from "../../utils/Alert";
import ReactiveButton from "../../utils/ReactiveButton";

/*
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
*/

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
  /*
  const geoState = useGeolocation();
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);

  // When the dialog closes and reopens, React was reusing the same Leaflet map DOM element
  // without reinitializing it, causing the Leaflet transform state to become corrupted.
  // The key increment causes the map to remount with a fresh Leaflet initialization
  useEffect(() => {
    setMapKey((prev) => prev + 1);
  }, []);

  const handleQrScan = (scannedText: string) => {
    try {
      const token = parseQrContent(scannedText);
      if (token && isValidQrToken(token)) {
        onCheckIn({ qrToken: token });
        setShowQrScanner(false);
        setQrError(null);
      }
    } catch (error) {
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
  */

  return (
    <div className="flex flex-col space-y-4">
      <div className="py-8 text-center">
        <p className="text-lg font-medium">確定要進行打卡嗎？</p>
      </div>
      <div className="flex gap-2">
        <ReactiveButton
          className="btn btn-primary flex-1"
          loading={checkInIsLoading}
          error={checkInError}
          onClick={() =>
            onCheckIn({
              latitude: undefined,
              longitude: undefined,
            })
          }
        >
          確認打卡
        </ReactiveButton>
      </div>
    </div>
  );
}
