export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onBack }: { message: string; onBack?: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6 max-w-md text-center">
        <p className="text-sm font-semibold text-red-700 mb-1">Something went wrong</p>
        <p className="text-sm text-slate-600">{message}</p>
        <p className="text-xs text-slate-400 mt-2">Check that the backend is running on port 5000 and the database is seeded.</p>
        {onBack && (
          <button onClick={onBack} className="mt-4 px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            ← Go back
          </button>
        )}
      </div>
    </div>
  );
}
