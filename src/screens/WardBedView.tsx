import { useState } from 'react';
import type { Screen } from '../types';
import { mockWards, getBedLayout } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';

interface Props {
  onNavigate: (screen: Screen, patientId?: string) => void;
}

export default function WardBedView({ onNavigate }: Props) {
  const [selectedWard, setSelectedWard] = useState('All Wards');

  const wardOptions = ['All Wards', ...mockWards.map(w => w.name)];
  const beds = getBedLayout(selectedWard);

  const prefix = selectedWard === 'All Wards' ? '' : selectedWard.split(' ')[0];
  const filtered = selectedWard === 'All Wards' ? beds : beds.filter(b => b.bed.startsWith(prefix));

  const ward = mockWards.find(w => w.name === selectedWard);
  const occupied = filtered.filter(b => b.patient).length;
  const available = filtered.filter(b => !b.patient).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Ward & Bed View</h1>
        <p className="text-sm text-slate-500 mt-0.5">Visual overview of ward occupancy</p>
      </div>

      {/* Ward selector */}
      <div className="flex gap-2 flex-wrap">
        {wardOptions.map(w => (
          <button
            key={w}
            onClick={() => setSelectedWard(w)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              selectedWard === w
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Beds', value: filtered.length, color: 'bg-blue-600' },
          { label: 'Occupied', value: occupied, color: 'bg-amber-500' },
          { label: 'Available', value: available, color: 'bg-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 ${s.color} rounded-xl`} />
            <div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Legend:</span>
        {[
          { color: 'bg-green-100 border-green-200', label: 'Stable' },
          { color: 'bg-amber-100 border-amber-200', label: 'Attention' },
          { color: 'bg-red-100 border-red-200', label: 'Critical' },
          { color: 'bg-slate-100 border-slate-200', label: 'Available' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded border ${l.color}`} />
            <span className="text-xs text-slate-600">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Bed grid */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map(b => {
            const statusColor = b.patient
              ? b.status === 'Stable' ? 'bg-green-50 border-green-200 hover:border-green-400'
              : b.status === 'Attention' ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
              : 'bg-red-50 border-red-200 hover:border-red-400'
              : 'bg-slate-50 border-slate-200 hover:border-slate-300';

            return (
              <button
                key={b.bed}
                onClick={() => b.patient && onNavigate('patient-profile', b.patient.id)}
                disabled={!b.patient}
                className={`rounded-xl border-2 p-3 text-left transition-all ${statusColor} ${b.patient ? 'cursor-pointer' : 'cursor-default opacity-70'}`}
              >
                <div className="font-mono text-[10px] font-bold text-slate-500 mb-1.5">{b.bed}</div>
                {b.patient ? (
                  <>
                    <div className="text-[11px] font-semibold text-slate-900 leading-tight truncate">
                      {b.patient.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                      {b.patient.name.split(' ').slice(1).join(' ')}
                    </div>
                    <div className={`mt-2 text-[9px] font-bold uppercase tracking-wide ${
                      b.status === 'Stable' ? 'text-green-700'
                      : b.status === 'Attention' ? 'text-amber-700'
                      : 'text-red-700'
                    }`}>
                      {b.status}
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-slate-400 mt-1">Available</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
