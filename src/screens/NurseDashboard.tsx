import { useState, useEffect } from 'react';
import type { AppUser, Screen } from '../types';
import { dashboardApi, patientsApi, type DashboardStats, type ApiPatient } from '../services/api';
import StatusBadge from '../components/StatusBadge';

interface Props {
  user: AppUser;
  onNavigate: (screen: Screen, patientId?: string) => void;
}

export default function NurseDashboard({ user, onNavigate }: Props) {
  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.stats().then(r => setStats(r.data)),
      patientsApi.list({ nurse: user.id }).then(r => setPatients(r.data)),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  // Patients with pending medications today
  const pendingMedPatients = patients.filter(p =>
    p.medications.some(m => m.scheduledTimes.some(d => d.status === 'Pending'))
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Good morning, {user.name}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'My Patients',        value: patients.length,           color: 'bg-teal-600'  },
          { label: 'Critical',           value: stats?.criticalPatients ?? 0,  color: 'bg-red-500'   },
          { label: 'Meds Pending',       value: pendingMedPatients.length, color: 'bg-amber-500' },
          { label: 'Unread Alerts',      value: stats?.unreadNotifications ?? 0, color: 'bg-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-2 h-8 rounded-full ${s.color} mb-3`} />
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending medications alert */}
      {pendingMedPatients.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h2 className="text-sm font-bold text-amber-800 mb-3">💊 Pending Medications</h2>
          <div className="space-y-2">
            {pendingMedPatients.map(p => {
              const pendingMeds = p.medications.filter(m => m.scheduledTimes.some(d => d.status === 'Pending'));
              return (
                <div key={p._id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-amber-100">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{p.name}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {pendingMeds.map(m => m.name).join(', ')}
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigate('medications', p._id)}
                    className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700"
                  >
                    Administer
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Patient list */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">My Patients</h2>
          <button
            onClick={() => onNavigate('patient-list')}
            className="text-xs text-blue-600 font-medium hover:underline"
          >
            View All
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {patients.slice(0, 5).map(p => (
            <div key={p._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center text-teal-700 font-bold text-sm">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500">Bed {p.bed} · {p.diagnosis}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                <button
                  onClick={() => onNavigate('patient-profile', p._id)}
                  className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700"
                >
                  View
                </button>
              </div>
            </div>
          ))}
          {patients.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No patients assigned.</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Patient List',  screen: 'patient-list'  as Screen, icon: '📋' },
          { label: 'Nursing Notes', screen: 'nursing-notes' as Screen, icon: '📝' },
          { label: 'Notifications', screen: 'notifications' as Screen, icon: '🔔' },
        ].map(a => (
          <button
            key={a.label}
            onClick={() => onNavigate(a.screen)}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all text-left"
          >
            <span className="text-2xl mb-2 block">{a.icon}</span>
            <span className="text-sm font-semibold text-slate-700">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
