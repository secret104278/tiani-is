import Image from "next/image";
import Dialog from "./Dialog";

export default function LineNotifySetupTutorialDialog({
  show,
  closeModal,
  onConfirm,
}: {
  show: boolean;
  closeModal: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog title="設定 Line 通知" show={show} closeModal={closeModal}>
      <p className="py-4">
        請於下一頁點選『透過1對1聊天接收LINE Notify的通知』
      </p>
      <div className="flex w-full flex-col items-center">
        <Image
          className="max-h-[60vh] w-auto shadow-xl"
          src="/line_notify_tutorial.jpg"
          alt="Line Notify 教學圖片"
          width={1179}
          height={2556}
        />
      </div>
      <form method="dialog" className="flex justify-end space-x-2">
        <button
          className="btn btn-info mt-4"
          onClick={() => {
            onConfirm();
            closeModal();
          }}
        >
          我知道了
        </button>
      </form>
    </Dialog>
  );
}
