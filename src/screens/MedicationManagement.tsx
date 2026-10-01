import { useState } from 'react';
import type { Screen } from '../types';
import { mockPatients } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';

interface Props {
  patientId: string;
  nurseName: string;
  onNavigate: (screen: Screen, patientId?: string) => void;
  onBack: () => void;
}

export default function MedicationManagement({ patientId, nurseName, onBack }: Props) {
  const p = mockPatients.find(pt => pt.id === patientId) ?? mockPatients[0];
  const [administered, setAdministered] = useState<Set<string>>(new Set());

  const mark = (medId: string, time: string) => {
    setAdministered(s => new Set([...s, `${medId}-${time}`]));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
        ← Back
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Medication Administration</h1>
        <p className="text-sm text-slate-500 mt-0.5">{p.name} · Bed {p.bed}</p>
      </div>

      {/* Patient strip */}
      <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-sm">
          {p.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
        </div>
        <div>
          <div className="font-semibold">{p.name}</div>
          <div className="text-blue-200 text-xs">{p.id} · {p.age}y {p.gender} · {p.diagnosis}</div>
        </div>
        {p.allergies.length > 0 && (
          <div className="ml-auto">
            <div className="text-[10px] text-red-200 font-semibold">⚠ ALLERGIES</div>
            <div className="text-xs text-red-100">{p.allergies.join(', ')}</div>
          </div>
        )}
      </div>

      {/* Medications */}
      <div className="space-y-4">
        {p.medications.map(med => (
          <div key={med.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{med.name}</h3>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{med.dose}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{med.route}</span>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{med.frequency}</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 text-right">
                <div>{med.startDate}</div>
                <div>→ {med.endDate}</div>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Scheduled Doses</p>
              <div className="space-y-2">
                {med.scheduledTimes.map((dose, i) => {
                  const key = `${med.id}-${dose.time}`;
                  const isAdminByState = administered.has(key);
                  const isAdministered = dose.status === 'Administered' || isAdminByState;

                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isAdministered ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-slate-700">{dose.time}</span>
                        <StatusBadge status={isAdministered ? 'Administered' : 'Pending'} />
                        {isAdministered && (
                          <span className="text-xs text-slate-500">
                            {isAdminByState ? `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${nurseName}` : `${dose.administeredAt} · ${dose.administeredBy}`}
                          </span>
                        )}
                      </div>
                      {!isAdministered && (
                        <button
                          onClick={() => mark(med.id, dose.time)}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark Administered
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
