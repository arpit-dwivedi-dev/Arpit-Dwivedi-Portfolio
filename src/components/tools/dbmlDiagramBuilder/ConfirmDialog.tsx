import { Modal } from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      widthClass="max-w-sm"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-300 dbml-light:text-slate-700 hover:bg-slate-800 dbml-light:hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3 py-1.5 rounded-md text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              danger ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-400' : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-400'
            }`}
            autoFocus
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-300 dbml-light:text-slate-700">{message}</p>
    </Modal>
  );
}
