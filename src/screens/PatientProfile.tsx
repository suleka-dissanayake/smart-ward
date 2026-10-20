import { useState } from 'react';
import type { Screen, UserRole } from '../types';
import { usePatient } from '../hooks/usePatient';
import { buildHistory, fmtDate, fmtDateTime, latestVitals, latestWardRound, nameOf, shortId, wardNameOf } from '../utils/patient';
import StatusBadge from '../components/StatusBadge';
import PatientFormModal from '../components/PatientFormModal';
import { RemovePatientDialog, DischargeDialog } from '../components/PatientActions';
import { Spinner, ErrorState } from '../components/LoadingState';

interface Props {
  patientId: string;
  role: UserRole;
  onNavigate: (screen: Screen, patientId?: string) => void;
  onBack: () => void;
}

type Tab = 'overview' | 'observations' | 'medications' | 'history';

export default function PatientProfile({ patientId, role, onNavigate, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const { patient: p, loading, error, reload } = usePatient(patientId);
  const [showEdit, setShowEdit]           = useState(false);
  const [showDischarge, setShowDischarge] = useState(false);
  const [showRemove, setShowRemove]       = useState(false);
  const [notice, setNotice]               = useState('');
  const canManage = role === 'admin' || role === 'doctor'; // edit + discharge; everyone may remove

  const done = (message: string) => {
    setShowEdit(false); setShowDischarge(false);
    setNotice(message);
    setTimeout(() => setNotice(''), 5000);
    void reload();
  };

  if (loading) return <Spinner label="Loading patient..." />;
  if (error || !p) return <ErrorState message={error || 'Patient not found'} onBack={onBack} />;

  const v = latestVitals(p);
  const lastRound = latestWardRound(p);
  const history = buildHistory(p);
  const dash = '—';

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'observations', label: 'Observations' },
    { id: 'medications', label: 'Medications' },
    { id: 'history', label: 'History' },
  ];

  const VitalRow = ({ label, value, normal }: { label: string; value: string; normal?: boolean }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-sm font-semibold ${normal === false ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
        ← Back to list
      </button>

      {notice && <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm bg-green-50 text-green-700 border-green-200">✓ {notice}</div>}

      {/* Header card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 font-bold text-lg flex items-center justify-center">
              {p.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{p.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{shortId(p._id)}</span>
                <span>{p.age} years</span>
                <span>{p.gender}</span>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>🏥 {wardNameOf(p)}</span>
                <span>🛏 Bed {p.bed}</span>
                <span>📅 Admitted {fmtDate(p.admissionDate)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={p.status} size="md" />
            <div className="flex gap-2">
              {(role === 'doctor' || role === 'nurse') && (
                <button
                  onClick={() => onNavigate('record-vitals', p._id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Record Vitals
                </button>
              )}
              {role === 'doctor' && (
                <button
                  onClick={() => onNavigate('ward-round', p._id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ward Round
                </button>
              )}
              {(role === 'nurse' || role === 'doctor') && (
                <button
                  onClick={() => onNavigate('medications', p._id)}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Medications
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {canManage && (
                <button onClick={() => setShowEdit(true)} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">Edit</button>
              )}
              {canManage && p.status !== 'Discharged' && (
                <button onClick={() => setShowDischarge(true)} className="px-3 py-1.5 text-xs font-semibold border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors">Discharge</button>
              )}
              <button onClick={() => setShowRemove(true)} className="px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">Remove</button>
            </div>
          </div>
        </div>

        {p.allergies.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">⚠ Allergies:</span>
            {p.allergies.map(a => (
              <span key={a} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium">{a}</span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-100 shadow-sm p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              tab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Current Condition</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{p.diagnosis}</p>
            {lastRound && (
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs font-semibold text-slate-500 mb-1">Last Assessment</p>
                <p className="text-xs text-slate-600 leading-relaxed">{lastRound.assessment}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Latest Vital Signs</h3>
            <VitalRow label="Blood Pressure" value={v?.bloodPressure ?? dash} />
            <VitalRow label="Temperature" value={v?.temperature ?? dash} />
            <VitalRow label="Pulse" value={v?.pulse ?? dash} />
            <VitalRow label="SpO2" value={v?.spo2 ?? dash} normal={v ? parseInt(v.spo2) >= 95 : undefined} />
            <VitalRow label="Pain Score" value={v ? `${v.painScore}/10` : dash} />
            <p className="text-[11px] text-slate-400 mt-3">{v ? `Recorded ${fmtDateTime(v.recordedAt)} by ${nameOf(v.recordedBy)}` : 'No vital signs recorded yet'}</p>
          </div>

          <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Current Medications</h3>
            <div className="grid grid-cols-3 gap-3">
              {p.medications.map(m => (
                <div key={m._id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{m.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{m.dose} · {m.route}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.frequency}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'observations' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900">Vital Signs Record</h3>
            {(role === 'nurse' || role === 'doctor') && (
              <button
                onClick={() => onNavigate('record-vitals', p._id)}
                className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                + Record New
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 rounded-xl mb-4">
            {[
              { label: 'Blood Pressure', value: v?.bloodPressure ?? dash },
              { label: 'Temperature', value: v?.temperature ?? dash },
              { label: 'Pulse', value: v?.pulse ?? dash },
              { label: 'Respiratory Rate', value: v?.respiratoryRate ?? dash },
              { label: 'SpO2', value: v?.spo2 ?? dash },
              { label: 'Pain Score', value: v ? `${v.painScore}/10` : dash },
            ].map(v => (
              <div key={v.label} className="text-center">
                <div className="text-xl font-bold text-blue-800">{v.value}</div>
                <div className="text-[11px] text-blue-600 mt-0.5">{v.label}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center">{v ? `Last recorded ${fmtDateTime(v.recordedAt)} by ${nameOf(v.recordedBy)}` : 'No vital signs recorded yet'}</p>
        </div>
      )}

      {tab === 'medications' && (
        <div className="space-y-3">
          {p.medications.map(m => (
            <div key={m._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{m.name}</h4>
                  <div className="flex gap-3 mt-1 text-xs text-slate-500">
                    <span>{m.dose}</span>
                    <span>·</span>
                    <span>{m.route}</span>
                    <span>·</span>
                    <span>{m.frequency}</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{fmtDate(m.startDate)} → {fmtDate(m.endDate)}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {m.scheduledTimes.map((t, i) => (
                  <div key={i} className={`px-3 py-1.5 rounded-lg text-xs border ${
                    t.status === 'Administered'
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <span className="font-semibold">{t.time}</span>
                    <span className="ml-2">{t.status}</span>
                    {t.administeredBy && <span className="text-[10px] block opacity-70">{nameOf(t.administeredBy)}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900">Patient History</h3>
            <button onClick={() => onNavigate('patient-history', p._id)} className="text-xs text-blue-600 font-semibold hover:underline">
              Full Timeline →
            </button>
          </div>
          <div className="space-y-0">
            {history.slice(0, 6).map((h, i) => (
              <div key={h.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                    h.type === 'ward-round' ? 'bg-blue-500'
                    : h.type === 'vitals' ? 'bg-teal-500'
                    : h.type === 'medication' ? 'bg-purple-500'
                    : h.type === 'nursing-note' ? 'bg-orange-500'
                    : 'bg-slate-400'
                  }`} />
                  {i < Math.min(history.length, 6) - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                </div>
                <div className="pb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{h.title}</span>
                    <span className="text-[10px] text-slate-400">{fmtDateTime(h.date)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{h.summary}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">by {h.staff}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEdit && <PatientFormModal patient={p} onSaved={done} onClose={() => setShowEdit(false)} />}
      {showDischarge && <DischargeDialog patient={p} onDone={done} onClose={() => setShowDischarge(false)} />}
      {showRemove && <RemovePatientDialog patient={p} onDone={() => onNavigate('patient-list')} onClose={() => setShowRemove(false)} />}
    </div>
  );
}
