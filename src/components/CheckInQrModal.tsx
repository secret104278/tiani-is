import dynamic from "next/dynamic";
import Dialog from "~/components/utils/Dialog";
import { CHECKIN_QR_CONTENT } from "~/config/checkin";

const QRCode = dynamic(() => import("react-qr-code"), {
  ssr: false,
});

export default function CheckInQrModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog title="簽到QR code" show={isOpen} closeModal={onClose}>
      <div className="flex justify-center">
        <div className="rounded-lg bg-white p-4">
          <QRCode value={CHECKIN_QR_CONTENT} size={256} level="H" />
        </div>
      </div>

      <p className="text-center text-gray-600 text-sm">
        使用者可以掃描此QR code進行簽到
      </p>
    </Dialog>
  );
}
