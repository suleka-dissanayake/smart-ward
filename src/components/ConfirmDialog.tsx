interface Props {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, busy, error, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={busy ? undefined : onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${danger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            {danger ? '⚠' : '?'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <div className="text-sm text-slate-600 mt-1.5 leading-relaxed">{message}</div>
          </div>
        </div>
        {error && <div className="mt-4 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-200">✗ {error}</div>}
        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} disabled={busy}
            className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={onConfirm} disabled={busy}
            className={`flex-1 py-2.5 text-white text-sm font-semibold rounded-xl disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {busy ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
