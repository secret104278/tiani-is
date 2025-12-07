import QrScanner from "qr-scanner";
import { useEffect, useRef, useState } from "react";
import { AlertWarning } from "../utils/Alert";

export default function QrScannerComponent({
  onScan,
  onClose,
}: {
  onScan: (data: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const qrScanner = new QrScanner(
      video,
      (result) => {
        onScan(result.data);
        setIsScanning(false);
      },
      {
        onDecodeError: () => {
          // silently handle decode errors
        },
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    );

    qrScanner.start().catch((err) => {
      setError(`掃描器啟動失敗: ${JSON.stringify(err)}`);
    });

    return () => {
      qrScanner.destroy();
    };
  }, [onScan]);

  if (error) {
    return <AlertWarning>{error}</AlertWarning>;
  }

  return (
    <div className="relative w-full space-y-4">
      <div className="relative overflow-hidden rounded-lg bg-black">
        {/* biome-ignore lint/a11y/useMediaCaption: QR scanner doesn't need captions */}
        <video
          ref={videoRef}
          className="aspect-square w-full"
          title="QR code scanner"
        />
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-40 border-4 border-green-400" />
          </div>
        )}
      </div>
      <button onClick={onClose} className="btn btn-block btn-secondary">
        取消
      </button>
    </div>
  );
}
