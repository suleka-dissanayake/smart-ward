import { useState, useEffect } from 'react';
import type { AppUser, Screen } from '../types';
import { mockPatients } from '../data/mockData';
import { patientsApi, type ApiPatient } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface Props {
  user: AppUser;
  onNavigate: (screen: Screen, patientId?: string) => void;
}

function normName(p: ApiPatient): string {
  const doc = p.assignedDoctor;
  return typeof doc === 'object' && doc !== null ? (doc as { name: string }).name : String(doc);
}

export default function DoctorDashboard({ user, onNavigate }: Props) {
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    patientsApi.list()
      .then(res => {
        const mine = res.data.filter(p => normName(p) === user.name);
        setPatients(mine);
      })
      .catch(() => {
        setApiError(true);
        const fallback = mockPatients.filter(p => p.assignedDoctor === user.name);
        setPatients(fallback.map(p => ({ ...p, _id: p.id, ward: p.ward, vitals: [p.vitals as never], medications: p.medications as never, wardRounds: p.wardRounds as never, nursingNotes: p.nursingNotes as never, assignedDoctor: p.assignedDoctor, assignedNurse: p.assignedNurse })) as unknown as ApiPatient[]);
      });
  }, [user.name]);

  const attention = patients.filter(p => p.status === 'Attention' || p.status === 'Critical');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const stats = [
    { label: 'Assigned Patients',    value: patients.length,   color: 'bg-blue-600',  icon: '♥',  sub: 'under your care' },
    { label: "Today's Ward Rounds",  value: patients.length,   color: 'bg-teal-600',  icon: '🩺', sub: 'rounds scheduled' },
    { label: 'Need Attention',        value: attention.length,  color: 'bg-amber-500', icon: '⚠',  sub: 'require review' },
  ];

  const getName = (p: ApiPatient) => p.name;
  const getBed   = (p: ApiPatient) => p.bed;
  const getWard  = (p: ApiPatient): string => {
    const w = p.ward;
    return typeof w === 'object' && w !== null ? (w as { name: string }).name : String(w);
  };
  const getId = (p: ApiPatient) => p._id;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
      {apiError && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-700 text-xs px-4 py-2.5 rounded-lg border border-amber-200">
          <span>⚠</span> Backend offline — showing demo data. Deploy the Supabase edge function and seed the database to use live data.
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{greeting},</p>
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('ward-round')} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            Start Ward Round
          </button>
          <button onClick={() => onNavigate('patient-list')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            View All Patients
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center text-white text-sm`}>{s.icon}</div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{s.value}</div>
            <div className="text-xs text-slate-400">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today's Ward Rounds</h2>
              <p className="text-xs text-slate-400 mt-0.5">{patients.length} patients assigned to you</p>
            </div>
            <button onClick={() => onNavigate('patient-list')} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {patients.map(p => (
              <div
                key={getId(p)}
                onClick={() => onNavigate('patient-profile', getId(p))}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center">
                    {getBed(p)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{getName(p)}</div>
                    <div className="text-xs text-slate-500">{p.diagnosis} · {getWard(p)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <button
                    onClick={e => { e.stopPropagation(); onNavigate('ward-round', getId(p)); }}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Round
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Patient List',  screen: 'patient-list'  as Screen, icon: '♥',  color: 'bg-blue-50 text-blue-700' },
                { label: 'Ward View',     screen: 'ward-bed'      as Screen, icon: '⊟',  color: 'bg-teal-50 text-teal-700' },
                { label: 'Notifications', screen: 'notifications' as Screen, icon: '🔔', color: 'bg-amber-50 text-amber-700' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.screen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center text-sm`}>{action.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {attention.length > 0 && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
              <h2 className="text-sm font-bold text-amber-900 mb-3">⚠ Needs Attention</h2>
              <div className="space-y-2">
                {attention.map(p => (
                  <button
                    key={getId(p)}
                    onClick={() => onNavigate('patient-profile', getId(p))}
                    className="w-full text-left px-3 py-2.5 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-900">{getName(p)}</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">Bed {getBed(p)} · {p.status}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
