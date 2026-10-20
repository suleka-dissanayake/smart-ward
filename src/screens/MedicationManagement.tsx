import { useState } from 'react';
import type { Screen } from '../types';
import { patientsApi } from '../services/api';
import { usePatient } from '../hooks/usePatient';
import { fmtDate, fmtDateTime, nameOf, shortId } from '../utils/patient';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Spinner, ErrorState } from '../components/LoadingState';

interface Props {
  patientId: string;
  nurseName: string;
  onNavigate: (screen: Screen, patientId?: string) => void;
  onBack: () => void;
}

const ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Sublingual'];
// Default dose times for each frequency (editable in the form).
const FREQUENCIES: Record<string, string[]> = {
  'Once daily': ['08:00'],
  'Twice daily': ['08:00', '20:00'],
  'Three times daily': ['08:00', '14:00', '20:00'],
  'Four times daily': ['06:00', '12:00', '18:00', '22:00'],
  'Every 8 hours': ['06:00', '14:00', '22:00'],
  'Once at night': ['21:00'],
  'As needed (PRN)': [],
};
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
const EMPTY_ORDER = { name: '', dose: '', route: 'Oral', frequency: 'Twice daily', times: FREQUENCIES['Twice daily'].join(', '), startDate: today(), endDate: inDays(7) };

const fieldCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const lblCls = 'block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide';

