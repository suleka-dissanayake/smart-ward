import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { patientsApi, type ApiPatient } from '../services/api';

interface Props {
  patientId: string;
  nurseOrDoctor: string;
  onNavigate: (screen: Screen, patientId?: string) => void;
  onBack: () => void;
}

const VITALS_FIELDS = [
  { key: 'temperature',    label: 'Temperature',         placeholder: 'e.g. 37.2°C' },
  { key: 'bloodPressure',  label: 'Blood Pressure',      placeholder: 'e.g. 120/80 mmHg' },
  { key: 'pulse',          label: 'Pulse',               placeholder: 'e.g. 76 bpm' },
  { key: 'respiratoryRate',label: 'Respiratory Rate',    placeholder: 'e.g. 16/min' },
  { key: 'spo2',           label: 'SpO₂',               placeholder: 'e.g. 98%' },
] as const;

type VitalsKey = typeof VITALS_FIELDS[number]['key'];

interface FormState {
  temperature: string;
  bloodPressure: string;
  pulse: string;
  respiratoryRate: string;
  spo2: string;
  painScore: string;
}

const EMPTY: FormState = {
  temperature: '', bloodPressure: '', pulse: '',
  respiratoryRate: '', spo2: '', painScore: '0',
};

export default function RecordVitals({ patientId, onBack }: Props) {
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [form, setForm]       = useState<FormState>({ ...EMPTY });
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    patientsApi.get(patientId).then(r => setPatient(r.data)).catch(() => {});
  }, [patientId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const score = parseInt(form.painScore, 10);
    if (isNaN(score) || score < 0 || score > 10) {
      setError('Pain score must be between 0 and 10.');
      return;
    }
    setSaving(true);
    try {
      await patientsApi.addVitals(patientId, {
        temperature:    form.temperature,
        bloodPressure:  form.bloodPressure,
        pulse:          form.pulse,
        respiratoryRate: form.respiratoryRate,
        spo2:           form.spo2,
        painScore:      score,
      });
      setForm({ ...EMPTY });
      showToast('Vitals recorded successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vitals.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
          ←
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Record Vitals</h1>
          {patient && <p className="text-sm text-slate-500">{patient.name} · Bed {patient.bed}</p>}
        </div>
      </div>

      {/* Latest vitals */}
      {patient && patient.vitals.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-3">Latest Recorded Vitals</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Temperature',  value: patient.vitals[0].temperature },
              { label: 'BP',           value: patient.vitals[0].bloodPressure },
              { label: 'Pulse',        value: patient.vitals[0].pulse },
              { label: 'RR',           value: patient.vitals[0].respiratoryRate },
              { label: 'SpO₂',        value: patient.vitals[0].spo2 },
              { label: 'Pain Score',   value: `${patient.vitals[0].painScore}/10` },
            ].map(v => (
              <div key={v.label} className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{v.label}</div>
                <div className="text-sm font-bold text-slate-900">{v.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-5">New Vitals Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {VITALS_FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  {f.label}
                </label>
                <input
                  required
                  value={form[f.key as VitalsKey]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Pain Score (0–10)
              </label>
              <input
                required
                type="number"
                min={0}
                max={10}
                value={form.painScore}
                onChange={e => setForm(prev => ({ ...prev, painScore: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
              ⚠ {error}
            </div>
          )}
          {toast && (
            <div className="flex items-center gap-2 bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-100">
              ✓ {toast}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Record Vitals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
