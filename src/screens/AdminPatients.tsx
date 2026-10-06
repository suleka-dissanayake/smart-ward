import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { patientsApi, wardsApi, usersApi, type ApiPatient, type ApiWard, type ApiUser } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface Props {
  onNavigate: (screen: Screen, patientId?: string) => void;
}

const EMPTY_FORM = {
  name: '', age: '', gender: 'Male', ward: '', bed: '',
  diagnosis: '', allergies: '', admissionDate: new Date().toISOString().split('T')[0],
  assignedDoctor: '', assignedNurse: '', status: 'Stable' as const,
};

export default function AdminPatients({ onNavigate }: Props) {
  const [patients, setPatients]   = useState<ApiPatient[]>([]);
  const [wards, setWards]         = useState<ApiWard[]>([]);
  const [doctors, setDoctors]     = useState<ApiUser[]>([]);
  const [nurses, setNurses]       = useState<ApiUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  useEffect(() => {
    Promise.all([
      patientsApi.list().then(r => setPatients(r.data)),
      wardsApi.list().then(r => {
        setWards(r.data);
        if (r.data.length > 0) setForm(f => ({ ...f, ward: r.data[0]._id }));
      }),
      usersApi.doctors().then(r => {
        setDoctors(r.data);
        if (r.data.length > 0) setForm(f => ({ ...f, assignedDoctor: r.data[0]._id }));
      }),
      usersApi.nurses().then(r => {
        setNurses(r.data);
        if (r.data.length > 0) setForm(f => ({ ...f, assignedNurse: r.data[0]._id }));
      }),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q);
  });

  const wardName = (p: ApiPatient) => {
    const w = p.ward;
    return typeof w === 'object' && w !== null ? (w as { name: string }).name : String(w);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await patientsApi.create({
        name: form.name, age: Number(form.age),
        gender: form.gender as 'Male' | 'Female',
        ward: form.ward, bed: form.bed,
        admissionDate: form.admissionDate,
        diagnosis: form.diagnosis,
        allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
        assignedDoctor: form.assignedDoctor,
        assignedNurse: form.assignedNurse,
        status: form.status,
      });
      setPatients(prev => [res.data, ...prev]);
      showToast(`Patient "${res.data.name}" registered successfully.`);
      setShowAdd(false);
      setForm({ ...EMPTY_FORM, ward: wards[0]?._id ?? '', assignedDoctor: doctors[0]?._id ?? '', assignedNurse: nurses[0]?._id ?? '' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to register patient');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{patients.length} registered patients</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          + Register Patient
        </button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${toast.includes('Failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {toast.includes('Failed') ? '✗' : '✓'} {toast}
        </div>
      )}

      {/* Add Patient Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Register New Patient</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Full Name</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Age</label>
                  <input required type="number" min="0" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Gender</label>
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Ward</label>
                  <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Bed Number</label>
                  <input required value={form.bed} onChange={e => setForm(f => ({ ...f, bed: e.target.value }))} placeholder="e.g. A-05"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Assigned Doctor</label>
                  <select value={form.assignedDoctor} onChange={e => setForm(f => ({ ...f, assignedDoctor: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Assigned Nurse</label>
                  <select value={form.assignedNurse} onChange={e => setForm(f => ({ ...f, assignedNurse: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {nurses.map(n => <option key={n._id} value={n._id}>{n.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Admission Date</label>
                  <input required type="date" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Diagnosis</label>
                  <input required value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Known Allergies (comma-separated)</label>
                  <input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin, NSAIDs"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Registering...' : 'Register Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
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
                  <div className="text-xs text-slate-400">{p.age}y · {p.gender}</div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-xs font-semibold text-slate-700">{wardName(p)}</div>
                  <div className="font-mono text-xs text-slate-500">Bed {p.bed}</div>
                </td>
                <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[180px] truncate">{p.diagnosis}</td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{new Date(p.admissionDate).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5">
                    <button onClick={() => onNavigate('patient-profile', p._id)} className="px-2.5 py-1 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
