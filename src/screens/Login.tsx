import { useState } from 'react';
import { useAuth, seedDb } from '../context/AuthContext';
import type { AppUser } from '../types';

const DEMO_ACCOUNTS = [
  { label: 'Doctor',  sub: 'Dr. Ahmed',   email: 'ahmed.alfarouk@smartward.health',  password: 'doctor123', role: 'doctor' as const },
  { label: 'Nurse',   sub: 'Nurse Aisha', email: 'aisha.karimi@smartward.health',    password: 'nurse123',  role: 'nurse'  as const },
  { label: 'Admin',   sub: 'Ibrahim',     email: 'ibrahim.hassan@smartward.health',  password: 'admin123',  role: 'admin'  as const },
];

export default function Login() {
  const { login, quickLogin } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [seeding, setSeeding]   = useState(false);
  const [seedMsg, setSeedMsg]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acct: typeof DEMO_ACCOUNTS[0]) => {
    setLoading(true);
    setError('');
    try {
      await login(acct.email, acct.password);
    } catch {
      // Supabase unreachable or user not seeded — use offline demo
      const demoUser: AppUser = {
        id: acct.role === 'doctor' ? 'D001' : acct.role === 'nurse' ? 'N001' : 'A001',
        name: acct.role === 'doctor' ? 'Dr. Ahmed Al-Farouk' : acct.role === 'nurse' ? 'Nurse Aisha Karimi' : 'Ibrahim Hassan',
        email: acct.email, role: acct.role,
        department: acct.role === 'doctor' ? 'Internal Medicine' : acct.role === 'nurse' ? 'Medical Ward' : 'Administration',
        status: 'Active',
      };
      quickLogin(demoUser);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    try {
      const res = await seedDb();
      setSeedMsg(res.message ?? 'Seed complete!');
    } catch {
      setSeedMsg('Seed failed — check edge function deployment.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #EBF4FF 0%, #E0F2FE 50%, #E6F7F5 100%)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-blue-700 p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white/30"
              style={{ width: 200 + i * 120, height: 200 + i * 120, top: -60 + i * 20, left: -60 + i * 20 }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2v16M2 10h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-white">SmartWard</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Digital Ward<br />Management<br />System
          </h1>
          <p className="text-blue-200 text-sm mt-6 leading-relaxed">
            Powered by Supabase — real-time data, secure auth, and persistent records.
          </p>
        </div>

        {/* Seed helper */}
        <div className="relative z-10">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <p className="text-xs text-blue-200 mb-2 font-semibold">First time setup</p>
            <p className="text-xs text-blue-100 mb-3">Click to populate the database with demo patients, wards, and staff.</p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="w-full py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {seeding ? 'Seeding database...' : '🌱 Seed Demo Data'}
            </button>
            {seedMsg && <p className="text-xs text-blue-100 mt-2 text-center">{seedMsg}</p>}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[420px]">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center lg:hidden" style={{ background: 'linear-gradient(135deg, #1565C0, #00796B)' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2v16M2 10h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
                <p className="text-sm text-slate-500">Hospital Ward Management System</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. ahmed.alfarouk@smartward.health"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 placeholder-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 placeholder-slate-400"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-100">
                  <span>⚠</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all text-sm shadow-sm disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Demo Access</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map(acct => (
                  <button
                    key={acct.role}
                    onClick={() => handleQuickLogin(acct)}
                    disabled={loading}
                    className="flex flex-col items-center p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50"
                  >
                    <span className="text-xs font-semibold text-slate-700">{acct.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{acct.sub}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Seed demo data first, then sign in. Falls back to offline mode if Supabase is unavailable.
              </p>
            </div>

            {/* Mobile seed button */}
            <div className="mt-4 pt-4 border-t border-slate-100 lg:hidden">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="w-full py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                {seeding ? 'Seeding...' : '🌱 Seed Demo Data'}
              </button>
              {seedMsg && <p className="text-xs text-slate-500 mt-1.5 text-center">{seedMsg}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
