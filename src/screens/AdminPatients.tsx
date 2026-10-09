import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { patientsApi, type ApiPatient } from '../services/api';
import { wardNameOf, fmtDate, shortId } from '../utils/patient';
import StatusBadge from '../components/StatusBadge';
import PatientFormModal from '../components/PatientFormModal';
import { RemovePatientDialog, DischargeDialog } from '../components/PatientActions';
import { Spinner } from '../components/LoadingState';

interface Props {
  onNavigate: (screen: Screen, patientId?: string) => void;
}

export default function AdminPatients({ onNavigate }: Props) {
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast]       = useState('');

  const [showAdd, setShowAdd]       = useState(false);
  const [editPatient, setEditPatient]       = useState<ApiPatient | null>(null);
  const [dischargePatient, setDischargePatient] = useState<ApiPatient | null>(null);
  const [removePatient, setRemovePatient]   = useState<ApiPatient | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 5000); };

  const load = () =>
    patientsApi.list()
      .then(r => { setPatients(r.data); setLoadError(''); })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load patients'))
      .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);

  const handleChanged = (message: string) => {
    setShowAdd(false); setEditPatient(null); setDischargePatient(null); setRemovePatient(null);
    showToast(message);
    void load();
  };

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q)
      || p.bed.toLowerCase().includes(q) || p.diagnosis.toLowerCase().includes(q);
    return matchSearch && (statusFilter === 'All' || p.status === statusFilter);
  });

  if (loading) return <Spinner label="Loading patients..." />;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {patients.length} registered · {patients.filter(p => p.status !== 'Discharged').length} admitted
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          + Register Patient
        </button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-4 py-2.5 rounded-lg border border-red-200">
          <span>⚠</span> {loadError}. Make sure the backend is running and the database is seeded.
        </div>
      )}
      {toast && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm bg-green-50 text-green-700 border-green-200">✓ {toast}</div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, bed or diagnosis..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700">
          {['All', 'Stable', 'Attention', 'Critical', 'Discharged'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              {['Patient', 'Ward / Bed', 'Diagnosis', 'Admitted', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">No patients found</td></tr>
            ) : filtered.map(p => (
              <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-900 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-400">{shortId(p._id)} · {p.age}y · {p.gender}</div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-xs font-semibold text-slate-700">{wardNameOf(p)}</div>
                  <div className="font-mono text-xs text-slate-500">{p.status === 'Discharged' ? 'No bed' : `Bed ${p.bed}`}</div>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[180px] truncate">{p.diagnosis}</td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{fmtDate(p.admissionDate)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5 justify-end whitespace-nowrap">
                    <button onClick={() => onNavigate('patient-profile', p._id)} className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">View</button>
                    <button onClick={() => setEditPatient(p)} className="px-2.5 py-1 text-xs font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">Edit</button>
                    {p.status !== 'Discharged' && (
                      <button onClick={() => setDischargePatient(p)} className="px-2.5 py-1 text-xs font-semibold border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50">Discharge</button>
                    )}
                    <button onClick={() => setRemovePatient(p)} className="px-2.5 py-1 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <PatientFormModal onSaved={handleChanged} onClose={() => setShowAdd(false)} />}
      {editPatient && <PatientFormModal patient={editPatient} onSaved={handleChanged} onClose={() => setEditPatient(null)} />}
      {dischargePatient && <DischargeDialog patient={dischargePatient} onDone={handleChanged} onClose={() => setDischargePatient(null)} />}
      {removePatient && <RemovePatientDialog patient={removePatient} onDone={handleChanged} onClose={() => setRemovePatient(null)} />}
    </div>
  );
}
