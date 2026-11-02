import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getWithdrawals, requestWithdraw, getWallet } from '../../services/api';
import { format } from 'date-fns';

const STATUS_COLORS = { pending:'badge-warning', approved:'badge-info', processing:'badge-info', completed:'badge-success', rejected:'badge-danger' };

export default function VendorWithdraw() {
  const [wallet, setWallet]     = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig]     = useState({});

  useEffect(() => {
    Promise.all([getWallet(), getWithdrawals()]).then(([wRes, wdRes]) => {
      setWallet(wRes.data.data?.wallet);
      setWithdrawals(wdRes.data.data?.withdrawals || []);
      setConfig({ fee: wRes.data.data?.withdrawal_fee, min: wRes.data.data?.min_withdrawal });
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const amt      = parseFloat(amount) || 0;
  const fee      = config.fee || 5;
  const feeAmt   = (amt * fee / 100).toFixed(2);
  const netAmt   = Math.max(0, amt - parseFloat(feeAmt)).toFixed(2);

  async function handleSubmit() {
    const min = config.min || 100;
    if (!amt || amt < min) return toast.error(`Minimum withdrawal is ₹${min}`);
    if (amt > (wallet?.cash_wallet_balance || 0)) return toast.error('Insufficient wallet balance');
    setSubmitting(true);
    try {
      await requestWithdraw({ amount: amt });
      toast.success('Withdrawal request submitted!');
      setAmount('');
      const [wRes, wdRes] = await Promise.all([getWallet(), getWithdrawals()]);
      setWallet(wRes.data.data?.wallet);
      setWithdrawals(wdRes.data.data?.withdrawals || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  }

  if (loading) return <div className="p-6 space-y-4">{[1,2].map(i=><div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  return (
    <div className="p-4 space-y-4 fade-in">
      <h2 className="text-xl font-bold text-slate-800">🏦 Withdraw to Bank</h2>

      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <p className="text-sm text-slate-500">Available Cash Balance</p>
        <p className="text-3xl font-black text-green-600">₹{Number(wallet?.cash_wallet_balance||0).toFixed(2)}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Withdrawal Amount (₹)</label>
          <input className="input-field text-xl font-bold" type="number" placeholder={`Min ₹${config.min||100}`} min={config.min||100}
            value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>

        {amt > 0 && (
          <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-medium">₹{amt.toFixed(2)}</span></div>
            <div className="flex justify-between text-red-500"><span>Fee ({fee}%)</span><span>-₹{feeAmt}</span></div>
            <div className="flex justify-between font-bold border-t border-slate-200 pt-2"><span>You Receive</span><span className="text-green-600">₹{netAmt}</span></div>
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          Settlement in {3} business days after approval
        </div>

        <button onClick={handleSubmit} disabled={submitting||!amt||amt>wallet?.cash_wallet_balance}
          className="btn-primary w-full disabled:opacity-50">
          {submitting ? '⏳ Processing...' : '✅ Submit Withdrawal Request'}
        </button>
      </div>

      {/* History */}
      {withdrawals.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 mb-3">Withdrawal History</h3>
          <div className="space-y-2">
            {withdrawals.map(w => (
              <div key={w.id} className="bg-white rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-800">₹{Number(w.amount_requested).toFixed(2)}</p>
                    <p className="text-xs text-slate-400">Net: ₹{Number(w.amount_after_fee).toFixed(2)} after {Number(w.fee_percent)}% fee</p>
                    {w.settlement_date && <p className="text-xs text-slate-400">Settlement: {format(new Date(w.settlement_date),'dd MMM yyyy')}</p>}
                  </div>
                  <span className={`badge ${STATUS_COLORS[w.status]||'badge-info'}`}>{w.status}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{w.created_at ? format(new Date(w.created_at),'dd MMM yyyy, hh:mm a') : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
