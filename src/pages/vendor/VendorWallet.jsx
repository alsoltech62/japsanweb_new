import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getWallet } from '../../services/api';
import TransactionList from '../../components/common/TransactionList';
import { useNavigate } from 'react-router-dom';

export default function VendorWallet() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    getWallet().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  const w = data?.wallet || {};
  return (
    <div className="p-4 space-y-4 fade-in">
      <h2 className="text-xl font-bold text-slate-800">💼 Vendor Wallet</h2>

      <div className="bg-slate-800 text-white rounded-2xl overflow-hidden shadow-lg border border-slate-700">
        <div className="p-4 bg-slate-900 border-b border-slate-700 text-center font-bold text-lg">
          My Wallets
        </div>
        
        {/* Main Wallet */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl">💳</div>
            <div>
              <p className="font-bold">Main Wallet (JC)</p>
              <p className="text-xs text-green-400">Withdrawable (Purchased JC)</p>
            </div>
          </div>
          <p className="font-bold text-blue-400">{data?.multi_wallet?.main_wallet || 0} JC</p>
        </div>

        {/* Vendor Settlement Wallet */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl">🏪</div>
            <div>
              <p className="font-bold">Vendor Settlement Wallet</p>
              <p className="text-xs text-green-400">Withdrawable (Purchased JC)</p>
            </div>
          </div>
          <p className="font-bold text-orange-400">{data?.multi_wallet?.vendor_settlement_wallet || 0} JC</p>
        </div>

        {/* Referral Wallet */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xl">👥</div>
            <div>
              <p className="font-bold">Referral Reward Wallet</p>
              <p className="text-xs text-red-400">Non-Withdrawable</p>
            </div>
          </div>
          <p className="font-bold text-green-400">{data?.multi_wallet?.referral_wallet || 0} JC</p>
        </div>

        {/* Total Balance */}
        <div className="p-4 bg-slate-900 flex justify-between items-center">
          <p className="font-bold">Total Balance (All Wallets)</p>
          <p className="font-bold text-lg">{data?.multi_wallet?.total_balance || 0} JC</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <p className="text-xs text-slate-400">Cash Wallet <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full ml-2" title="This is your reimbursement for the coin discounts used by your customers. You can withdraw this to your bank.">ℹ️ Reimbursements</span></p>
          <p className="text-2xl font-black text-green-600">₹{Number(w.cash_wallet_balance||0).toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label:'Total Revenue',      value:`₹${Number(w.total_revenue_generated||0).toLocaleString('en-IN')}` },
          { label:'Coins Distributed',  value:`${Number(w.total_coins_distributed||0).toLocaleString()} 🪙` },
        ].map(({label,value}) => (
          <div key={label} className="stat-card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {data?.pending_withdrawals?.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="font-semibold text-amber-800 text-sm">⏳ Pending Withdrawal Requests</p>
          {data.pending_withdrawals.map(r => (
            <div key={r.id} className="flex justify-between mt-2 text-sm text-amber-700">
              <span>₹{r.amount_requested}</span><span className="badge badge-warning">{r.status}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button onClick={() => navigate('/vendor/withdraw')} className="btn-primary flex-1">🏦 Withdraw to Bank</button>
        <button onClick={() => navigate('/vendor/buy-coins')} className="btn-secondary flex-1 bg-orange-100 text-orange-700 hover:bg-orange-200">🛒 Buy Coins</button>
      </div>

      <div>
        <h3 className="font-bold text-slate-800 mb-3">Transaction History</h3>
        <TransactionList transactions={data?.transactions || []} />
      </div>
    </div>
  );
}
