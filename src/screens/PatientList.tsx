import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { mockPatients } from '../data/mockData';
import { patientsApi, type ApiPatient } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface Props {
  onNavigate: (screen: Screen, patientId?: string) => void;
}

function wardName(p: ApiPatient): string {
  const w = p.ward;
  return typeof w === 'object' && w !== null ? (w as { name: string }).name : String(w);
}

export default function PatientList({ onNavigate }: Props) {
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch]       = useState('');
  const [wardFilter, setWardFilter]     = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    patientsApi.list()
      .then(res => setPatients(res.data))
      .catch(() => {
        setApiError(true);
        setPatients(mockPatients.map(p => ({ ...p, _id: p.id, ward: p.ward, vitals: [p.vitals as never], medications: p.medications as never, wardRounds: p.wardRounds as never, nursingNotes: p.nursingNotes as never, assignedDoctor: p.assignedDoctor, assignedNurse: p.assignedNurse })) as unknown as ApiPatient[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const wards    = ['All', ...Array.from(new Set(patients.map(p => wardName(p))))];
  const statuses = ['All', 'Stable', 'Attention', 'Critical'];

  const filtered = patients.filter(p => {
    const q = search.toLowerCase();
    const pWard = wardName(p);
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p._id.toLowerCase().includes(q) || p.bed.toLowerCase().includes(q);
    const matchWard   = wardFilter === 'All' || pWard === wardFilter;
    const matchStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchWard && matchStatus;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      {apiError && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-xs px-4 py-2.5 rounded-lg border border-amber-200">
          <span>⚠</span> Backend offline — showing demo data.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Patient List</h1>
          <p className="text-sm text-slate-500 mt-0.5">{patients.length} total patients</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, or bed..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <select value={wardFilter} onChange={e => setWardFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700">
          {wards.map(w => <option key={w}>{w}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_120px_100px_120px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Patient</span><span>Diagnosis</span><span>Ward / Bed</span>
          <span>Status</span><span>Admitted</span><span></span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-400">No patients found</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(p => {
              const doc = p.assignedDoctor;
              const docName = typeof doc === 'object' && doc !== null ? (doc as { name: string }).name : String(doc);
              return (
                <div
                  key={p._id}
                  onClick={() => onNavigate('patient-profile', p._id)}
                  className="grid grid-cols-[1fr_1fr_120px_100px_120px_80px] gap-4 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors items-center"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.age}y · {p.gender} · {docName}</div>
                  </div>
                  <div className="text-sm text-slate-600 truncate">{p.diagnosis}</div>
                  <div>
                    <div className="text-xs font-semibold text-slate-700">{wardName(p)}</div>
                    <div className="text-xs text-slate-400">Bed {p.bed}</div>
                  </div>
                  <StatusBadge status={p.status} />
                  <div className="text-xs text-slate-500">{new Date(p.admissionDate).toLocaleDateString('en-GB')}</div>
                  <button
                    onClick={e => { e.stopPropagation(); onNavigate('patient-profile', p._id); }}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >View</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
