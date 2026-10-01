import type { PatientStatus } from '../types';

interface Props {
  status: PatientStatus | 'Available' | 'Pending' | 'Administered' | 'Active' | 'Inactive';
  size?: 'sm' | 'md';
}

const config = {
  Stable: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Stable' },
  Attention: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Attention' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Critical' },
  Discharged: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Discharged' },
  Available: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-300', label: 'Available' },
  Pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
  Administered: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Administered' },
  Active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
  Inactive: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Inactive' },
};

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const c = config[status] ?? config.Available;
  const padding = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding} ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
