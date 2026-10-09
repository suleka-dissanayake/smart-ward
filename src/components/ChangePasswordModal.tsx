import { useState } from 'react';
import { authApi } from '../services/api';
import Modal from './Modal';

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.next.length < 6) return setError('The new password must be at least 6 characters.');
    if (form.next !== form.confirm) return setError('The new passwords do not match.');
    if (form.next === form.current) return setError('The new password must be different from the current one.');
    setBusy(true);
    try {
      await authApi.changePassword(form.current, form.next);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Change Password" onClose={busy ? () => {} : onClose}>
      {done ? (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
          <p className="text-sm text-slate-700 mb-5">Your password has been changed.</p>
          <button onClick={onClose} className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2.5 rounded-lg border border-red-200">✗ {error}</div>}
          <div><label className={labelCls}>Current password</label>
            <input required type="password" autoComplete="current-password" value={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>New password</label>
            <input required type="password" autoComplete="new-password" value={form.next} onChange={e => setForm(f => ({ ...f, next: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Confirm new password</label>
            <input required type="password" autoComplete="new-password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} className={inputCls} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={busy} className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60">{busy ? 'Saving...' : 'Change password'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
