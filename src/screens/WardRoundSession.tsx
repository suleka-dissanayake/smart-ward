import { useState, useEffect } from 'react';
import type { AppUser, Screen } from '../types';
import { patientsApi, type ApiPatient } from '../services/api';
import { activePatients, bySeverity, hadRoundToday, latestVitals, wardNameOf } from '../utils/patient';
import StatusBadge from '../components/StatusBadge';
import { Spinner, ErrorState } from '../components/LoadingState';

interface Props {
  user: AppUser;
  onNavigate: (screen: Screen, patientId?: string) => void;
}

export default function WardRoundSession({ user, onNavigate }: Props) {
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    patientsApi.list({ doctor: user.id })
      .then(res => setPatients(activePatients(res.data).sort(bySeverity)))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load your patients'))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <Spinner label="Preparing ward round..." />;
  if (error) return <ErrorState message={error} onBack={() => onNavigate('doctor-dashboard')} />;

  const pending = patients.filter(p => !hadRoundToday(p));
  const done = patients.length - pending.length;
  const pct = patients.length ? Math.round((done / patients.length) * 100) : 0;
  const next = pending[0];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Ward Round</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {user.name}
          </p>
        </div>
        {next && (
          <button onClick={() => onNavigate('ward-round', next._id)}
            className="px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 shadow-sm transition-colors">
            {done === 0 ? 'Start with' : 'Next:'} {next.name} (Bed {next.bed}) →
          </button>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-800">{done} of {patients.length} patients seen today</span>
          <span className="text-sm font-bold text-blue-600">{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {patients.length > 0 && pending.length === 0 && (
          <p className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            ✓ Ward round complete — every assigned patient has been reviewed today.
          </p>
        )}
      </div>

      {patients.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          You have no admitted patients assigned. Add a patient from the Patients screen to begin.
          <div className="mt-4">
            <button onClick={() => onNavigate('patient-list')} className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">Go to Patients</button>
          </div>
        </div>
      )}

      {/* Queue */}
      {patients.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
          {[...pending, ...patients.filter(p => hadRoundToday(p))].map((p, i) => {
            const seen = hadRoundToday(p);
            const v = latestVitals(p);
            return (
              <div key={p._id} className={`flex items-center justify-between gap-4 px-5 py-4 ${seen ? 'bg-slate-50/60' : ''}`}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${seen ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    {seen ? '✓' : i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{p.name} <span className="font-normal text-slate-400">· Bed {p.bed}</span></div>
                    <div className="text-xs text-slate-500 truncate">{p.diagnosis} · {wardNameOf(p)}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {v ? `Last vitals: BP ${v.bloodPressure}, pulse ${v.pulse}, SpO2 ${v.spo2}` : 'No vitals recorded yet'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={p.status} />
                  <button onClick={() => onNavigate('patient-profile', p._id)}
                    className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-white">Profile</button>
                  <button onClick={() => onNavigate('ward-round', p._id)}
                    className={`text-xs px-3 py-1.5 font-semibold rounded-lg ${seen ? 'border border-slate-200 text-slate-600 hover:bg-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {seen ? 'Review again' : 'Start round'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