export default function MedicationManagement({ patientId, onBack }: Props) {
  const { patient: p, loading, error, reload } = usePatient(patientId);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Doctors create and discontinue medication orders; nurses administer the doses.
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [showOrder, setShowOrder] = useState(false);
  const [order, setOrder] = useState({ ...EMPTY_ORDER });
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [removeMed, setRemoveMed] = useState<{ id: string; name: string } | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [notice, setNotice] = useState('');

  const openOrder = () => { setOrder({ ...EMPTY_ORDER }); setOrderError(''); setShowOrder(true); };

  const setFrequency = (frequency: string) =>
    setOrder(o => ({ ...o, frequency, times: FREQUENCIES[frequency].join(', ') }));

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderBusy(true);
    setOrderError('');
    try {
      const scheduledTimes = order.times.split(',').map(t => t.trim()).filter(Boolean);
      await patientsApi.addMedication(patientId, {
        name: order.name.trim(), dose: order.dose.trim(), route: order.route, frequency: order.frequency,
        startDate: order.startDate, endDate: order.endDate, scheduledTimes,
      });
      setShowOrder(false);
      setNotice(`Order for ${order.name.trim()} created.`);
      setTimeout(() => setNotice(''), 5000);
      await reload();
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setOrderBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeMed) return;
    setRemoveBusy(true);
    setRemoveError('');
    try {
      await patientsApi.removeMedication(patientId, removeMed.id);
      setNotice(`${removeMed.name} order removed.`);
      setTimeout(() => setNotice(''), 5000);
      setRemoveMed(null);
      await reload();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove order');
    } finally {
      setRemoveBusy(false);
    }
  };

  // Saves the administration to the database, then refreshes the patient record.
  const mark = async (medId: string, doseIdx: number) => {
    const key = `${medId}-${doseIdx}`;
    setBusyKey(key);
    setActionError('');
    try {
      await patientsApi.administerDose(patientId, medId, doseIdx);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to record administration');
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) return <Spinner label="Loading medications..." />;
  if (error || !p) return <ErrorState message={error || 'Patient not found'} onBack={onBack} />;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
        ← Back
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Medication Administration</h1>
          <p className="text-sm text-slate-500 mt-0.5">{p.name} · Bed {p.bed}</p>
        </div>
        {isDoctor && (
          <button onClick={openOrder} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            + New Medication Order
          </button>
        )}
      </div>

      {notice && <div className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm bg-green-50 text-green-700 border-green-200">✓ {notice}</div>}

      {/* Patient strip */}
      <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-bold text-sm">
          {p.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
        </div>
        <div>
          <div className="font-semibold">{p.name}</div>
          <div className="text-blue-200 text-xs">{shortId(p._id)} · {p.age}y {p.gender} · {p.diagnosis}</div>
        </div>
        {p.allergies.length > 0 && (
          <div className="ml-auto">
            <div className="text-[10px] text-red-200 font-semibold">⚠ ALLERGIES</div>
            <div className="text-xs text-red-100">{p.allergies.join(', ')}</div>
          </div>
        )}
      </div>

      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-4 py-2.5 rounded-lg border border-red-200">
          <span>⚠</span> {actionError}
        </div>
      )}

      {p.medications.length === 0 && (
        <p className="text-sm text-slate-500">No medications have been prescribed for this patient.</p>
      )}

      {/* Medications */}
      <div className="space-y-4">
        {p.medications.map(med => (
          <div key={med._id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
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
                <div>{fmtDate(med.startDate)}</div>
                <div>→ {fmtDate(med.endDate)}</div>
                {isDoctor && (
                  <button onClick={() => { setRemoveError(''); setRemoveMed({ id: med._id, name: med.name }); }}
                    className="mt-2 text-[11px] font-semibold text-red-600 hover:underline">Discontinue</button>
                )}
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Scheduled Doses</p>
              <div className="space-y-2">
                {med.scheduledTimes.map((dose, i) => {
                  const isAdministered = dose.status === 'Administered';
                  const key = `${med._id}-${i}`;

                  return (
                    <div key={dose._id ?? i} className={`flex items-center justify-between p-3 rounded-lg border ${
                      isAdministered ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-slate-700">{dose.time}</span>
                        <StatusBadge status={isAdministered ? 'Administered' : 'Pending'} />
                        {isAdministered && (
                          <span className="text-xs text-slate-500">
                            {fmtDateTime(dose.administeredAt)} · {nameOf(dose.administeredBy)}
                          </span>
                        )}
                      </div>
                      {!isAdministered && (
                        <button
                          onClick={() => mark(med._id, i)}
                          disabled={busyKey === key}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
                        >
                          {busyKey === key ? 'Saving...' : 'Mark Administered'}
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

      {showOrder && (
        <Modal title="New Medication Order" subtitle={`${p.name} · Bed ${p.bed}`} onClose={() => !orderBusy && setShowOrder(false)}>
          <form onSubmit={submitOrder} className="space-y-4">
            {orderError && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {orderError}</div>}
            {p.allergies.some(a => a && order.name.toLowerCase().includes(a.toLowerCase())) && (
              <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-300 font-semibold">
                ⚠ This patient has a recorded allergy that matches this medicine name ({p.allergies.join(', ')}). Please double-check before saving.
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className={lblCls}>Medicine</label>
                <input required value={order.name} onChange={e => setOrder(o => ({ ...o, name: e.target.value }))} className={fieldCls} placeholder="e.g. Paracetamol" /></div>
              <div><label className={lblCls}>Dose</label>
                <input required value={order.dose} onChange={e => setOrder(o => ({ ...o, dose: e.target.value }))} className={fieldCls} placeholder="500mg" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lblCls}>Route</label>
                <select value={order.route} onChange={e => setOrder(o => ({ ...o, route: e.target.value }))} className={fieldCls}>
                  {ROUTES.map(r => <option key={r}>{r}</option>)}
                </select></div>
              <div><label className={lblCls}>Frequency</label>
                <select value={order.frequency} onChange={e => setFrequency(e.target.value)} className={fieldCls}>
                  {Object.keys(FREQUENCIES).map(f => <option key={f}>{f}</option>)}
                </select></div>
            </div>
            <div><label className={lblCls}>Dose times <span className="font-normal normal-case text-slate-400">(24h, comma separated — leave empty for as-needed)</span></label>
              <input value={order.times} onChange={e => setOrder(o => ({ ...o, times: e.target.value }))} className={fieldCls} placeholder="08:00, 20:00" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lblCls}>Start date</label>
                <input required type="date" value={order.startDate} onChange={e => setOrder(o => ({ ...o, startDate: e.target.value }))} className={fieldCls} /></div>
              <div><label className={lblCls}>End date</label>
                <input required type="date" min={order.startDate} value={order.endDate} onChange={e => setOrder(o => ({ ...o, endDate: e.target.value }))} className={fieldCls} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowOrder(false)} disabled={orderBusy} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={orderBusy} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">{orderBusy ? 'Saving...' : 'Create order'}</button>
            </div>
          </form>
        </Modal>
      )}

      {removeMed && (
        <ConfirmDialog danger title={`Discontinue ${removeMed.name}?`}
          message="The order and its scheduled doses are removed from the patient's medication list. Doses already administered will no longer appear in the history."
          confirmLabel="Discontinue" busy={removeBusy} error={removeError}
          onConfirm={confirmRemove} onCancel={() => setRemoveMed(null)} />
      )}
    </div>
  );
}
