import type { ApiPatient, ApiUser, ApiVitals } from '../services/api';
import type { HistoryEntry } from '../types';

type Named = ApiUser | { name: string } | string | null | undefined;

export const nameOf = (x: Named): string =>
  x && typeof x === 'object' ? x.name : x ? String(x) : '—';

export const idOf = (x: { _id: string } | string | null | undefined): string =>
  x && typeof x === 'object' ? x._id : x ? String(x) : '';

export const wardNameOf = (p: ApiPatient): string => nameOf(p.ward as Named);

const byDateDesc = <T,>(get: (x: T) => string) => (a: T, b: T) =>
  new Date(get(b)).getTime() - new Date(get(a)).getTime();

export const fmtDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtTime = (iso?: string): string =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

export const fmtDateTime = (iso?: string): string => (iso ? `${fmtDate(iso)} ${fmtTime(iso)}` : '—');

export const shortId = (id: string): string => `#${id.slice(-6).toUpperCase()}`;

export const sortedVitals = (p: ApiPatient): ApiVitals[] =>
  [...(p.vitals ?? [])].sort(byDateDesc(v => v.recordedAt));

export const latestVitals = (p: ApiPatient): ApiVitals | null => sortedVitals(p)[0] ?? null;

export const latestWardRound = (p: ApiPatient) =>
  [...(p.wardRounds ?? [])].sort(byDateDesc(r => r.date))[0];

export function buildHistory(p: ApiPatient): HistoryEntry[] {
  const entries: HistoryEntry[] = [
    {
      id: `admission-${p._id}`,
      type: 'admission',
      date: p.admissionDate,
      title: 'Patient Admitted',
      summary: `Admitted to ${wardNameOf(p)}, bed ${p.bed}. Diagnosis: ${p.diagnosis}`,
      staff: nameOf(p.assignedDoctor),
    },
  ];

  (p.wardRounds ?? []).forEach(r =>
    entries.push({
      id: `round-${r._id}`,
      type: 'ward-round',
      date: r.date,
      title: 'Ward Round',
      summary: `Assessment: ${r.assessment} | Plan: ${r.treatmentPlan}`,
      staff: nameOf(r.doctor),
    }),
  );

  (p.vitals ?? []).forEach(v =>
    entries.push({
      id: `vitals-${v._id}`,
      type: 'vitals',
      date: v.recordedAt,
      title: 'Vital Signs Recorded',
      summary: `BP ${v.bloodPressure} · Temp ${v.temperature} · Pulse ${v.pulse} · SpO2 ${v.spo2} · Pain ${v.painScore}/10`,
      staff: nameOf(v.recordedBy),
    }),
  );

  (p.medications ?? []).forEach(m =>
    m.scheduledTimes.forEach(d => {
      if (d.status !== 'Administered' || !d.administeredAt) return;
      entries.push({
        id: `dose-${d._id}`,
        type: 'medication',
        date: d.administeredAt,
        title: `${m.name} administered`,
        summary: `${m.dose} · ${m.route} (scheduled ${d.time})`,
        staff: nameOf(d.administeredBy),
      });
    }),
  );

  (p.nursingNotes ?? []).forEach(n =>
    entries.push({
      id: `note-${n._id}`,
      type: 'nursing-note',
      date: n.date,
      title: 'Nursing Note',
      summary: n.note,
      staff: nameOf(n.nurse),
    }),
  );

  return entries.sort(byDateDesc(e => e.date));
}

export const greeting = (): string => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
};

export const isToday = (iso?: string): boolean => !!iso && new Date(iso).toDateString() === new Date().toDateString();

export const hadRoundToday = (p: ApiPatient): boolean => (p.wardRounds ?? []).some(r => isToday(r.date));

const severity: Record<string, number> = { Critical: 0, Attention: 1, Stable: 2, Discharged: 3 };

export const bySeverity = (a: ApiPatient, b: ApiPatient): number =>
  (severity[a.status] ?? 9) - (severity[b.status] ?? 9) || a.bed.localeCompare(b.bed, undefined, { numeric: true });

export const vitalsDue = (p: ApiPatient, hours = 6): boolean => {
  const v = latestVitals(p);
  return !v || Date.now() - new Date(v.recordedAt).getTime() > hours * 3_600_000;
};

export const pendingDoses = (p: ApiPatient): number =>
  (p.medications ?? []).reduce((n, m) => n + m.scheduledTimes.filter(t => t.status === 'Pending').length, 0);

export const activePatients = (list: ApiPatient[]): ApiPatient[] => list.filter(p => p.status !== 'Discharged');
