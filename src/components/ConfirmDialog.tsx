import { forwardRef, type ForwardedRef } from "react";

interface ConfirmDialogProps {
  title: string;
  content?: string;
  confirmText?: string;
  onConfirm: () => void;
}

function ConfirmDialogInner(
  { title, content, onConfirm, confirmText }: ConfirmDialogProps,
  ref: ForwardedRef<HTMLDialogElement>,
) {
  return (
    <dialog ref={ref} className="modal">
      <div className="modal-box">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="py-4">{content}</p>
        <div className="modal-action">
          <form method="dialog" className="space-x-2">
            <button className="btn">取消</button>
            <button className="btn btn-error" onClick={() => onConfirm()}>
              {confirmText ?? "確認"}
            </button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

export const ConfirmDialog = forwardRef(ConfirmDialogInner);
