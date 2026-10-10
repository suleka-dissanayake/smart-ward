import { useEffect, useState } from 'react';
import { patientsApi, wardsApi, usersApi, type ApiPatient, type ApiWard, type ApiUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { idOf } from '../utils/patient';

interface Props {
  patient?: ApiPatient;
  onSaved: (message: string) => void;
  onClose: () => void;
}

type Status = 'Stable' | 'Attention' | 'Critical' | 'Discharged';

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-400';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';

export default function PatientFormModal({ patient, onSaved, onClose }: Props) {
  const { user } = useAuth();
  const editing = !!patient;

  const [wards, setWards]     = useState<ApiWard[]>([]);
  const [doctors, setDoctors] = useState<ApiUser[]>([]);
  const [nurses, setNurses]   = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const [form, setForm] = useState({
    name:           patient?.name ?? '',
    age:            patient ? String(patient.age) : '',
    gender:         patient?.gender ?? 'Male',
    admissionDate:  patient ? patient.admissionDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    diagnosis:      patient?.diagnosis ?? '',
    allergies:      patient?.allergies.join(', ') ?? '',
    ward:           patient ? idOf(patient.ward) : '',
    bed:            patient?.bed ?? '',
    assignedDoctor: patient ? idOf(patient.assignedDoctor) : '',
    assignedNurse:  patient ? idOf(patient.assignedNurse) : '',
    status:         (patient?.status ?? 'Stable') as Status,
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const freeBeds = (wardId: string) =>
    (wards.find(w => w._id === wardId)?.beds ?? []).filter(b =>
      !b.isOccupied ||
      (editing && patient!.status !== 'Discharged' && idOf(patient!.ward) === wardId && b.bedNumber === patient!.bed));

  useEffect(() => {
    Promise.all([wardsApi.list(), usersApi.doctors(), usersApi.nurses()])
      .then(([w, d, n]) => {
        setWards(w.data);
        setDoctors(d.data);
        setNurses(n.data);
        if (!editing) {
          const ward = w.data.find(x => x.beds.some(b => !b.isOccupied)) ?? w.data[0];
          setForm(f => ({
            ...f,
            ward: ward?._id ?? '',
            bed: ward?.beds.find(b => !b.isOccupied)?.bedNumber ?? '',
            assignedDoctor: (user?.role === 'doctor' && d.data.some(x => x._id === user.id)) ? user.id : d.data[0]?._id ?? '',
            assignedNurse:  (user?.role === 'nurse'  && n.data.some(x => x._id === user.id)) ? user.id : n.data[0]?._id ?? '',
          }));
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load form data'))
      .finally(() => setLoading(false));
  }, []);

  const changeWard = (wardId: string) => {
    setForm(f => ({ ...f, ward: wardId, bed: freeBeds(wardId)[0]?.bedNumber ?? '' }));
  };

  const locationLocked = editing && patient!.status === 'Discharged' && form.status === 'Discharged';
  const beds = freeBeds(form.ward);
  const noBeds = !locationLocked && beds.length === 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 0 || age > 130) return setError('Please enter a valid age (0–130).');
    if (!locationLocked && !form.bed) return setError('Please choose an available bed.');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        age,
        gender: form.gender as 'Male' | 'Female',
        admissionDate: form.admissionDate,
        diagnosis: form.diagnosis.trim(),
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        assignedDoctor: form.assignedDoctor,
        assignedNurse: form.assignedNurse,
        status: form.status,
        ...(locationLocked ? {} : { ward: form.ward, bed: form.bed }),
      };
      if (editing) {
        await patientsApi.update(patient!._id, payload);
        onSaved(`Patient "${payload.name}" updated.`);
      } else {
        await patientsApi.create({ ...payload, ward: form.ward, bed: form.bed });
        onSaved(`Patient "${payload.name}" registered in bed ${form.bed}.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save patient');
      setSaving(false);
    }
  };

  const withCurrent = (list: ApiUser[], current: ApiUser | string | undefined) => {
    const id = idOf(current as { _id: string } | string);
    if (!id || list.some(u => u._id === id)) return list;
    return [...list, { _id: id, id, name: typeof current === 'object' && current ? current.name : 'Current assignee' } as ApiUser];
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Patient' : 'Register New Patient'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none" aria-label="Close">×</button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center"><div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {error}</div>}

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-4">
                <label className={labelCls}>Full name *</label>
                <input required value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. Mohammed Al-Rashidi" />
              </div>
              <div className="col-span-1">
                <label className={labelCls}>Age *</label>
                <input required type="number" min={0} max={130} value={form.age} onChange={e => set('age', e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-1">
                <label className={labelCls}>Gender *</label>
                <select value={form.gender} onChange={e => set('gender', e.target.value as 'Male' | 'Female')} className={inputCls}>
                  <option>Male</option><option>Female</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Diagnosis / reason for admission *</label>
              <input required value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Allergies <span className="font-normal text-slate-400">(comma separated, leave empty if none)</span></label>
              <input value={form.allergies} onChange={e => set('allergies', e.target.value)} className={inputCls} placeholder="Penicillin, Latex" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Admission date *</label>
                <input required type="date" value={form.admissionDate} onChange={e => set('admissionDate', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ward *</label>
                <select required value={form.ward} onChange={e => changeWard(e.target.value)} disabled={locationLocked} className={inputCls}>
                  {wards.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Bed *</label>
                <select required={!locationLocked} value={form.bed} onChange={e => set('bed', e.target.value)} disabled={locationLocked || noBeds} className={inputCls}>
                  {locationLocked && <option value={form.bed}>{form.bed} (discharged)</option>}
                  {!locationLocked && beds.length === 0 && <option value="">No free beds</option>}
                  {beds.map(b => <option key={b.bedNumber} value={b.bedNumber}>{b.bedNumber}</option>)}
                </select>
              </div>
            </div>
            {noBeds && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">This ward has no free beds. Choose another ward, or ask an administrator to add beds.</p>}
            {locationLocked && <p className="text-xs text-slate-500">Discharged patients don't hold a bed. Change the status to re-admit them.</p>}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Assigned doctor *</label>
                <select required value={form.assignedDoctor} onChange={e => set('assignedDoctor', e.target.value)} className={inputCls}>
                  {withCurrent(doctors, patient?.assignedDoctor).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Assigned nurse *</label>
                <select required value={form.assignedNurse} onChange={e => set('assignedNurse', e.target.value)} className={inputCls}>
                  {withCurrent(nurses, patient?.assignedNurse).map(n => <option key={n._id} value={n._id}>{n.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Condition status</label>
              <select value={form.status} onChange={e => set('status', e.target.value as Status)} className={inputCls}>
                <option>Stable</option><option>Attention</option><option>Critical</option>
                {editing && <option>Discharged</option>}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={saving}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving || noBeds || !form.assignedDoctor || !form.assignedNurse}
                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Register patient'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
