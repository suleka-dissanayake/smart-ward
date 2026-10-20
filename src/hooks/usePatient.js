import { useCallback, useEffect, useState } from 'react';
import { patientsApi } from '../services/api';

/** Loads one patient from the API. `reload()` refreshes silently (no spinner flash). */
export function usePatient(patientId) {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      return patientsApi
        .get(patientId)
        .then((res) => setPatient(res.data))
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load patient'))
        .finally(() => setLoading(false));
    },
    [patientId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { patient, loading, error, reload: () => load(true) };
}
