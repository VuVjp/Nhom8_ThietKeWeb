import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { PropsWithChildren } from 'react';

interface ModalProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose: () => void;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
          <DialogTitle className="text-lg font-semibold text-slate-900">{title}</DialogTitle>
          <div className="mt-4">{children}</div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
