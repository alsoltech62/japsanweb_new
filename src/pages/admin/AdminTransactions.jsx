import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { format } from 'date-fns';

const TX_COLORS = { completed:'badge-success', pending:'badge-warning', failed:'badge-danger', reversed:'badge-info', cancelled:'badge-danger' };

export default function AdminTransactions() {
  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType]     = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    load();
  }, [search, type, page]);

  function load() {
    setLoading(true);
    api.get('/admin/transactions.php', { params: { search, type, page, limit } })
      .then(r => { setItems(r.data.data?.transactions || []); setTotal(r.data.data?.total || 0); })
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false));
  }

  async function downloadExcel() {
    try {
      const toastId = toast.loading('Generating Excel...');
      const r = await api.get('/admin/transactions.php', { params: { search, type, page: 1, limit: 100000 } });
      const allTxs = r.data.data?.transactions || [];
      toast.dismiss(toastId);
      if (!allTxs.length) return toast.error('No transactions found to download');

      const headers = ['ID', 'Reference', 'Type', 'User', 'User Phone', 'Vendor', 'Vendor Phone', 'Coins', 'INR Amount', 'Profit', 'Status', 'Date'];
      const rows = allTxs.map(t => [
        t.id,
        `"${(t.transaction_ref || '').toString().replace(/"/g, '""')}"`,
        `"${(t.type || '').toString().replace(/"/g, '""')}"`,
        `"${(t.user_name || '').toString().replace(/"/g, '""')}"`,
        `"${(t.user_phone || '').toString().replace(/"/g, '""')}"`,
        `"${(t.vendor_name || '').toString().replace(/"/g, '""')}"`,
        `"${(t.vendor_phone || '').toString().replace(/"/g, '""')}"`,
        t.coins_amount || 0,
        t.amount_inr || 0,
        t.platform_profit || 0,
        `"${(t.status || '').toString().replace(/"/g, '""')}"`,
        `"${(t.created_at || '').toString().replace(/"/g, '""')}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Transactions_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allTxs.length} transactions successfully!`);
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to download Excel');
    }
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">📋 All Transactions</h1>
        <button onClick={downloadExcel} className="btn-primary flex items-center gap-2">
          <span>📥</span> Export to Excel
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input-field flex-1" placeholder="Search ref, user, phone, vendor..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        <select className="input-field w-auto" value={type} onChange={e=>{setType(e.target.value);setPage(1);}}>
          <option value="">All Types</option>
          {['coin_purchase','coin_redemption','cashback','referral_reward','withdrawal','payment','admin_credit','admin_debit','coin_expiry'].map(t=>(
            <option key={t} value={t}>{t.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-slate-500">{total} transactions</p>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-14 bg-slate-200 rounded-xl animate-pulse"/>)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400"><div className="text-5xl mb-3">📋</div><p>No transactions</p></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>{['Ref','Type','User','Vendor','Coins','INR','Profit','Status','Date'].map(h=><th key={h} className="px-3 py-3 font-semibold whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {items.map(t => (
                  <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{t.transaction_ref}</td>
                    <td className="px-3 py-2 text-xs font-medium text-slate-700 whitespace-nowrap">{t.type?.replace(/_/g,' ')}</td>
                    <td className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">
                      {t.user_name ? (
                        <div>
                          <span className="font-semibold text-slate-800">{t.user_name}</span>
                          {t.user_phone && <span className="text-slate-400 block text-[11px]">📞 {t.user_phone}</span>}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">
                      {t.vendor_name ? (
                        <div>
                          <span className="font-semibold text-slate-800">{t.vendor_name}</span>
                          {t.vendor_phone && <span className="text-slate-400 block text-[11px]">📞 {t.vendor_phone}</span>}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 font-semibold text-orange-500 whitespace-nowrap">{t.coins_amount>0?Number(t.coins_amount).toLocaleString()+' 🪙':'—'}</td>
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{t.amount_inr>0?`₹${Number(t.amount_inr).toFixed(2)}`:'—'}</td>
                    <td className="px-3 py-2 text-green-600 whitespace-nowrap">{t.platform_profit>0?`₹${Number(t.platform_profit).toFixed(2)}`:'—'}</td>
                    <td className="px-3 py-2"><span className={`badge ${TX_COLORS[t.status]||'badge-info'}`}>{t.status}</span></td>
                    <td className="px-3 py-2 text-xs text-slate-400 whitespace-nowrap">{t.created_at?format(new Date(t.created_at),'dd MMM, hh:mm a'):''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-slate-600">Page {page} of {Math.ceil(total/limit)}</span>
          <button onClick={() => setPage(p=>p+1)} disabled={page>=Math.ceil(total/limit)} className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
