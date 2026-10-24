export const nameOf = (x) => (x && typeof x === 'object' ? x.name : x ? String(x) : '—');
export const idOf = (x) => (x && typeof x === 'object' ? x._id : x ? String(x) : '');
export const wardNameOf = (p) => nameOf(p.ward);
const byDateDesc = (get) => (a, b) => new Date(get(b)).getTime() - new Date(get(a)).getTime();

export const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');
export const fmtDateTime = (iso) => (iso ? `${fmtDate(iso)} ${fmtTime(iso)}` : '—');
export const shortId = (id) => `#${id.slice(-6).toUpperCase()}`;
export const sortedVitals = (p) => [...(p.vitals ?? [])].sort(byDateDesc((v) => v.recordedAt));
export const latestVitals = (p) => sortedVitals(p)[0] ?? null;
export const latestWardRound = (p) => [...(p.wardRounds ?? [])].sort(byDateDesc((r) => r.date))[0];

/** Combine every clinical event for a patient into one newest-first timeline. */
export function buildHistory(p) {
  const entries = [
    {
      id: `admission-${p._id}`,
      type: 'admission',
      date: p.admissionDate,
      title: 'Patient Admitted',
      summary: `Admitted to ${wardNameOf(p)}, bed ${p.bed}. Diagnosis: ${p.diagnosis}`,
      staff: nameOf(p.assignedDoctor),
    },
  ];

  (p.wardRounds ?? []).forEach((r) =>
    entries.push({
      id: `round-${r._id}`,
      type: 'ward-round',
      date: r.date,
      title: 'Ward Round',
      summary: `Assessment: ${r.assessment} | Plan: ${r.treatmentPlan}`,
      staff: nameOf(r.doctor),
    }),
  );

  (p.vitals ?? []).forEach((v) =>
    entries.push({
      id: `vitals-${v._id}`,
      type: 'vitals',
      date: v.recordedAt,
      title: 'Vital Signs Recorded',
      summary: `BP ${v.bloodPressure} · Temp ${v.temperature} · Pulse ${v.pulse} · SpO2 ${v.spo2} · Pain ${v.painScore}/10`,
      staff: nameOf(v.recordedBy),
    }),
  );

  (p.medications ?? []).forEach((m) =>
    m.scheduledTimes.forEach((d) => {
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

  (p.nursingNotes ?? []).forEach((n) =>
    entries.push({
      id: `note-${n._id}`,
      type: 'nursing-note',
      date: n.date,
      title: 'Nursing Note',
      summary: n.note,
      staff: nameOf(n.nurse),
    }),
  );

  return entries.sort(byDateDesc((e) => e.date));
}

// ---------- dashboard / ward-round helpers ----------

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
};

export const isToday = (iso) => !!iso && new Date(iso).toDateString() === new Date().toDateString();
export const hadRoundToday = (p) => (p.wardRounds ?? []).some((r) => isToday(r.date));

const severity = { Critical: 0, Attention: 1, Stable: 2, Discharged: 3 };
export const bySeverity = (a, b) =>
  (severity[a.status] ?? 9) - (severity[b.status] ?? 9) || a.bed.localeCompare(b.bed, undefined, { numeric: true });

export const vitalsDue = (p, hours = 6) => {
  const v = latestVitals(p);
  return !v || Date.now() - new Date(v.recordedAt).getTime() > hours * 3_600_000;
};

export const pendingDoses = (p) =>
  (p.medications ?? []).reduce((n, m) => n + m.scheduledTimes.filter((t) => t.status === 'Pending').length, 0);

export const activePatients = (list) => list.filter((p) => p.status !== 'Discharged');
