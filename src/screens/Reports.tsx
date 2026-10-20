import { useState, useEffect } from 'react';
import { patientsApi, wardsApi, usersApi, type ApiPatient, type ApiWard, type ApiUser } from '../services/api';
import { fmtDate, nameOf, wardNameOf } from '../utils/patient';
import { Spinner, ErrorState } from '../components/LoadingState';

const statusColor: Record<string, string> = { Stable: 'bg-green-500', Attention: 'bg-amber-500', Critical: 'bg-red-500', Discharged: 'bg-slate-400' };

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function toCsv(rows: string[][]): string {
  return rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
}

export default function Reports() {
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [wards, setWards]       = useState<ApiWard[]>([]);
  const [users, setUsers]       = useState<ApiUser[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([patientsApi.list(), wardsApi.list(), usersApi.list()])
      .then(([p, w, u]) => { setPatients(p.data); setWards(w.data); setUsers(u.data); })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load report data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Building report..." />;
  if (error) return <ErrorState message={error} />;

  const admitted = patients.filter(p => p.status !== 'Discharged');
  const totalBeds = wards.reduce((n, w) => n + w.totalBeds, 0);
  const occupied = wards.reduce((n, w) => n + w.occupiedBeds, 0);
  const occupancy = totalBeds ? Math.round((occupied / totalBeds) * 100) : 0;

  const byStatus = ['Stable', 'Attention', 'Critical', 'Discharged'].map(s => ({ s, n: patients.filter(p => p.status === s).length }));

  // Records created per day over the last 7 days (counted from the patients' embedded records).
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const activity = days.map(d => {
    const k = dayKey(d);
    const on = (iso?: string) => !!iso && dayKey(new Date(iso)) === k;
    return {
      label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
      vitals: patients.reduce((n, p) => n + p.vitals.filter(v => on(v.recordedAt)).length, 0),
      rounds: patients.reduce((n, p) => n + p.wardRounds.filter(r => on(r.date)).length, 0),
      notes:  patients.reduce((n, p) => n + p.nursingNotes.filter(x => on(x.date)).length, 0),
      doses:  patients.reduce((n, p) => n + p.medications.reduce((m, med) => m + med.scheduledTimes.filter(t => on(t.administeredAt)).length, 0), 0),
    };
  });

  const staff = users
    .filter(u => u.role !== 'admin')
    .map(u => ({
      user: u,
      load: admitted.filter(p => (u.role === 'doctor' ? p.assignedDoctor : p.assignedNurse) &&
        (typeof (u.role === 'doctor' ? p.assignedDoctor : p.assignedNurse) === 'object'
          ? ((u.role === 'doctor' ? p.assignedDoctor : p.assignedNurse) as ApiUser)._id
          : (u.role === 'doctor' ? p.assignedDoctor : p.assignedNurse)) === u._id).length,
    }))
    .sort((a, b) => b.load - a.load);

  const exportCsv = () => {
    const rows = [
      ['Name', 'Age', 'Gender', 'Ward', 'Bed', 'Status', 'Admitted', 'Diagnosis', 'Doctor', 'Nurse'],
      ...patients.map(p => [p.name, String(p.age), p.gender, wardNameOf(p), p.status === 'Discharged' ? '' : p.bed, p.status, fmtDate(p.admissionDate), p.diagnosis, nameOf(p.assignedDoctor), nameOf(p.assignedNurse)]),
    ];
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartward-patients-${dayKey(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const card = 'bg-white rounded-xl border border-slate-100 shadow-sm';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generated {new Date().toLocaleString('en-GB')}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={exportCsv} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">⬇ Export patients (CSV)</button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50">🖨 Print</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Admitted patients', value: admitted.length, sub: `${patients.length - admitted.length} discharged on record` },
          { label: 'Bed occupancy', value: `${occupancy}%`, sub: `${occupied} of ${totalBeds} beds` },
          { label: 'Available beds', value: totalBeds - occupied, sub: `across ${wards.length} wards` },
          { label: 'Clinical staff', value: users.filter(u => u.role !== 'admin' && u.status === 'Active').length, sub: 'active doctors & nurses' },
        ].map(c => (
          <div key={c.label} className={`${card} p-5`}>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</div>
            <div className="text-3xl font-bold text-slate-900 mt-2">{c.value}</div>
            <div className="text-xs text-slate-400 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className={`${card} p-5`}>
          <h2 className="text-sm font-bold text-slate-900 mb-4">Patients by condition</h2>
          <div className="space-y-3">
            {byStatus.map(({ s, n }) => (
              <div key={s}>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700">{s}</span><span className="text-slate-500">{n}</span></div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${statusColor[s]}`} style={{ width: `${patients.length ? (n / patients.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h2 className="text-sm font-bold text-slate-900 mb-4">Ward occupancy</h2>
          <div className="space-y-3">
            {wards.length === 0 && <p className="text-xs text-slate-400">No wards configured.</p>}
            {wards.map(w => {
              const pct = w.totalBeds ? Math.round((w.occupiedBeds / w.totalBeds) * 100) : 0;
              return (
                <div key={w._id}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700">{w.name}</span><span className="text-slate-500">{w.occupiedBeds}/{w.totalBeds} · {pct}%</span></div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-900">Clinical activity — last 7 days</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {['Day', 'Vital signs', 'Ward rounds', 'Doses given', 'Nursing notes'].map(h => <th key={h} className="text-left px-5 py-2.5">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {activity.map(a => (
              <tr key={a.label}><td className="px-5 py-2.5 font-medium text-slate-700">{a.label}</td>
                <td className="px-5 py-2.5 text-slate-600">{a.vitals}</td><td className="px-5 py-2.5 text-slate-600">{a.rounds}</td>
                <td className="px-5 py-2.5 text-slate-600">{a.doses}</td><td className="px-5 py-2.5 text-slate-600">{a.notes}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`${card} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-bold text-slate-900">Staff workload (admitted patients)</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            {['Name', 'Role', 'Department', 'Status', 'Patients'].map(h => <th key={h} className="text-left px-5 py-2.5">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {staff.map(({ user, load }) => (
              <tr key={user._id}><td className="px-5 py-2.5 font-medium text-slate-700">{user.name}</td>
                <td className="px-5 py-2.5 text-slate-600 capitalize">{user.role}</td><td className="px-5 py-2.5 text-slate-600">{user.department}</td>
                <td className="px-5 py-2.5 text-slate-600">{user.status}</td><td className="px-5 py-2.5 font-semibold text-slate-800">{load}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
