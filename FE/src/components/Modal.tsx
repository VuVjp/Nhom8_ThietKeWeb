import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { PropsWithChildren } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-4">
        <DialogPanel className="relative flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:max-h-[calc(100vh-2rem)]">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <div className="border-b border-slate-200 px-4 py-3 pr-14 sm:px-5">
            <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
