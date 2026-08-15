import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { fieldClass, labelClass } from './sharedClasses';

interface SaveRequestModalProps {
  open: boolean;
  onClose: () => void;
  initialName: string;
  onSave: (name: string) => void;
}

export const SaveRequestModal = ({ open, onClose, initialName, onSave }: SaveRequestModalProps) => {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} titleId="save-request-heading" title="Save request" maxWidthClassName="max-w-sm">
      <form onSubmit={handleSubmit}>
        <label htmlFor="save-request-name" className={`${labelClass} block mb-1.5`}>
          Name
        </label>
        <input
          id="save-request-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Get Users"
          className={fieldClass}
        />
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-secondary-text hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-accent-blue text-bg-pure hover:glow-blue transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
};
