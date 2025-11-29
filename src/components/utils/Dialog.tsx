import {
  CloseButton,
  DialogBackdrop,
  Dialog as DialogHeadless,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";

export default function Dialog({
  title,
  show,
  closeModal,
  children,
}: {
  title: string;
  show: boolean;
  closeModal: () => void;
  children: React.ReactNode;
}) {
  return (
    <DialogHeadless
      as="div"
      open={show}
      className="relative z-50 transition duration-300 ease-out data-[closed]:opacity-0"
      onClose={closeModal}
      transition
    >
      <DialogBackdrop className="fixed inset-0 z-40 bg-black/30" />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-md transform space-y-4 rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex flex-row items-center">
              <DialogTitle className="font-medium text-gray-900 text-lg leading-6">
                {title}
              </DialogTitle>
              <div className="flex-grow" />
              <CloseButton className="btn btn-circle btn-ghost btn-sm">
                <XMarkIcon className="h-6 w-6" />
              </CloseButton>
            </div>
            {children}
          </DialogPanel>
        </div>
      </div>
    </DialogHeadless>
  );
}
