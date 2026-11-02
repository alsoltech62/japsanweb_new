import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminUsers, adminUserAction } from '../../services/api';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [kyc, setKyc] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const limit = 20;

  function load() {
    setLoading(true);
    getAdminUsers({ search, status, kyc_status: kyc, page, limit }).then(r => {
      setUsers(r.data.data?.users || []);
      setTotal(r.data.data?.total || 0);
      setSelectedIds([]);
    }).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [search, status, kyc, page]);

  const KYC_COLOR = { pending: 'badge-warning', submitted: 'badge-info', approved: 'badge-success', rejected: 'badge-danger' };

  async function doAction(action, userId, extra = {}) {
    try {
      await adminUserAction({ action, user_id: userId, ...extra });
      toast.success('Action completed');
      setModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (bulkType, extra = {}) => {
    if (selectedIds.length === 0) return toast.error('No users selected');
    try {
      const res = await adminUserAction({
        action: 'bulk_action',
        bulk_type: bulkType,
        user_ids: selectedIds,
        ...extra
      });
      toast.success(res.data?.message || 'Bulk action completed');
      setSelectedIds([]);
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk action failed');
    }
  };

  async function downloadExcel() {
    try {
      const toastId = toast.loading('Generating Excel...');
      const r = await getAdminUsers({ search, status, kyc_status: kyc, page: 1, limit: 100000 });
      const allUsers = r.data.data?.users || [];
      toast.dismiss(toastId);
      if (!allUsers.length) return toast.error('No users found to download');

      const headers = ['ID', 'Name', 'Phone', 'Email', 'City', 'Area', 'Coin Balance', 'KYC Status', 'Status', 'Registered At'];
      const rows = allUsers.map(u => [
        u.id,
        `"${(u.name || '').toString().replace(/"/g, '""')}"`,
        `"${(u.phone || '').toString().replace(/"/g, '""')}"`,
        `"${(u.email || '').toString().replace(/"/g, '""')}"`,
        `"${(u.city || '').toString().replace(/"/g, '""')}"`,
        `"${(u.area || '').toString().replace(/"/g, '""')}"`,
        u.coin_balance || 0,
        `"${(u.kyc_status || '').toString().replace(/"/g, '""')}"`,
        u.is_frozen ? 'Frozen' : u.is_active ? 'Active' : 'Inactive',
        `"${(u.created_at || '').toString().replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Users_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allUsers.length} users successfully!`);
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to download Excel');
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">👥 User Management</h1>
        <button onClick={downloadExcel} className="btn-primary flex items-center gap-2">
          <span>📥</span> Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input-field flex-1" placeholder="Search name, phone, email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <select className="input-field w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Users</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
        </select>
        <select className="input-field w-auto" value={kyc} onChange={e => { setKyc(e.target.value); setPage(1); }}>
          <option value="">All KYC Status</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{total} users found</p>
        {selectedIds.length > 0 && (
          <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
            {selectedIds.length} users selected
          </span>
        )}
      </div>

      {/* Sticky Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-4 z-30 border border-slate-700 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm bg-orange-500 text-white px-2.5 py-0.5 rounded-full">
              {selectedIds.length}
            </span>
            <span className="text-sm font-medium text-slate-200">Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkAction('approve_kyc')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              ✅ Approve KYC
            </button>
            <button
              onClick={() => handleBulkAction('reject_kyc')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              ❌ Reject KYC
            </button>
            <button
              onClick={() => handleBulkAction('unfreeze')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              🔓 Unfreeze
            </button>
            <button
              onClick={() => handleBulkAction('freeze')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all"
            >
              ❄️ Freeze
            </button>
            <button
              onClick={() => setModal({ type: 'bulk_coins' })}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
            >
              🪙 Credit Coins
            </button>
            <button
              onClick={() => setModal({ type: 'bulk_notification' })}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1"
            >
              📢 Notify
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                    />
                  </th>
                  {['Name', 'Phone', 'Balance', 'Transactions', 'KYC', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${selectedIds.includes(u.id) ? 'bg-orange-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => handleToggleSelect(u.id)}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.phone}</td>
                    <td className="px-4 py-3 font-semibold text-orange-500 whitespace-nowrap">{Number(u.coin_balance || 0).toLocaleString()} 🪙</td>
                    <td className="px-4 py-3 text-slate-600">{u.tx_count || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${KYC_COLOR[u.kyc_status] || 'badge-info'}`}>{u.kyc_status || 'pending'}</span>
                      <div className="mt-1 flex flex-col gap-1">
                        {u.kyc_document && (
                          <a href={u.kyc_document} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline font-medium hover:text-blue-800 flex items-center gap-1">
                            <span>📄</span> View Front
                          </a>
                        )}
                        {u.kyc_document_back && (
                          <a href={u.kyc_document_back} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline font-medium hover:text-blue-800 flex items-center gap-1">
                            <span>📄</span> View Back
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${u.is_frozen ? 'badge-danger' : u.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {u.is_frozen ? 'Frozen' : u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => doAction('approve_kyc', u.id)} className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 font-medium">✅ Approve KYC</button>
                        <button onClick={() => setModal({ type: 'reject_kyc', userId: u.id, name: u.name })} className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 font-medium">❌ Reject</button>
                        <button onClick={() => setModal({ type: 'freeze', userId: u.id, isFrozen: u.is_frozen, name: u.name })}
                          className={`text-xs px-3 py-1 rounded-lg font-medium ${u.is_frozen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {u.is_frozen ? 'Unfreeze' : 'Freeze'}
                        </button>
                        <button onClick={() => setModal({ type: 'adjust', userId: u.id, name: u.name })}
                          className="text-xs px-3 py-1 rounded-lg font-medium bg-orange-100 text-orange-700">
                          Adjust
                        </button>
                        <button onClick={() => { setForm({ name: u.name, email: u.email || '', city: u.city || '', area: u.area || '' }); setModal({ type: 'edit_user', user: u }); }}
                          className="text-xs px-3 py-1 rounded-lg font-medium bg-indigo-100 text-indigo-700">
                          Edit
                        </button>
                        <button onClick={() => setModal({ type: 'profile', user: u })}
                          className="text-xs px-3 py-1 rounded-lg font-medium bg-blue-100 text-blue-700">
                          Profile
                        </button>
                        <a href={`https://wa.me/${(u.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" 
                          className="text-xs px-3 py-1 rounded-lg font-medium bg-green-100 text-green-700 flex items-center justify-center">
                          WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-slate-600">Page {page} of {Math.ceil(total / limit)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm slide-up">
            {modal.type === 'freeze' && (
              <>
                <h3 className="font-bold text-lg mb-4">{modal.isFrozen ? 'Unfreeze' : 'Freeze'} Account</h3>
                <p className="text-slate-600 mb-4">User: <strong>{modal.name}</strong></p>
                {!modal.isFrozen && <textarea className="input-field mb-4 h-24 resize-none" placeholder="Reason for freezing..." value={form.reason || ''} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />}
                <div className="flex gap-3">
                  <button onClick={() => doAction(modal.isFrozen ? 'unfreeze' : 'freeze', modal.userId, { reason: form.reason })}
                    className="btn-primary flex-1">{modal.isFrozen ? 'Unfreeze' : 'Freeze'}</button>
                  <button onClick={() => { setModal(null); setForm({}); }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </>
            )}
            {modal.type === 'adjust' && (
              <>
                <h3 className="font-bold text-lg mb-4">Adjust Wallet — {modal.name}</h3>

                <input type="number" className="input-field mb-3" placeholder="Amount (positive to add, negative to deduct)" value={form.coins || ''} onChange={e => setForm(f => ({ ...f, coins: e.target.value }))} />
                <textarea className="input-field mb-4 h-20 resize-none" placeholder="Reason for adjustment..." value={form.reason || ''} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                <div className="flex gap-3">
                  <button onClick={() => doAction('adjust_wallet', modal.userId, { coins: parseFloat(form.coins), reason: form.reason, wallet_type: form.walletType || 'coin_balance' })}
                    className="btn-primary flex-1">Adjust</button>
                  <button onClick={() => { setModal(null); setForm({}); }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </>
            )}
            {modal.type === 'reject_kyc' && (
              <>
                <h3 className="font-bold text-lg mb-2">Reject KYC — {modal.name}</h3>
                <textarea className="input-field mb-4 h-24 resize-none" placeholder="Rejection notes..." value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                <div className="flex gap-3">
                  <button onClick={() => doAction('reject_kyc', modal.userId, { notes: form.notes })} className="btn-primary flex-1 bg-red-500">Reject</button>
                  <button onClick={() => { setModal(null); setForm({}); }} className="btn-secondary flex-1">Cancel</button>
                </div>
              </>
            )}
            {modal.type === 'profile' && (
              <>
                <h3 className="font-bold text-xl mb-4">User Profile — {modal.user.name}</h3>
                <div className="space-y-3 mb-6 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-500">Phone:</span><span className="font-medium text-right">{modal.user.phone}</span>
                    <span className="text-slate-500">Email:</span><span className="font-medium text-right">{modal.user.email || 'N/A'}</span>
                    <span className="text-slate-500">City:</span><span className="font-medium text-right">{modal.user.city || 'N/A'}</span>
                    <span className="text-slate-500">Area:</span><span className="font-medium text-right">{modal.user.area || 'N/A'}</span>
                    <span className="text-slate-500">Coin Balance:</span><span className="font-bold text-orange-500 text-right">{modal.user.coin_balance || 0} 🪙</span>
                    <span className="text-slate-500">Locked Coins:</span><span className="font-bold text-orange-500 text-right">{modal.user.locked_coin_balance || 0} 🔒</span>
                    <span className="text-slate-500">Cash Balance:</span><span className="font-bold text-green-600 text-right">₹{Number(modal.user.cash_wallet_balance || 0).toFixed(2)}</span>
                    <span className="text-slate-500">KYC Status:</span><span className="font-medium text-right capitalize">{modal.user.kyc_status}</span>
                    <span className="text-slate-500">Status:</span><span className="font-medium text-right">{modal.user.is_frozen ? 'Frozen' : modal.user.is_active ? 'Active' : 'Inactive'}</span>
                    <span className="text-slate-500">Registered:</span><span className="font-medium text-right">{modal.user.created_at}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setForm({ name: modal.user.name, email: modal.user.email || '', city: modal.user.city || '', area: modal.user.area || '' }); setModal({ type: 'edit_user', user: modal.user }); }} className="btn-primary flex-1">Edit</button>
                  <a href={`https://wa.me/${modal.user.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="btn-secondary flex-1 text-center bg-green-100 text-green-700 border-green-200 hover:bg-green-200">WhatsApp</a>
                  <button onClick={() => setModal(null)} className="btn-secondary flex-1">Close</button>
                </div>
              </>
            )}
            {modal.type === 'bulk_coins' && (
              <>
                <h3 className="font-bold text-lg mb-2">Bulk Credit Coins</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Crediting coins to <strong className="text-orange-600 font-bold">{selectedIds.length}</strong> selected users.
                </p>
                <input
                  type="number"
                  className="input-field mb-3"
                  placeholder="Coins per user (e.g. 50)"
                  value={form.coins || ''}
                  onChange={e => setForm(f => ({ ...f, coins: e.target.value }))}
                  required
                />
                <textarea
                  className="input-field mb-4 h-20 resize-none"
                  placeholder="Reason / Note (e.g. Festival Promotional Bonus)"
                  value={form.reason || ''}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkAction('credit_coins', { coins: parseFloat(form.coins), reason: form.reason })}
                    className="btn-primary flex-1"
                  >
                    Credit to All
                  </button>
                  <button onClick={() => { setModal(null); setForm({}); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modal.type === 'bulk_notification' && (
              <>
                <h3 className="font-bold text-lg mb-2">Send Bulk Notification</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Sending notification to <strong className="text-purple-600 font-bold">{selectedIds.length}</strong> selected users.
                </p>
                <input
                  type="text"
                  className="input-field mb-3"
                  placeholder="Notification Title (e.g. Exclusive Offer!)"
                  value={form.title || ''}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                />
                <textarea
                  className="input-field mb-4 h-24 resize-none"
                  placeholder="Notification Message..."
                  value={form.message || ''}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  required
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleBulkAction('send_notification', { title: form.title, message: form.message })}
                    className="btn-primary flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Send to All
                  </button>
                  <button onClick={() => { setModal(null); setForm({}); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
