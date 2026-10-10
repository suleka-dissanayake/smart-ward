import { useState } from 'react';
import { patientsApi, type ApiPatient } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  patient: ApiPatient;
  onDone: (message: string) => void;
  onClose: () => void;
}

export function RemovePatientDialog({ patient, onDone, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await patientsApi.remove(patient._id);
      onDone(`Patient "${patient.name}" was removed and their bed is now free.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove patient');
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      danger
      title={`Remove ${patient.name}?`}
      message={<>
        This <strong>permanently deletes</strong> the patient's record, including vitals, medications, ward rounds and nursing notes. It cannot be undone.
        <br />If the patient is simply leaving the hospital, use <strong>Discharge</strong> instead to keep their history.
      </>}
      confirmLabel="Remove patient"
      busy={busy}
      error={error}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}

export function DischargeDialog({ patient, onDone, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await patientsApi.update(patient._id, { status: 'Discharged' });
      onDone(`${patient.name} was discharged. Bed ${patient.bed} is now available.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discharge patient');
      setBusy(false);
    }
  };

  return (
    <ConfirmDialog
      title={`Discharge ${patient.name}?`}
      message="The patient's record and history are kept, and their bed becomes available for a new admission."
      confirmLabel="Discharge"
      busy={busy}
      error={error}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}
