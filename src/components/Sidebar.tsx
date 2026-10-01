import type { Screen, UserRole } from '../types';

interface NavItem {
  id: Screen;
  label: string;
  icon: string;
}

const doctorNav: NavItem[] = [
  { id: 'doctor-dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'patient-list', label: 'Patients', icon: '♥' },
  { id: 'ward-bed', label: 'Ward View', icon: '⊟' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

const nurseNav: NavItem[] = [
  { id: 'nurse-dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'patient-list', label: 'My Patients', icon: '♥' },
  { id: 'ward-bed', label: 'Ward View', icon: '⊟' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

const adminNav: NavItem[] = [
  { id: 'admin-dashboard', label: 'Dashboard', icon: '⊞' },
  { id: 'admin-patients', label: 'Patients', icon: '♥' },
  { id: 'admin-wards', label: 'Wards & Beds', icon: '⊟' },
  { id: 'admin-users', label: 'Users', icon: '👤' },
];

interface Props {
  role: UserRole;
  currentScreen: Screen;
  userName: string;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  notifCount?: number;
}

export default function Sidebar({ role, currentScreen, userName, onNavigate, onLogout, notifCount = 3 }: Props) {
  const nav = role === 'doctor' ? doctorNav : role === 'nurse' ? nurseNav : adminNav;
  const initials = userName.split(' ').filter(w => w[0] === w[0]?.toUpperCase() && w !== 'Dr.' && w !== 'Nurse').slice(0, 2).map(w => w[0]).join('');

  return (
    <aside className="flex flex-col w-[220px] min-w-[220px] h-full bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1565C0 0%, #00796B 100%)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2v14M2 9h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-700 text-slate-900 leading-tight" style={{ fontWeight: 700 }}>SmartWard</div>
          <div className="text-[10px] text-slate-400 leading-tight">Ward Management System</div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3 border-b border-slate-100">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {role === 'admin' ? 'Administrator' : role === 'doctor' ? 'Doctor Portal' : 'Nurse Portal'}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const active = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.id === 'notifications' && notifCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-500 text-white' : 'bg-red-500 text-white'}`}>
                  {notifCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">{userName}</div>
            <div className="text-[10px] text-slate-400 capitalize">{role}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full text-xs text-slate-500 hover:text-red-600 text-left py-1 transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
