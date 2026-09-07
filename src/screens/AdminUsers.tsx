import { useState, useEffect } from 'react';
import { mockUsers } from '../data/mockData';
import { usersApi, type ApiUser } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const roleColors: Record<string, string> = {
  doctor: 'bg-indigo-50 text-indigo-700',
  nurse:  'bg-teal-50 text-teal-700',
  admin:  'bg-purple-50 text-purple-700',
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'doctor', department: '', status: 'Active' as 'Active' | 'Inactive' };

export default function AdminUsers() {
  const [users, setUsers]         = useState<ApiUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAdd, setShowAdd]     = useState(false);
  const [toast, setToast]         = useState('');
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  useEffect(() => {
    usersApi.list()
      .then(res => setUsers(res.data))
      .catch(() => setUsers(mockUsers.map(u => ({ _id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, status: u.status }))))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (roleFilter === 'All' || u.role === roleFilter.toLowerCase());
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersApi.create(form as Parameters<typeof usersApi.create>[0]);
      setUsers(prev => [res.data, ...prev]);
      showToast(`User "${res.data.name}" added successfully.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setSaving(false);
      setShowAdd(false);
      setForm({ ...EMPTY_FORM });
    }
  };

  const handleToggleStatus = async (u: ApiUser) => {
    const newStatus: 'Active' | 'Inactive' = u.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await usersApi.update(u._id, { status: newStatus });
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, status: newStatus } : x));
      showToast(`${u.name} marked as ${newStatus}.`);
    } catch {
      showToast('Failed to update user status.');
    }
  };

  const handleDelete = async (u: ApiUser) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      await usersApi.remove(u._id);
      setUsers(prev => prev.filter(x => x._id !== u._id));
      showToast(`${u.name} deleted.`);
    } catch {
      showToast('Failed to delete user.');
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} registered users</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">+ Add User</button>
      </div>

      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${toast.includes('Failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {toast.includes('Failed') ? '✗' : '✓'} {toast}
        </div>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
          {['All', 'Doctor', 'Nurse', 'Admin'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_100px_100px_80px_80px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Name</span><span>Email</span><span>Role</span><span>Department</span><span>Status</span><span></span>
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map(u => (
            <div key={u._id} className="grid grid-cols-[1fr_1fr_100px_100px_80px_80px] gap-4 px-5 py-4 items-center hover:bg-slate-50">
              <div className="text-sm font-semibold text-slate-900">{u.name}</div>
              <div className="text-sm text-slate-500 truncate">{u.email}</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${roleColors[u.role]}`}>
                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
              </span>
              <div className="text-xs text-slate-500">{u.department}</div>
              <StatusBadge status={u.status} />
              <div className="flex gap-1">
                <button onClick={() => handleToggleStatus(u)}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">
                  {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(u)}
                  className="text-xs px-2 py-1 rounded-lg border border-red-100 text-red-600 hover:bg-red-50">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Full Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Password</label>
                <input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">Department</label>
                  <input required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
