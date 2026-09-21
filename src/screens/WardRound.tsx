import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { mockPatients } from '../data/mockData';
import { patientsApi, type ApiPatient } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface Props {
  patientId: string;
  doctorName: string;
  onNavigate: (screen: Screen, patientId?: string) => void;
  onBack: () => void;
}

export default function WardRound({ patientId, doctorName, onBack, onNavigate }: Props) {
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({ assessment: '', clinicalNotes: '', treatmentPlan: '', nextReview: '' });

  useEffect(() => {
    patientsApi.get(patientId)
      .then(res => setPatient(res.data))
      .catch(() => {
        const m = mockPatients.find(p => p.id === patientId) ?? mockPatients[0];
        setPatient({ ...m, _id: m.id, ward: m.ward, vitals: [m.vitals as never], medications: m.medications as never, wardRounds: m.wardRounds as never, nursingNotes: m.nursingNotes as never, assignedDoctor: m.assignedDoctor, assignedNurse: m.assignedNurse } as unknown as ApiPatient);
      });
  }, [patientId]);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await patientsApi.addWardRound(patientId, {
        assessment: form.assessment,
        clinicalNotes: form.clinicalNotes,
        treatmentPlan: form.treatmentPlan,
        nextReview: form.nextReview,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ward round');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-10 text-center max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ward Round Saved</h2>
          <p className="text-sm text-slate-500 mb-2">Ward round notes for <strong>{patient?.name}</strong> have been recorded.</p>
          <p className="text-xs text-slate-400 mb-6">Next review: {form.nextReview || 'Not specified'}</p>
          <div className="space-y-2">
            <button onClick={() => onNavigate('patient-history', patient?._id ?? patientId)} className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              View Patient History
            </button>
            <button onClick={() => onNavigate('patient-profile', patient?._id ?? patientId)} className="w-full py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
              Back to Patient
            </button>
          </div>
        </div>
      </div>
    );
  }

  const p = patient;
  const last = p?.wardRounds?.[0] ?? null;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
        ← Back
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Doctor Ward Round</h1>
          <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">⚠ {error}</div>}

      {/* Patient info */}
      <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-sm">
          {(p?.name ?? '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{p?.name ?? '—'}</div>
          <div className="text-blue-200 text-xs">{p?.age}y {p?.gender} · Bed {p?.bed}</div>
        </div>
        {p && <StatusBadge status={p.status} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Vitals summary */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Latest Vital Signs</h3>
          {p?.vitals?.[0] ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {[
                ['BP',   p.vitals[0].bloodPressure],
                ['Temp', p.vitals[0].temperature],
                ['Pulse',p.vitals[0].pulse],
                ['RR',   p.vitals[0].respiratoryRate],
                ['SpO2', p.vitals[0].spo2],
                ['Pain', `${p.vitals[0].painScore}/10`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500 text-xs">{label}</span>
                  <span className="font-semibold text-slate-900 text-xs">{val}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-slate-400">No vitals recorded yet</p>}
        </div>

        {/* Current meds */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Current Medications</h3>
          <div className="space-y-2">
            {(p?.medications ?? []).map((m, i) => (
              <div key={m._id ?? i} className="text-xs">
                <span className="font-semibold text-slate-900">{m.name}</span>
                <span className="text-slate-500 ml-1">{m.dose} · {m.route} · {m.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Previous notes */}
      {last && (
        <div className="bg-slate-100 rounded-xl p-5 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Previous Ward Round — {new Date(last.date).toLocaleDateString('en-GB')}</p>
          <p className="text-xs text-slate-700 mb-2"><strong>Assessment:</strong> {last.assessment}</p>
          <p className="text-xs text-slate-700"><strong>Plan:</strong> {last.treatmentPlan}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">New Ward Round Entry</h2>

          <Textarea label="Doctor's Assessment" value={form.assessment} onChange={v => set('assessment', v)} placeholder="Overall assessment of the patient's current condition..." required />
          <Textarea label="Clinical Notes" value={form.clinicalNotes} onChange={v => set('clinicalNotes', v)} placeholder="Detailed clinical observations, examination findings..." required />
          <Textarea label="Treatment Plan" value={form.treatmentPlan} onChange={v => set('treatmentPlan', v)} placeholder="Medications, investigations, management plan..." required />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Next Review Date</label>
              <input
                type="date"
                value={form.nextReview}
                onChange={e => set('nextReview', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Doctor</label>
              <input
                value={doctorName}
                readOnly
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600"
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm shadow-sm disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Ward Round'}
        </button>
      </form>
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        required={required}
        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
      />
    </div>
  );
}
