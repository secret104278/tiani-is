import Dialog from "./Dialog";

export default function ConfirmDialog({
  show,
  closeModal,
  title,
  content,
  confirmText,
  onConfirm,
}: {
  show: boolean;
  closeModal: () => void;

  title: string;
  content?: string;
  confirmText?: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog title={title} show={show} closeModal={closeModal}>
      <p className="py-4">{content}</p>
      <form method="dialog" className="flex justify-end space-x-2">
        <button className="btn" onClick={closeModal}>
          取消
        </button>
        <button
          className="btn btn-error"
          onClick={() => {
            onConfirm();
            closeModal();
          }}
        >
          {confirmText ?? "確認"}
        </button>
      </form>
    </Dialog>
  );
}
