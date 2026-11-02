import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getReferrals } from '../../services/api';
import { format } from 'date-fns';

export default function UserReferral() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReferrals().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  function copyCode() {
    navigator.clipboard.writeText(data?.referral_code || '');
    toast.success('Referral code copied!');
  }
  function copyLink() {
    navigator.clipboard.writeText(data?.share_link || '');
    toast.success('Share link copied!');
  }
  function shareWhatsApp() {
    const msg = encodeURIComponent(`Join Japsan Pay and earn rewards! Use my referral code: ${data?.referral_code}\n${data?.share_link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  const stats = data?.stats || {};
  const cfg   = data?.rewards_config || {};

  return (
    <div className="p-4 space-y-4 fade-in">
      <h2 className="text-xl font-bold text-slate-800">👥 Refer & Earn</h2>

      {/* Referral Code Card */}
      <div className="coin-card p-6 text-white">
        <p className="text-slate-400 text-sm mb-2">Your Referral Code</p>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-3xl font-black tracking-widest text-yellow-400">{data?.referral_code}</p>
          <button onClick={copyCode} className="bg-white/20 hover:bg-white/30 rounded-xl px-3 py-1 text-sm font-medium transition-all">Copy</button>
        </div>
        <div className="flex gap-3">
          <button onClick={copyLink} className="flex-1 bg-white/10 hover:bg-white/20 rounded-xl py-2 text-sm font-medium transition-all">📋 Copy Link</button>
          <button onClick={shareWhatsApp} className="flex-1 bg-green-500/80 hover:bg-green-500 rounded-xl py-2 text-sm font-medium transition-all">💬 Share on WhatsApp</button>
        </div>
      </div>

      {/* Rewards info */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <p className="font-bold text-slate-800 mb-3">🎁 Reward Structure</p>
        <div className="space-y-2">
          {[
            {label:'You invite a friend (User)', coins: cfg.user_user || 50},
            {label:'You invite a customer (Vendor)', coins: cfg.vendor_user || 100},
          ].map(({label,coins}) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-600">{label}</span>
              <span className="font-bold text-orange-500">+{coins} 🪙</span>
            </div>
          ))}
          <p className="text-xs text-slate-400 mt-2">* Coins are locked for {cfg.lock_days} days. Unlock when referred user makes first transaction.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {label:'Total Referrals', value: stats.total_referrals || 0, color:'text-blue-600'},
          {label:'Coins Earned',    value: Number(stats.total_earned||0).toLocaleString(), color:'text-orange-500'},
          {label:'Unlocked',        value: stats.total_unlocked || 0, color:'text-green-600'},
        ].map(({label,value,color}) => (
          <div key={label} className="stat-card p-3 text-center">
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Referral List */}
      {data?.referrals?.length > 0 && (
        <div>
          <h3 className="font-bold text-slate-800 mb-3">Your Referrals</h3>
          <div className="space-y-2">
            {data.referrals.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 border border-slate-100">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-sm">👤</div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-slate-800">{r.referred_name || 'User'}</p>
                  <p className="text-xs text-slate-400">{r.created_at ? format(new Date(r.created_at),'dd MMM yyyy') : ''}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-orange-500">+{Number(r.coins_earned).toLocaleString()} 🪙</p>
                  <span className={`badge ${r.is_unlocked ? 'badge-success' : 'badge-warning'} text-xs`}>{r.is_unlocked ? 'Unlocked' : 'Locked'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
