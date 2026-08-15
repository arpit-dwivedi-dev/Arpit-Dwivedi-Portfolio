import { TableProperties } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center max-w-xs px-6">
        <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center">
          <TableProperties size={20} className="text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-600">No tables found</p>
        <p className="mt-1 text-sm text-slate-400">
          Write DBML in the editor to generate your database diagram.
        </p>
      </div>
    </div>
  );
}
