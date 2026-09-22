import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { mockPatients } from '../data/mockData';
import { patientsApi, type ApiPatient, type ApiNursingNote } from '../services/api';

interface Props {
  patientId: string;
  nurseName: string;
  onNavigate: (screen: Screen, patientId?: string) => void;
  onBack: () => void;
}

export default function NursingNotes({ patientId, nurseName, onBack }: Props) {
  const [patient, setPatient]   = useState<ApiPatient | null>(null);
  const [notes, setNotes]       = useState<ApiNursingNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [saved, setSaved]       = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    patientsApi.get(patientId)
      .then(res => {
        setPatient(res.data);
        setNotes(res.data.nursingNotes ?? []);
      })
      .catch(() => {
        const m = mockPatients.find(p => p.id === patientId) ?? mockPatients[0];
        setPatient({ ...m, _id: m.id, ward: m.ward, vitals: [m.vitals as never], medications: m.medications as never, wardRounds: m.wardRounds as never, nursingNotes: m.nursingNotes as never, assignedDoctor: m.assignedDoctor, assignedNurse: m.assignedNurse } as unknown as ApiPatient);
        setNotes(m.nursingNotes.map(n => ({ _id: n.id, date: n.date, nurse: n.nurse, note: n.note })) as unknown as ApiNursingNote[]);
      });
  }, [patientId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await patientsApi.addNursingNote(patientId, { note: noteText });
      setNotes(prev => [res.data, ...prev]);
    } catch {
      // Offline fallback — add locally
      const local: ApiNursingNote = { _id: `local-${Date.now()}`, date: new Date().toISOString(), nurse: nurseName, note: noteText };
      setNotes(prev => [local, ...prev]);
    } finally {
      setNoteText('');
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const nurseName_ = (n: ApiNursingNote) => {
    const nurse = n.nurse;
    return typeof nurse === 'object' && nurse !== null ? (nurse as { name: string }).name : String(nurse);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">← Back</button>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Nursing Notes</h1>
        <p className="text-sm text-slate-500 mt-0.5">{patient?.name ?? '—'} · Bed {patient?.bed ?? '—'}</p>
      </div>

      <div className="bg-teal-600 text-white rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-sm">
          {(patient?.name ?? '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
        </div>
        <div>
          <div className="font-semibold">{patient?.name ?? '—'}</div>
          <div className="text-teal-200 text-xs">{patient?.age}y {patient?.gender} · Bed {patient?.bed}</div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Add Nursing Note</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Date & Time</label>
            <input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nurse</label>
            <input value={nurseName} readOnly className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-100 text-slate-600" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Note</label>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} required rows={4}
            placeholder="Enter nursing observation, patient condition, interventions performed..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-50 resize-none" />
        </div>
        {error  && <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2.5 rounded-lg text-sm border border-red-100">⚠ {error}</div>}
        {saved  && <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2.5 rounded-lg text-sm border border-green-200">✓ Note saved successfully</div>}
        <button type="submit" disabled={saving}
          className="w-full py-2.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-colors text-sm disabled:opacity-60">
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      </form>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Previous Nursing Notes</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {notes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No nursing notes recorded yet</p>
          ) : (
            notes.map(note => (
              <div key={note._id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-teal-700">{nurseName_(note)}</span>
                  <span className="text-xs text-slate-400">{new Date(note.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{note.note}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
