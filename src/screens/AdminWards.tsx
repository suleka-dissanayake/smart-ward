import { useState, useEffect } from 'react';
import { mockWards, getBedLayout } from '../data/mockData';
import type { Screen } from '../types';
import { wardsApi, type ApiWard } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface Props {
  onNavigate: (screen: Screen, patientId?: string) => void;
}

const EMPTY_FORM = { name: '', totalBeds: '', description: '' };

export default function AdminWards({ onNavigate }: Props) {
  const [wards, setWards]       = useState<ApiWard[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');
  const [showAdd, setShowAdd]   = useState(false);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');
  const [usingMock, setUsingMock] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  useEffect(() => {
    wardsApi.list()
      .then(res => {
        setWards(res.data);
        if (res.data.length > 0) setSelectedId(res.data[0]._id);
      })
      .catch(() => {
        setUsingMock(true);
        const fallback: ApiWard[] = mockWards.map(w => ({
          _id: w.id, name: w.name, totalBeds: w.totalBeds,
          occupiedBeds: w.occupiedBeds, beds: [],
        }));
        setWards(fallback);
        if (fallback.length > 0) setSelectedId(fallback[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddWard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await wardsApi.create({
        name: form.name.trim(),
        totalBeds: Number(form.totalBeds),
        description: form.description.trim() || undefined,
      } as Partial<ApiWard>);
      setWards(prev => [...prev, res.data]);
      setSelectedId(res.data._id);
      showToast(`Ward "${res.data.name}" added successfully.`);
      setShowAdd(false);
      setForm({ ...EMPTY_FORM });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add ward');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWard = async (ward: ApiWard) => {
    if (!confirm(`Delete "${ward.name}"? This cannot be undone.`)) return;
    try {
      await wardsApi.remove(ward._id);
      const remaining = wards.filter(w => w._id !== ward._id);
      setWards(remaining);
      if (selectedId === ward._id) setSelectedId(remaining[0]?._id ?? '');
      showToast(`Ward "${ward.name}" deleted.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete ward (may have occupied beds)');
    }
  };

  const selected = wards.find(w => w._id === selectedId);

  // Bed rows: use real beds from API if available, else fall back to mock layout
  const bedRows = (() => {
    if (!selected) return [];
    if (selected.beds && selected.beds.length > 0) {
      return selected.beds.map(b => ({
        bedNumber: b.bedNumber,
        isOccupied: b.isOccupied,
        patientId: b.patientId,
      }));
    }
    // Offline fallback: use mock getBedLayout
    const prefix = selected.name.split(' ')[0];
    return getBedLayout(selected.name)
      .filter(b => b.bed.startsWith(prefix))
      .map(b => ({
        bedNumber: b.bed,
        isOccupied: !!b.patient,
        patientId: b.patient?.id,
        patientData: b.patient,
        status: b.status,
      }));
  })();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ward & Bed Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{wards.length} wards configured</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Add Ward
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${toast.includes('Failed') || toast.includes('cannot') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {toast.includes('Failed') || toast.includes('cannot') ? '✗' : '✓'} {toast}
        </div>
      )}

      {usingMock && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-xs px-4 py-2.5 rounded-lg border border-amber-200">
          <span>⚠</span> Backend offline — showing demo data. Add Ward will not persist until the server is running.
        </div>
      )}

      {/* Ward selector cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {wards.map(w => {
          const pct = w.totalBeds > 0 ? Math.round((w.occupiedBeds / w.totalBeds) * 100) : 0;
          return (
            <div key={w._id} className="relative group">
              <button
                onClick={() => setSelectedId(w._id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedId === w._id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-blue-300'}`}
              >
                <div className={`text-xs font-bold uppercase tracking-wide mb-2 ${selectedId === w._id ? 'text-blue-700' : 'text-slate-500'}`}>
                  {w.name}
                </div>
                <div className="text-lg font-bold text-slate-900">
                  {w.occupiedBeds}<span className="text-slate-400 text-sm font-normal">/{w.totalBeds}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{w.totalBeds - w.occupiedBeds} available</div>
              </button>
              {/* Delete button — shows on hover */}
              <button
                onClick={() => handleDeleteWard(w)}
                className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs font-bold items-center justify-center hidden group-hover:flex hover:bg-red-200 transition-colors"
                title="Delete ward"
              >×</button>
            </div>
          );
        })}
      </div>

      {/* Bed detail */}
      {selected && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">{selected.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {selected.totalBeds} beds · {selected.occupiedBeds} occupied · {selected.totalBeds - selected.occupiedBeds} available
              </p>
            </div>
          </div>
          <div className="p-5">
            {bedRows.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No bed data available</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Bed', 'Status', 'Patient', ''].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bedRows.map((b) => {
                    const pd = (b as { patientData?: { name: string; id: string; age: number; gender: string; admissionDate: string; diagnosis: string } }).patientData;
                    return (
                      <tr key={b.bedNumber} className="hover:bg-slate-50">
                        <td className="py-3 pr-4 font-mono text-sm font-bold text-slate-700">{b.bedNumber}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={b.isOccupied ? 'Attention' : 'Available'} />
                        </td>
                        <td className="py-3 pr-4">
                          {pd ? (
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{pd.name}</div>
                              <div className="text-xs text-slate-400">{pd.id} · {pd.age}y {pd.gender}</div>
                            </div>
                          ) : b.isOccupied ? (
                            <span className="text-xs text-slate-500">Patient assigned</span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {b.isOccupied && b.patientId ? (
                            <button
                              onClick={() => onNavigate('patient-profile', b.patientId!)}
                              className="text-xs text-blue-600 font-semibold hover:underline"
                            >View</button>
                          ) : (
                            <span className="text-xs text-green-600 font-semibold">Available</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add Ward modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Ward</h2>
                <p className="text-xs text-slate-400 mt-0.5">Beds are auto-generated from the total count</p>
              </div>
              <button onClick={() => { setShowAdd(false); setForm({ ...EMPTY_FORM }); }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <form onSubmit={handleAddWard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Ward Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Paediatric Ward E"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Total Beds</label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={form.totalBeds}
                  onChange={e => setForm(f => ({ ...f, totalBeds: e.target.value }))}
                  placeholder="e.g. 12"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Bed numbers will be auto-assigned (1 to n)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Description <span className="font-normal text-slate-400">(optional)</span></label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Children aged 0–12"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Preview */}
              {form.name && form.totalBeds && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Preview</p>
                  <p className="text-sm font-bold text-slate-900">{form.name}</p>
                  <p className="text-xs text-slate-500">{form.totalBeds} beds · 0 occupied · {form.totalBeds} available</p>
                  {form.description && <p className="text-xs text-slate-400 mt-0.5">{form.description}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAdd(false); setForm({ ...EMPTY_FORM }); }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50"
                >Cancel</button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >{saving ? 'Creating...' : 'Create Ward'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
