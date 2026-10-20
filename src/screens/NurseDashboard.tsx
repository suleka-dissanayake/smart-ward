import { useState, useEffect } from 'react';
import type { AppUser, Screen } from '../types';
import { patientsApi, type ApiPatient } from '../services/api';
import { activePatients, bySeverity, buildHistory, fmtDateTime, greeting, pendingDoses, vitalsDue, wardNameOf } from '../utils/patient';
import StatusBadge from '../components/StatusBadge';
import PatientFormModal from '../components/PatientFormModal';
import { Spinner } from '../components/LoadingState';

interface Props {
  user: AppUser;
  onNavigate: (screen: Screen, patientId?: string) => void;
}

const activityIcon: Record<string, string> = { vitals: '📊', medication: '💊', 'nursing-note': '📝' };

export default function NurseDashboard({ user, onNavigate }: Props) {
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [toast, setToast]       = useState('');

  const load = () =>
    patientsApi.list({ nurse: user.id })
      .then(res => { setPatients(activePatients(res.data).sort(bySeverity)); setError(''); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load patients'))
      .finally(() => setLoading(false));

  useEffect(() => { void load(); }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner label="Loading dashboard..." />;

  const vitalsOverdue = patients.filter(p => vitalsDue(p)).length;
  const medsDue = patients.reduce((n, p) => n + pendingDoses(p), 0);

  // The five most recent things recorded across my patients (vitals, doses given, nursing notes).
  const recent = patients
    .flatMap(p => buildHistory(p)
      .filter(h => h.type === 'vitals' || h.type === 'medication' || h.type === 'nursing-note')
      .map(h => ({ ...h, patient: p })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-4 py-2.5 rounded-lg border border-red-200">
          <span>⚠</span> {error}. Make sure the backend is running and the database is seeded.
        </div>
      )}
      {toast && <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm bg-green-50 text-green-700 border-green-200">✓ {toast}</div>}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-slate-500 mb-1">{greeting()},</p>
          <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            + Add Patient
          </button>
          <button onClick={() => onNavigate('patient-list')} className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors">
            View Patients
          </button>
          <button onClick={() => onNavigate('notifications')} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
            Notifications
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'My Patients',     value: patients.length, color: 'bg-teal-600',  icon: '♥',  sub: 'assigned to you' },
          { label: 'Vitals Due',      value: vitalsOverdue,   color: 'bg-amber-500', icon: '📊', sub: 'none recorded in the last 6 hours' },
          { label: 'Medications Due', value: medsDue,         color: 'bg-blue-600',  icon: '💊', sub: 'pending doses' },
        ].map(s => (
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
              <h2 className="text-sm font-bold text-slate-900">My Patients</h2>
              <p className="text-xs text-slate-400 mt-0.5">{patients.length} assigned to you</p>
            </div>
            <button onClick={() => onNavigate('patient-list')} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {patients.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">No patients assigned to you yet. Use <strong>+ Add Patient</strong> to admit one.</p>
            )}
            {patients.map(p => (
              <div key={p._id} onClick={() => onNavigate('patient-profile', p._id)}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">{p.bed}</div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.diagnosis} · {wardNameOf(p)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <div className="flex gap-1">
                    <button onClick={e => { e.stopPropagation(); onNavigate('record-vitals', p._id); }}
                      className="text-xs px-2.5 py-1.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700">Vitals</button>
                    <button onClick={e => { e.stopPropagation(); onNavigate('medications', p._id); }}
                      className="text-xs px-2.5 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Meds{pendingDoses(p) > 0 ? ` (${pendingDoses(p)})` : ''}</button>
                    <button onClick={e => { e.stopPropagation(); onNavigate('nursing-notes', p._id); }}
                      className="text-xs px-2.5 py-1.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50">Note</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Quick Actions</h2>
            <p className="text-[11px] text-slate-400 mb-3">Pick a patient, then record…</p>
            <div className="space-y-2">
              {[
                { label: 'Record Vitals',  screen: 'patient-list' as Screen, icon: '📊', color: 'bg-teal-50 text-teal-700' },
                { label: 'Nursing Notes',  screen: 'patient-list' as Screen, icon: '📝', color: 'bg-blue-50 text-blue-700' },
                { label: 'Medications',    screen: 'patient-list' as Screen, icon: '💊', color: 'bg-purple-50 text-purple-700' },
                { label: 'Notifications',  screen: 'notifications' as Screen, icon: '🔔', color: 'bg-amber-50 text-amber-700' },
              ].map(action => (
                <button key={action.label} onClick={() => onNavigate(action.screen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left">
                  <span className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center text-sm`}>{action.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Recent Activity</h2>
            {recent.length === 0 ? (
              <p className="text-xs text-slate-400">Nothing recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recent.map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className="text-base">{activityIcon[a.type]}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 truncate">{a.title} · {a.patient.name}</div>
                      <div className="text-[11px] text-slate-500">{fmtDateTime(a.date)} · {a.staff}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <PatientFormModal
          onClose={() => setShowAdd(false)}
          onSaved={msg => { setShowAdd(false); setToast(msg); setTimeout(() => setToast(''), 5000); void load(); }}
        />
      )}
    </div>
  );
}
