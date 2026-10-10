import { useState, useEffect } from 'react';
import { usersApi, type ApiUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { Spinner } from '../components/LoadingState';

const roleColors: Record<string, string> = {
  doctor: 'bg-indigo-50 text-indigo-700',
  nurse:  'bg-teal-50 text-teal-700',
  admin:  'bg-purple-50 text-purple-700',
};

type Role = 'doctor' | 'nurse' | 'admin';
type FormState = { name: string; email: string; password: string; role: Role; department: string; status: 'Active' | 'Inactive' };
const EMPTY_FORM: FormState = { name: '', email: '', password: '', role: 'doctor', department: '', status: 'Active' };

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers]         = useState<ApiUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [toast, setToast]         = useState<{ text: string; error?: boolean } | null>(null);

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<ApiUser | null>(null);
  const [form, setForm]           = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const [deleting, setDeleting]   = useState<ApiUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const showToast = (text: string, error = false) => { setToast({ text, error }); setTimeout(() => setToast(null), 5000); };

  const load = () =>
    usersApi.list()
      .then(res => { setUsers(res.data); setLoadError(''); })
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false));

  useEffect(() => { void load(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department.toLowerCase().includes(q))
      && (roleFilter === 'All' || u.role === roleFilter.toLowerCase());
  });

  const openAdd = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setFormError(''); setShowForm(true); };
  const openEdit = (u: ApiUser) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department, status: u.status });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const { name, email, role, department, status } = form;
        await usersApi.update(editing._id, { name, email, role, department, status });
        showToast(`${name} updated.`);
      } else {
        await usersApi.create(form);
        showToast(`${form.name} added as ${form.role}.`);
      }
      setShowForm(false);
      void load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save user'); // keep the form open so nothing is lost
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u: ApiUser) => {
    const newStatus: 'Active' | 'Inactive' = u.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await usersApi.update(u._id, { status: newStatus });
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, status: newStatus } : x));
      showToast(`${u.name} marked as ${newStatus}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update user status.', true);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await usersApi.remove(deleting._id);
      showToast(`${deleting.name} was removed.`);
      setDeleting(null);
      void load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading users..." />;

  const count = (r: Role) => users.filter(u => u.role === r).length;
  const isMe = (u: ApiUser) => u._id === me?.id;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {users.length} users · {count('doctor')} doctors · {count('nurse')} nurses · {count('admin')} admins
          </p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">+ Add User</button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs px-4 py-2.5 rounded-lg border border-red-200">
          <span>⚠</span> {loadError}. Make sure the backend is running and the database is seeded.
        </div>
      )}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${toast.error ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
          {toast.error ? '✗' : '✓'} {toast.text}
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
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
          {['All', 'Doctor', 'Nurse', 'Admin'].map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_90px_130px_80px_230px] gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Name</span><span>Email</span><span>Role</span><span>Department</span><span>Status</span><span></span>
        </div>
        {filtered.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-400">No users found</div>}
        <div className="divide-y divide-slate-50">
          {filtered.map(u => (
            <div key={u._id} className="grid grid-cols-[1fr_1fr_90px_130px_80px_230px] gap-4 px-5 py-4 items-center hover:bg-slate-50">
              <div className="text-sm font-semibold text-slate-900">
                {u.name}{isMe(u) && <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">You</span>}
              </div>
              <div className="text-sm text-slate-500 truncate">{u.email}</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${roleColors[u.role]}`}>
                {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
              </span>
              <div className="text-xs text-slate-500 truncate">{u.department}</div>
              <StatusBadge status={u.status} />
              <div className="flex gap-1.5 justify-end">
                <button onClick={() => openEdit(u)} className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100">Edit</button>
                {!isMe(u) && (
                  <>
                    <button onClick={() => handleToggleStatus(u)} className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">
                      {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => { setDeleteError(''); setDeleting(u); }} className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Remove</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={saving ? undefined : () => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">{editing ? `Edit ${editing.name}` : 'Add New User'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {formError}</div>}
              <div>
                <label className={labelCls}>Full Name</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="e.g. Dr. Sarah Mitchell" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
              </div>
              {!editing && (
                <div>
                  <label className={labelCls}>Initial Password</label>
                  <input required type="password" minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={inputCls} placeholder="At least 6 characters" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))} disabled={!!editing && isMe(editing)} className={inputCls}>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <input required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className={inputCls} placeholder="e.g. Medical Ward A" />
                </div>
              </div>
              {editing && !isMe(editing) && (
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))} className={inputCls}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleting && (
        <ConfirmDialog
          danger
          title={`Remove ${deleting.name}?`}
          message={<>This deletes the {deleting.role}'s account and they will no longer be able to sign in.
            {deleting.role !== 'admin' && <> A {deleting.role} who is still assigned to patients can't be removed until those patients are reassigned.</>}
            {' '}To keep the account but block access, use <strong>Deactivate</strong> instead.</>}
          confirmLabel="Remove user"
          busy={deleteBusy}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
