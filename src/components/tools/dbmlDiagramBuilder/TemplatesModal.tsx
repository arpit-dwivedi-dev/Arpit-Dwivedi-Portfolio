import { Modal } from './Modal';
import { TEMPLATES, type DbmlTemplate } from '../../../tools/dbmlDiagramBuilder/sampleTemplates';

interface TemplatesModalProps {
  onPick: (template: DbmlTemplate) => void;
  onClose: () => void;
}

export function TemplatesModal({ onPick, onClose }: TemplatesModalProps) {
  return (
    <Modal title="Templates" onClose={onClose} widthClass="max-w-lg">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TEMPLATES.map((template) => (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => onPick(template)}
              className="w-full text-left rounded-md border border-slate-800 dbml-light:border-slate-200 hover:border-blue-500 hover:bg-slate-800/50 dbml-light:hover:bg-slate-100 px-3 py-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <div className="text-sm font-medium text-slate-100 dbml-light:text-slate-900">{template.name}</div>
              <div className="mt-0.5 text-xs text-slate-400 dbml-light:text-slate-500">{template.description}</div>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
