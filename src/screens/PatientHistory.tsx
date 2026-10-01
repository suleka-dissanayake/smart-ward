import type { Screen } from '../types';
import { mockPatients } from '../data/mockData';

interface Props {
  patientId: string;
  onNavigate: (screen: Screen, patientId?: string) => void;
  onBack: () => void;
}

const typeConfig = {
  'ward-round': { label: 'Ward Round', color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🩺' },
  'vitals': { label: 'Vital Signs', color: 'bg-teal-500', bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', icon: '📊' },
  'medication': { label: 'Medication', color: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '💊' },
  'nursing-note': { label: 'Nursing Note', color: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '📝' },
  'admission': { label: 'Admission', color: 'bg-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', icon: '🏥' },
};

export default function PatientHistory({ patientId, onBack }: Props) {
  const p = mockPatients.find(pt => pt.id === patientId) ?? mockPatients[0];

  const allHistory = [
    ...p.history,
    ...p.wardRounds.map(wr => ({
      id: wr.id + '-detail',
      type: 'ward-round' as const,
      date: wr.date,
      title: 'Ward Round Notes',
      summary: `Assessment: ${wr.assessment} | Plan: ${wr.treatmentPlan}`,
      staff: wr.doctor,
    })),
    ...p.nursingNotes.map(nn => ({
      id: nn.id + '-detail',
      type: 'nursing-note' as const,
      date: nn.date,
      title: 'Nursing Note',
      summary: nn.note,
      staff: nn.nurse,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const unique = allHistory.filter((entry, idx, arr) =>
    arr.findIndex(e => e.id === entry.id) === idx
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
        ← Back to patient
      </button>

      {/* Patient header */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center">
            {p.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{p.name}</h1>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{p.id}</span>
              <span>{p.age}y · {p.gender}</span>
              <span>Bed {p.bed} · {p.ward}</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide px-1">Clinical Timeline</h2>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <div key={key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
            <span>{cfg.icon}</span> {cfg.label}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-100" />

          <div className="space-y-6">
            {unique.map((entry, i) => {
              const cfg = typeConfig[entry.type];
              return (
                <div key={entry.id + i} className="flex gap-4 relative">
                  {/* Dot */}
                  <div className={`w-10 h-10 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center flex-shrink-0 z-10 text-sm`}>
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">{entry.title}</h3>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-500">{entry.date.split(' ')[0]}</p>
                        <p className="text-[11px] text-slate-400">{entry.date.split(' ')[1] ?? ''}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed">{entry.summary}</p>
                    <p className="text-[11px] text-slate-400 mt-2 font-medium">Recorded by {entry.staff}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
