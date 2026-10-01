import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { mockPatients, mockUsers, mockWards } from '../data/mockData';
import { dashboardApi, type DashboardStats } from '../services/api';

interface Props {
  onNavigate: (screen: Screen) => void;
}

export default function AdminDashboard({ onNavigate }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setStats(res.data))
      .catch(() => {
        const totalBeds = mockWards.reduce((a, w) => a + w.totalBeds, 0);
        const occupiedBeds = mockWards.reduce((a, w) => a + w.occupiedBeds, 0);
        setStats({
          totalPatients: mockPatients.length,
          criticalPatients: mockPatients.filter(p => p.status === 'Critical').length,
          stablePatients: mockPatients.filter(p => p.status === 'Stable').length,
          attentionPatients: mockPatients.filter(p => p.status === 'Attention').length,
          totalWards: mockWards.length,
          totalUsers: mockUsers.length,
          unreadNotifications: 4,
          wardSummary: mockWards.map(w => ({ id: w.id, name: w.name, totalBeds: w.totalBeds, occupiedBeds: w.occupiedBeds })),
        });
      });
  }, []);

  const doctors = stats ? 0 : mockUsers.filter(u => u.role === 'doctor').length;
  const nurses  = stats ? 0 : mockUsers.filter(u => u.role === 'nurse').length;
  const totalBeds    = stats?.wardSummary.reduce((a, w) => a + w.totalBeds, 0) ?? 0;
  const occupiedBeds = stats?.wardSummary.reduce((a, w) => a + w.occupiedBeds, 0) ?? 0;

  const statCards = [
    { label: 'Total Patients',  value: stats?.totalPatients ?? '-',          color: 'bg-blue-600',  icon: '♥' },
    { label: 'Occupied Beds',   value: occupiedBeds,                          color: 'bg-amber-500', icon: '🛏' },
    { label: 'Available Beds',  value: totalBeds - occupiedBeds,              color: 'bg-green-600', icon: '✓' },
    { label: 'Doctors',         value: stats?.totalUsers ? doctors : doctors, color: 'bg-indigo-50', icon: 'stethoscope' },
    { label: 'Nurses',          value: stats?.totalUsers ? nurses  : nurses,  color: 'bg-teal-600',  icon: '♥' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3 ${s.icon === 'stethoscope' ? '' : 'text-white text-base'}`}>
              {s.icon === 'stethoscope' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                  <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/>
                  <circle cx="20" cy="10" r="2"/>
                </svg>
              ) : s.icon}
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Ward Overview</h2>
            <button onClick={() => onNavigate('admin-wards')} className="text-xs text-blue-600 font-medium hover:underline">Manage</button>
          </div>
          <div className="divide-y divide-slate-50">
            {(stats?.wardSummary ?? mockWards.map(w => ({ id: w.id, name: w.name, totalBeds: w.totalBeds, occupiedBeds: w.occupiedBeds }))).map(ward => {
              const pct = Math.round((ward.occupiedBeds / ward.totalBeds) * 100);
              return (
                <div key={ward.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900">{ward.name}</span>
                    <span className="text-xs text-slate-500">{ward.occupiedBeds}/{ward.totalBeds} beds</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{pct}% occupied</span>
                    <span className="text-[10px] text-green-600 font-medium">{ward.totalBeds - ward.occupiedBeds} available</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Add Patient',   screen: 'admin-patients' as Screen, icon: '♥',  color: 'bg-blue-50 text-blue-700' },
                { label: 'Manage Wards',  screen: 'admin-wards'    as Screen, icon: '🏥', color: 'bg-teal-50 text-teal-700' },
                { label: 'Manage Users',  screen: 'admin-users'    as Screen, icon: '👤', color: 'bg-purple-50 text-purple-700' },
              ].map(a => (
                <button key={a.label} onClick={() => onNavigate(a.screen)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left">
                  <span className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center text-sm`}>{a.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
