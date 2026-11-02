import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminWithdrawals, adminWithdrawAction } from '../../services/api';
import { format } from 'date-fns';

const STATUS_COLOR = { pending:'badge-warning', approved:'badge-info', processing:'badge-info', completed:'badge-success', rejected:'badge-danger' };

export default function AdminWithdrawals() {
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [status, setStatus]   = useState('pending');
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState({});
  const limit = 20;

  function load() {
    setLoading(true);
    getAdminWithdrawals({ status, page, limit }).then(r => {
      setItems(r.data.data?.withdrawals || []);
      setTotal(r.data.data?.total || 0);
    }).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status, page]);

  async function doAction(action, wdId, extra={}) {
    try {
      await adminWithdrawAction({ action, withdrawal_id: wdId, ...extra });
      toast.success('Action completed');
      setModal(null); setForm({});
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  }

  async function downloadExcel() {
    try {
      const toastId = toast.loading('Generating Excel...');
      const r = await getAdminWithdrawals({ status, page: 1, limit: 100000 });
      const allWds = r.data.data?.withdrawals || [];
      toast.dismiss(toastId);
      if (!allWds.length) return toast.error('No withdrawals found to download');

      const headers = ['ID', 'Business/User Name', 'Owner Name', 'Phone', 'Amount Requested', 'Fee Percent', 'Fee Amount', 'Net Amount', 'Bank Name', 'Account Number', 'IFSC', 'Status', 'Settlement Date', 'Date'];
      const rows = allWds.map(w => [
        w.id,
        `"${(w.business_name || '').toString().replace(/"/g, '""')}"`,
        `"${(w.owner_name || '').toString().replace(/"/g, '""')}"`,
        `"${(w.phone || '').toString().replace(/"/g, '""')}"`,
        w.amount_requested || 0,
        w.fee_percent || 0,
        w.fee_amount || 0,
        w.amount_after_fee || 0,
        `"${(w.bank_name || '').toString().replace(/"/g, '""')}"`,
        `"${(w.bank_account_number || '').toString().replace(/"/g, '""')}"`,
        `"${(w.bank_ifsc || '').toString().replace(/"/g, '""')}"`,
        `"${(w.status || '').toString().replace(/"/g, '""')}"`,
        `"${(w.settlement_date || '').toString().replace(/"/g, '""')}"`,
        `"${(w.created_at || '').toString().replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Withdrawals_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allWds.length} withdrawals successfully!`);
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to download Excel');
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">🏦 Withdrawal Requests</h1>
        <button onClick={downloadExcel} className="btn-primary flex items-center gap-2">
          <span>📥</span> Export to Excel
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[['pending','⏳ Pending'],['approved','✅ Approved'],['completed','🎉 Completed'],['rejected','❌ Rejected'],['','📋 All']].map(([v,l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border-2 transition-all ${status===v?'border-orange-500 bg-orange-500 text-white':'border-slate-200 text-slate-600 hover:border-orange-300'}`}>
            {l}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500">{total} requests</p>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-200 rounded-xl animate-pulse"/>)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><div className="text-5xl mb-3">🏦</div><p>No withdrawals</p></div>
      ) : (
        <div className="space-y-3">
          {items.map(w => (
            <div key={w.id} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">{w.business_name}</p>
                  <p className="text-sm text-slate-500">{w.owner_name} • {w.phone}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <div><span className="text-slate-400">Requested: </span><span className="font-semibold">₹{Number(w.amount_requested).toFixed(2)}</span></div>
                    <div><span className="text-slate-400">Fee ({w.fee_percent}%): </span><span className="text-red-500">₹{Number(w.fee_amount).toFixed(2)}</span></div>
                    <div><span className="text-slate-400">Net: </span><span className="font-bold text-green-600">₹{Number(w.amount_after_fee).toFixed(2)}</span></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Bank: {w.bank_name} • {w.bank_account_number} • {w.bank_ifsc}</p>
                  {w.settlement_date && <p className="text-xs text-blue-500 mt-1">Settlement: {format(new Date(w.settlement_date),'dd MMM yyyy')}</p>}
                </div>
                <span className={`badge ${STATUS_COLOR[w.status]||'badge-info'} flex-shrink-0`}>{w.status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">{w.created_at ? format(new Date(w.created_at),'dd MMM yyyy, hh:mm a') : ''}</p>

              {w.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => doAction('approve', w.id)} className="flex-1 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-200">✅ Approve</button>
                  <button onClick={() => setModal({type:'reject', wdId:w.id, amount:w.amount_requested})} className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200">❌ Reject</button>
                </div>
              )}
              {w.status === 'approved' && (
                <button onClick={() => doAction('complete', w.id)} className="w-full mt-3 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-200">🏦 Mark as Completed</button>
              )}
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'reject' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm slide-up">
            <h3 className="font-bold text-lg mb-2">Reject Withdrawal</h3>
            <p className="text-slate-500 mb-3 text-sm">Amount ₹{modal.amount} will be refunded</p>
            <textarea className="input-field mb-4 h-24 resize-none" placeholder="Rejection reason..." value={form.reason||''} onChange={e=>setForm(f=>({...f,reason:e.target.value}))}/>
            <div className="flex gap-3">
              <button onClick={() => doAction('reject', modal.wdId, {reason:form.reason})} className="btn-primary flex-1 bg-red-500">Reject & Refund</button>
              <button onClick={() => {setModal(null);setForm({});}} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
