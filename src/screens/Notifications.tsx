import { useState, useEffect } from 'react';
import type { Screen } from '../types';
import { notificationsApi, type ApiNotification } from '../services/api';

interface Props {
  onNavigate: (screen: Screen, patientId?: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

const FALLBACK: ApiNotification[] = [
  { id: '1', _id: '1', type: 'critical', recipient_role: 'doctor', is_read: false, created_at: new Date().toISOString(), title: 'Critical Alert',    message: "Khalid Mansour SpO2 is 90% — requires immediate review" },
  { id: '2', _id: '2', type: 'alert',    recipient_role: 'doctor', is_read: false, created_at: new Date().toISOString(), title: 'Attention Patient', message: "Mohammed Al-Rashidi BP remains elevated at 158/96 mmHg" },
  { id: '3', _id: '3', type: 'task',     recipient_role: 'nurse',  is_read: false, created_at: new Date().toISOString(), title: 'Medication Due',    message: "Omar Yusuf: Salbutamol nebulisation due at 10:00" },
  { id: '4', _id: '4', type: 'task',     recipient_role: 'nurse',  is_read: false, created_at: new Date().toISOString(), title: 'Medication Due',    message: "Mohammed Al-Rashidi: Amlodipine & Metformin due at 20:00" },
  { id: '5', _id: '5', type: 'info',     recipient_role: 'all',    is_read: true,  created_at: new Date().toISOString(), title: 'New Admission',     message: "Leila Basha admitted to Surgical Ward B, Bed B-07" },
  { id: '6', _id: '6', type: 'alert',    recipient_role: 'doctor', is_read: false, created_at: new Date().toISOString(), title: 'Ward Round Due',    message: "Dr. Yusuf Osman: Khalid Mansour ward round overdue" },
];

const typeStyle: Record<string, string> = {
  critical: 'border-l-4 border-l-red-500 bg-red-50',
  alert:    'border-l-4 border-l-amber-500 bg-amber-50',
  task:     'border-l-4 border-l-blue-500 bg-blue-50',
  info:     'border-l-4 border-l-slate-300 bg-slate-50',
};

const typeTextColor: Record<string, string> = {
  critical: 'text-red-700',
  alert:    'text-amber-700',
  task:     'text-blue-700',
  info:     'text-slate-500',
};

const typeIcon: Record<string, string> = {
  critical: '⚠',
  alert:    '🔴',
  task:     '💊',
  info:     '🔔',
};

export default function Notifications({ onNavigate, onUnreadCountChange }: Props) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsApi.list()
      .then(res => setNotifications(res.data))
      .catch(() => setNotifications(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const unread = notifications.filter(n => !n.is_read).length;
    onUnreadCountChange?.(unread);
  }, [notifications, onUnreadCountChange]);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
    } catch { /* offline */ }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
    } catch { /* offline */ }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unread = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const counts = {
    critical: notifications.filter(n => n.type === 'critical' && !n.is_read).length,
    alert:    notifications.filter(n => n.type === 'alert'    && !n.is_read).length,
    task:     notifications.filter(n => n.type === 'task'     && !n.is_read).length,
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unread.length} unread</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-xs">
            {[
              { label: 'Critical', color: 'bg-red-100 text-red-700',    count: counts.critical },
              { label: 'Alert',    color: 'bg-amber-100 text-amber-700', count: counts.alert },
              { label: 'Task',     color: 'bg-blue-100 text-blue-700',   count: counts.task },
            ].map(s => (
              <span key={s.label} className={`px-3 py-1.5 rounded-full font-semibold ${s.color}`}>
                {s.count} {s.label}
              </span>
            ))}
          </div>
          {unread.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline font-medium">
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`bg-white rounded-xl shadow-sm p-4 ${typeStyle[n.type] ?? typeStyle.info} transition-all ${n.is_read ? 'opacity-60' : 'hover:shadow-md cursor-pointer'}`}
            onClick={() => {
              if (!n.is_read) markRead(n.id);
              if (n.patient) onNavigate('patient-profile', n.patient.id);
            }}
          >
            <div className="flex items-start gap-3">
              <div className="text-xl mt-0.5">{typeIcon[n.type] ?? '🔔'}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wide ${typeTextColor[n.type] ?? 'text-slate-500'}`}>
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    · {new Date(n.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {n.is_read && <span className="text-[10px] text-slate-400 ml-auto">Read</span>}
                </div>
                <p className="text-sm text-slate-700">{n.message}</p>
                {n.patient && (
                  <button
                    onClick={e => { e.stopPropagation(); if (!n.is_read) markRead(n.id); onNavigate('patient-profile', n.patient!.id); }}
                    className="mt-2 text-xs text-blue-600 font-medium hover:underline"
                  >
                    View Patient →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
