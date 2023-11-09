import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ForwardedRef,
  type ReactNode,
} from "react";

function InnerDialog(
  {
    open,
    onClose,
    children,
  }: {
    open: boolean;
    onClose?: () => void;
    children: ReactNode;
  },
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
    if (dialogRef.current) dialogRef.current.onclose = (_) => onClose?.();
  }, [dialogRef, onClose]);

  return (
    <dialog className="modal" ref={dialogRef}>
      {open && (
        <>
          <div className="modal-box flex h-3/5 flex-col space-y-4">
            {children}
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </>
      )}
    </dialog>
  );
}

export default forwardRef(InnerDialog);
