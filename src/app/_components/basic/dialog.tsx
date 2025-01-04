"use client";

import { Dialog as DialogHeadless, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { Fragment, createContext, useContext } from "react";

function DialogBackground() {
  return (
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="fixed inset-0 bg-black/25" />
    </Transition.Child>
  );
}

function DialogTransition({ children }: { children: React.ReactNode }) {
  return (
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-200"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      {children}
    </Transition.Child>
  );
}

type DialogContextType = {
  closeModal: () => void;
};

const DialogContext = createContext<DialogContextType>({
  closeModal: () => {
    return;
  },
});

export function useDialogContext() {
  return useContext(DialogContext);
}

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
    <Transition appear show={show} as={Fragment}>
      <DialogHeadless as="div" className="relative z-10" onClose={closeModal}>
        <DialogBackground />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogTransition>
              <DialogHeadless.Panel className="w-full max-w-md transform space-y-4 rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex flex-row items-center">
                  <DialogHeadless.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {title}
                  </DialogHeadless.Title>
                  <div className="flex-grow" />
                  <button
                    className="btn btn-circle btn-ghost btn-sm"
                    onClick={closeModal}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <DialogContext.Provider value={{ closeModal }}>
                  {children}
                </DialogContext.Provider>
              </DialogHeadless.Panel>
            </DialogTransition>
          </div>
        </div>
      </DialogHeadless>
    </Transition>
  );
}
