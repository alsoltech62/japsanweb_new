import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getWallet } from '../../services/api';
import CoinBalance from '../../components/common/CoinBalance';
import TransactionList from '../../components/common/TransactionList';

export default function UserWallet() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    getWallet().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  const w  = data?.wallet || {};
  const txs = (data?.transactions || []).filter(t => filter === 'all' || t.type === filter);

  return (
    <div className="p-4 space-y-4 fade-in">
      <h2 className="text-xl font-bold text-slate-800">💳 My Wallet</h2>
      <CoinBalance coins={w.coin_balance} locked={w.locked_coin_balance} rate={data?.redemption_rate||0.7}/>

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

        {/* 90 Days Lock */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl">🔒</div>
            <div>
              <p className="font-bold">90 Days Lock Wallet</p>
              <p className="text-xs text-red-400">Non-Withdrawable</p>
            </div>
          </div>
          <p className="font-bold text-orange-400">{data?.multi_wallet?.lock_90d_wallet || 0} JC</p>
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

        {/* Cashback Wallet */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl">🎁</div>
            <div>
              <p className="font-bold">Cashback Wallet</p>
              <p className="text-xs text-red-400">Non-Withdrawable</p>
            </div>
          </div>
          <p className="font-bold text-purple-400">{data?.multi_wallet?.cashback_wallet || 0} JC</p>
        </div>

        {/* Bonus Wallet */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl">⭐</div>
            <div>
              <p className="font-bold">Bonus Wallet</p>
              <p className="text-xs text-red-400">Non-Withdrawable</p>
            </div>
          </div>
          <p className="font-bold text-amber-400">{data?.multi_wallet?.bonus_wallet || 0} JC</p>
        </div>

        {/* Level Income */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xl">🔗</div>
            <div>
              <p className="font-bold">Level Income Wallet</p>
              <p className="text-xs text-red-400">Non-Withdrawable</p>
            </div>
          </div>
          <p className="font-bold text-red-400">{data?.multi_wallet?.level_income_wallet || 0} JC</p>
        </div>

        {/* Total Balance */}
        <div className="p-4 bg-slate-900 flex justify-between items-center">
          <p className="font-bold">Total Balance (All Wallets)</p>
          <p className="font-bold text-lg">{data?.multi_wallet?.total_balance || 0} JC</p>
        </div>
      </div>
      
      {data?.vendor_locked_coins?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mt-4">
          <h3 className="font-bold text-slate-800 mb-3">Vendor Wise Locked Coins (90 Days)</h3>
          <div className="space-y-3">
            {data.vendor_locked_coins.map((vc, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">🏪</div>
                  <div>
                    <p className="font-bold text-slate-800">{vc.business_name || 'Vendor'}</p>
                    <p className="text-xs text-slate-500">Use only at this vendor</p>
                  </div>
                </div>
                <p className="font-bold text-orange-600">{vc.locked_amount} JC</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.expiring_coins_30d > 0 && (
        <div className="bg-red-50 rounded-2xl p-4 flex gap-3 items-center border border-red-100">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-semibold text-red-800 text-sm">{Number(data.expiring_coins_30d).toLocaleString()} coins expiring in 30 days!</p>
            <p className="text-xs text-red-600">Use them before they expire to avoid losing value</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[['all','All'],['payment','Payments'],['cashback','Cashback'],['coin_purchase','Purchases'],['referral_reward','Referrals']].map(([val,label])=>(
          <button key={val} onClick={()=>setFilter(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filter===val?'bg-orange-500 text-white shadow':'bg-white text-slate-600 border border-slate-200 hover:border-orange-300'}`}>
            {label}
          </button>
        ))}
      </div>

      <TransactionList transactions={txs} emptyMessage="No transactions for this filter"/>
    </div>
  );
}
