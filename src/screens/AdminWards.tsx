import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { wardsApi, patientsApi, type ApiWard, type ApiPatient } from '../services/api';
import { shortId, wardNameOf } from '../utils/patient';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { Spinner } from '../components/LoadingState';

interface Props {
  onNavigate: (screen: Screen, patientId?: string) => void;
}

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide';
const btnPrimary = 'flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60';
const btnCancel = 'flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50';

type Dialog =
  | { kind: 'add-ward' }
  | { kind: 'edit-ward' }
  | { kind: 'delete-ward' }
  | { kind: 'add-bed' }
  | { kind: 'remove-bed'; bedNumber: string }
  | { kind: 'assign'; bedNumber: string }
  | null;

export default function AdminWards({ onNavigate }: Props) {
  const [wards, setWards]       = useState<ApiWard[]>([]);
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [toast, setToast]       = useState<{ text: string; error?: boolean } | null>(null);

  const [dialog, setDialog]     = useState<Dialog>(null);
  const [busy, setBusy]         = useState(false);
  const [dialogError, setDialogError] = useState('');

  // form state shared by the small dialogs
  const [wardForm, setWardForm] = useState({ name: '', totalBeds: '', description: '' });
  const [bedForm, setBedForm]   = useState({ label: '', count: '1' });
  const [assignSearch, setAssignSearch] = useState('');

  const showToast = (text: string, error = false) => { setToast({ text, error }); setTimeout(() => setToast(null), 5000); };

  const load = () =>
    Promise.all([wardsApi.list(), patientsApi.list()])
      .then(([w, p]) => {
        setWards(w.data);
        setPatients(p.data);
        setSelectedId(cur => (w.data.some(x => x._id === cur) ? cur : w.data[0]?._id ?? ''));
        setLoadError('');
      })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load wards'))
      .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);

  const selected = wards.find(w => w._id === selectedId);
  const patientById = new Map(patients.map(p => [p._id, p]));

  const open = (d: Dialog) => { setDialogError(''); setDialog(d); };
  const close = () => { if (!busy) setDialog(null); };

  /** Runs an API action; keeps the dialog open and shows the server's message on failure. */
  const run = async (action: () => Promise<unknown>, successMsg: string, after?: () => void) => {
    setBusy(true);
    setDialogError('');
    try {
      await action();
      await load(); // refresh first so the page never flashes an empty/stale state
      setDialog(null);
      showToast(successMsg);
      after?.();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const openAddWard = () => { setWardForm({ name: '', totalBeds: '', description: '' }); open({ kind: 'add-ward' }); };
  const openEditWard = () => { if (selected) { setWardForm({ name: selected.name, totalBeds: '', description: selected.description ?? '' }); open({ kind: 'edit-ward' }); } };
  const openAddBed = () => { setBedForm({ label: '', count: '1' }); open({ kind: 'add-bed' }); };
  const openAssign = (bedNumber: string) => { setAssignSearch(''); open({ kind: 'assign', bedNumber }); };

  if (loading) return <Spinner label="Loading wards..." />;

  const bedRows = selected?.beds ?? [];
  const available = selected ? selected.totalBeds - selected.occupiedBeds : 0;

  // Patients that could be moved into a free bed: everyone except those already in this ward's other beds is fine,
  // so list all; discharged patients are re-admitted into the chosen bed.
  const assignable = patients
    .filter(p => {
      const q = assignSearch.toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || p.diagnosis.toLowerCase().includes(q);
    })
    .sort((a, b) => Number(b.status === 'Discharged') - Number(a.status === 'Discharged') || a.name.localeCompare(b.name));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ward & Bed Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{wards.length} wards configured</p>
        </div>
        <button onClick={openAddWard} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          + Add Ward
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${toast.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {toast.error ? '✗' : '✓'} {toast.text}
        </div>
      )}
      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-4 py-2.5 rounded-lg border border-red-200">
          <span>⚠</span> {loadError}. Make sure the backend is running and the database is seeded.
        </div>
      )}

      {wards.length === 0 && !loadError && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No wards yet. Click <strong>+ Add Ward</strong> to create the first one.
        </div>
      )}

      {/* Ward selector cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {wards.map(w => {
          const pct = w.totalBeds > 0 ? Math.round((w.occupiedBeds / w.totalBeds) * 100) : 0;
          return (
            <button
              key={w._id}
              onClick={() => setSelectedId(w._id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${selectedId === w._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
            >
              <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${selectedId === w._id ? 'text-blue-700' : 'text-slate-500'}`}>{w.name}</div>
              <div className="text-lg font-bold text-slate-900">{w.occupiedBeds}<span className="text-slate-400 text-sm font-normal">/{w.totalBeds}</span></div>
              <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{w.totalBeds - w.occupiedBeds} available</div>
            </button>
          );
        })}
      </div>

      {/* Selected ward */}
      {selected && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{selected.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selected.totalBeds} beds · {selected.occupiedBeds} occupied · {available} available
                {selected.description ? ` · ${selected.description}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={openAddBed} className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add Bed</button>
              <button onClick={openEditWard} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">Edit Ward</button>
              <button onClick={() => open({ kind: 'delete-ward' })} className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Delete Ward</button>
            </div>
          </div>
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Bed', 'Status', 'Patient', ''].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bedRows.map(b => {
                  const pd = b.patientId ? patientById.get(String(b.patientId)) : undefined;
                  return (
                    <tr key={b.bedNumber} className="hover:bg-slate-50">
                      <td className="py-3 pr-4 font-mono text-sm font-bold text-slate-700">{b.bedNumber}</td>
                      <td className="py-3 pr-4"><StatusBadge status={pd ? pd.status : b.isOccupied ? 'Attention' : 'Available'} /></td>
                      <td className="py-3 pr-4">
                        {pd ? (
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{pd.name}</div>
                            <div className="text-xs text-slate-400">{shortId(pd._id)} · {pd.age}y {pd.gender}</div>
                          </div>
                        ) : b.isOccupied ? <span className="text-xs text-slate-500">Patient assigned</span>
                          : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-3 justify-end whitespace-nowrap">
                          {b.isOccupied ? (
                            b.patientId && <button onClick={() => onNavigate('patient-profile', String(b.patientId))} className="text-xs text-blue-600 font-semibold hover:underline">View patient</button>
                          ) : (
                            <>
                              <button onClick={() => openAssign(b.bedNumber)} className="text-xs text-green-700 font-semibold hover:underline">Assign patient</button>
                              <button onClick={() => open({ kind: 'remove-bed', bedNumber: b.bedNumber })} className="text-xs text-red-600 font-semibold hover:underline">Remove bed</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- dialogs ---------- */}
      {dialog?.kind === 'add-ward' && (
        <Modal title="Add New Ward" subtitle="Beds are numbered automatically — you can add or rename them later" onClose={close}>
          <form onSubmit={e => { e.preventDefault(); void run(async () => {
            const res = await wardsApi.create({ name: wardForm.name.trim(), totalBeds: Number(wardForm.totalBeds), description: wardForm.description.trim() || undefined });
            setSelectedId(res.data._id);
          }, `Ward "${wardForm.name.trim()}" added.`); }} className="space-y-4">
            {dialogError && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {dialogError}</div>}
            <div><label className={labelCls}>Ward name</label>
              <input required value={wardForm.name} onChange={e => setWardForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Surgical Ward C" /></div>
            <div><label className={labelCls}>Number of beds</label>
              <input required type="number" min={1} max={200} value={wardForm.totalBeds} onChange={e => setWardForm(f => ({ ...f, totalBeds: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Description (optional)</label>
              <input value={wardForm.description} onChange={e => setWardForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={close} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Create Ward'}</button></div>
          </form>
        </Modal>
      )}

      {dialog?.kind === 'edit-ward' && selected && (
        <Modal title={`Edit ${selected.name}`} subtitle="Use Add Bed / Remove Bed to change the number of beds" onClose={close}>
          <form onSubmit={e => { e.preventDefault(); void run(
            () => wardsApi.update(selected._id, { name: wardForm.name.trim(), description: wardForm.description.trim() }),
            'Ward updated.'); }} className="space-y-4">
            {dialogError && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {dialogError}</div>}
            <div><label className={labelCls}>Ward name</label>
              <input required value={wardForm.name} onChange={e => setWardForm(f => ({ ...f, name: e.target.value }))} className={inputCls} /></div>
            <div><label className={labelCls}>Description</label>
              <input value={wardForm.description} onChange={e => setWardForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={close} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Save changes'}</button></div>
          </form>
        </Modal>
      )}

      {dialog?.kind === 'delete-ward' && selected && (
        <ConfirmDialog danger title={`Delete ${selected.name}?`}
          message={selected.occupiedBeds > 0
            ? <>This ward still has <strong>{selected.occupiedBeds} occupied bed{selected.occupiedBeds === 1 ? '' : 's'}</strong> and can't be deleted. Transfer or discharge those patients first.</>
            : 'The ward and all of its beds will be permanently deleted.'}
          confirmLabel="Delete ward" busy={busy} error={dialogError}
          onConfirm={() => void run(() => wardsApi.remove(selected._id), `Ward "${selected.name}" deleted.`)}
          onCancel={close} />
      )}

      {dialog?.kind === 'add-bed' && selected && (
        <Modal title={`Add beds to ${selected.name}`} subtitle="Leave the label empty to number the new beds automatically" onClose={close}>
          <form onSubmit={e => { e.preventDefault(); void run(
            () => wardsApi.addBeds(selected._id, bedForm.label.trim() ? { bedNumber: bedForm.label.trim() } : { count: Number(bedForm.count) }),
            bedForm.label.trim() ? `Bed ${bedForm.label.trim()} added.` : `${bedForm.count} bed(s) added.`); }} className="space-y-4">
            {dialogError && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {dialogError}</div>}
            <div><label className={labelCls}>Bed label (optional)</label>
              <input value={bedForm.label} onChange={e => setBedForm(f => ({ ...f, label: e.target.value }))} className={inputCls} placeholder="e.g. ICU-1" /></div>
            {!bedForm.label.trim() && (
              <div><label className={labelCls}>How many beds?</label>
                <input type="number" min={1} max={50} value={bedForm.count} onChange={e => setBedForm(f => ({ ...f, count: e.target.value }))} className={inputCls} /></div>
            )}
            <div className="flex gap-3 pt-2"><button type="button" onClick={close} className={btnCancel}>Cancel</button>
              <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Adding...' : 'Add'}</button></div>
          </form>
        </Modal>
      )}

      {dialog?.kind === 'remove-bed' && selected && (
        <ConfirmDialog danger title={`Remove bed ${dialog.bedNumber}?`}
          message={`Bed ${dialog.bedNumber} will be removed from ${selected.name}. Only empty beds can be removed.`}
          confirmLabel="Remove bed" busy={busy} error={dialogError}
          onConfirm={() => void run(() => wardsApi.removeBed(selected._id, dialog.bedNumber), `Bed ${dialog.bedNumber} removed.`)}
          onCancel={close} />
      )}

      {dialog?.kind === 'assign' && selected && (
        <Modal title={`Assign a patient to bed ${dialog.bedNumber}`} subtitle={selected.name} maxWidth="max-w-lg" onClose={close}>
          <div className="space-y-3">
            {dialogError && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {dialogError}</div>}
            <input value={assignSearch} onChange={e => setAssignSearch(e.target.value)} placeholder="Search patients..." className={inputCls} />
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {assignable.length === 0 && <p className="p-4 text-sm text-slate-400 text-center">No patients found. Register one from Patient Management.</p>}
              {assignable.map(p => {
                const discharged = p.status === 'Discharged';
                return (
                  <button key={p._id} disabled={busy}
                    onClick={() => void run(
                      () => patientsApi.update(p._id, discharged
                        ? { ward: selected._id, bed: dialog.bedNumber, status: 'Stable' }
                        : { ward: selected._id, bed: dialog.bedNumber }),
                      `${p.name} ${discharged ? 're-admitted to' : 'moved to'} bed ${dialog.bedNumber}.`)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 disabled:opacity-60">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.age}y {p.gender} · {discharged ? 'Discharged — will be re-admitted' : `Currently ${wardNameOf(p)}, bed ${p.bed}`}</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </button>
                );
              })}
            </div>
            <button onClick={close} className={`${btnCancel} w-full`}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
