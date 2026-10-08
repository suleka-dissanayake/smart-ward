import type { ApiPatient, ApiUser, ApiVitals } from '../services/api';
import type { HistoryEntry } from '../types';

type Named = ApiUser | { name: string } | string | null | undefined;

/** API fields are either a populated object ({ name }) or a raw id string. */
export const nameOf = (x: Named): string =>
  x && typeof x === 'object' ? x.name : x ? String(x) : '—';

export const wardNameOf = (p: ApiPatient): string => nameOf(p.ward as Named);

const byDateDesc = <T,>(get: (x: T) => string) => (a: T, b: T) =>
  new Date(get(b)).getTime() - new Date(get(a)).getTime();

export const fmtDate = (iso?: string): string =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtTime = (iso?: string): string =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';

export const fmtDateTime = (iso?: string): string => (iso ? `${fmtDate(iso)} ${fmtTime(iso)}` : '—');

/** Short, human-friendly reference derived from the MongoDB id. */
export const shortId = (id: string): string => `#${id.slice(-6).toUpperCase()}`;

/** Newest first, regardless of the order the database returned them in. */
export const sortedVitals = (p: ApiPatient): ApiVitals[] =>
  [...(p.vitals ?? [])].sort(byDateDesc(v => v.recordedAt));

export const latestVitals = (p: ApiPatient): ApiVitals | null => sortedVitals(p)[0] ?? null;

export const latestWardRound = (p: ApiPatient) =>
  [...(p.wardRounds ?? [])].sort(byDateDesc(r => r.date))[0];

/** Combine every clinical event for a patient into one newest-first timeline. */
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
