import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getWallet, getActiveBanners, getNotifications, getDailyRewardStatus } from '../../services/api';
import CoinBalance from '../../components/common/CoinBalance';
import TransactionList from '../../components/common/TransactionList';
import DailyRewardModal from '../../components/user/DailyRewardModal';
import { useAuth } from '../../context/AuthContext';
import { FiShoppingCart, FiMaximize, FiMapPin, FiUsers, FiGlobe, FiClock, FiBell, FiX, FiGift, FiCheck } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import banner1 from '../../../assets/ba1.jpeg';
import banner2 from '../../../assets/ba2.jpeg';
import banner3 from '../../../assets/ba3.jpeg';

export default function UserDashboard() {
  const [data, setData]       = useState(null);
  const [banners, setBanners] = useState([]);
  const [latestNotif, setLatestNotif] = useState(null);
  const [showNotifAlert, setShowNotifAlert] = useState(true);
  const [dailyRewardData, setDailyRewardData] = useState(null);
  const [showDailyRewardModal, setShowDailyRewardModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user }              = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      getWallet().then(r => setData(r.data.data)),
      getActiveBanners('user').then(r => {
        if (r.data?.success && r.data?.data?.banners?.length > 0) {
          setBanners(r.data.data.banners);
        }
      }),
      getNotifications({ limit: 1 }).then(r => {
        if (r.data?.success && r.data?.data?.notifications?.length > 0) {
          const first = r.data.data.notifications[0];
          if (!first.is_read) {
            setLatestNotif(first);
          }
        }
      }),
      getDailyRewardStatus().then(r => {
        if (r.data?.success && r.data?.data?.feature_enabled) {
          const rewardStatus = r.data.data;
          setDailyRewardData(rewardStatus);
          // Show popup automatically if user hasn't claimed today
          if (rewardStatus.can_claim) {
            setShowDailyRewardModal(true);
          }
        }
      })
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-6 space-y-6">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl animate-pulse"/>)}
    </div>
  );

  const defaultBanners = [
    { id: 'def1', image_url: banner1, title: 'Offer 1' },
    { id: 'def2', image_url: banner2, title: 'Offer 2' },
    { id: 'def3', image_url: banner3, title: 'Offer 3' },
  ];
  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  const w = data?.wallet || {};
  return (
    <div className="min-h-screen bg-slate-50 pb-24 fade-in font-sans">
      <div className="px-4 pt-4 pb-6 space-y-6">
        
        {/* Top Dismissible Notification Alert */}
        {latestNotif && showNotifAlert && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-3.5 shadow-sm flex items-center justify-between gap-3 slide-up">
            <div 
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => navigate('/notifications')}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FiBell className="text-sm animate-bounce" />
              </div>
              <div className="truncate">
                <p className="font-bold text-xs text-amber-900 truncate">{latestNotif.title || 'New Notification'}</p>
                <p className="text-[11px] text-amber-700 truncate">{latestNotif.message?.replace(/\[IMG:.+?\]/, '')}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowNotifAlert(false)} 
              className="text-amber-800 hover:text-amber-950 p-1.5 rounded-full hover:bg-amber-100/50 transition"
              title="Close"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        )}
        
        {/* Daily Login Rewards Streak Banner */}
        {dailyRewardData && dailyRewardData.feature_enabled && (
          <div 
            onClick={() => setShowDailyRewardModal(true)}
            className="cursor-pointer bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between gap-3 hover:brightness-105 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <FiGift className="text-xl text-yellow-200 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-yellow-100">🎁 Roj Open Karo Rewards</span>
                  <span className="bg-black/20 text-yellow-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <FaFire className="text-xs" /> Day {dailyRewardData.today_day}/7
                  </span>
                </div>
                <p className="text-xs text-white/90">
                  {dailyRewardData.can_claim 
                    ? `Aaj ka Day ${dailyRewardData.today_day} claim karein (+${dailyRewardData.today_coins} JC)!` 
                    : `Aaj ka check-in ho chuka hai! Kal agla reward paane ke liye open karein.`}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="bg-white text-orange-600 font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm">
                {dailyRewardData.can_claim ? 'Claim' : 'View'}
              </span>
            </div>
          </div>
        )}

        {/* Spin & Win Promo Card */}
        <div 
          onClick={() => navigate('/user/spin-win')}
          className="cursor-pointer bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/40 rounded-2xl p-3.5 text-white shadow-md flex items-center justify-between gap-3 hover:brightness-105 transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 text-xl shadow-md">
              🎰
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-yellow-300">SPIN & WIN</span>
                <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/40 animate-pulse">
                  1 FREE SPIN
                </span>
              </div>
              <p className="text-xs text-slate-300">
                हर दिन जीतने का मौका! 2X Coins, Jackpot & Extra Coins पाएं
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1">
              Spin Now
            </span>
          </div>
        </div>

        {/* Total Wallet Balance Card */}
        <div className="relative group cursor-pointer overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg text-white" onClick={() => navigate('/user/wallet')}>
          <div className="absolute -right-4 -top-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium text-sm">Total Wallet Balance</span>
                <span className="text-slate-400">👁️</span>
              </div>
              <img src="/JapSan.png" alt="Coins" className="w-12 h-12 absolute right-0 top-6 opacity-90 object-contain drop-shadow-md" />
            </div>
            
            <h2 className="text-3xl font-black mb-1">{Number(w.coin_balance || 0).toLocaleString()} <span className="text-orange-400 text-2xl">JC</span></h2>
            <p className="text-slate-400 text-xs font-medium mb-6">≈ ₹{((w.coin_balance || 0) * (data?.redemption_rate || 0.7)).toFixed(2)}</p>
            
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium text-white transition-colors">
              Wallet Details &gt;
            </button>
          </div>
        </div>

        {/* Promo Banner Carousel */}
        <div className="mt-6 mb-2 -mx-4 px-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar">
          <div className="flex gap-4 pb-2 w-max">
            {displayBanners.map((b, idx) => (
              <div
                key={b.id || idx}
                onClick={() => {
                  if (b.target_url) {
                    if (b.target_url.startsWith('http')) window.open(b.target_url, '_blank');
                    else navigate(b.target_url);
                  }
                }}
                className={`w-[85vw] sm:w-[400px] md:w-[600px] snap-center shrink-0 rounded-[24px] overflow-hidden shadow-sm border border-slate-200 ${b.target_url ? 'cursor-pointer hover:opacity-95 transition' : ''}`}
              >
                <img 
                  src={b.full_image_url || b.image_url} 
                  alt={b.title || `Promo ${idx+1}`} 
                  className="w-full h-32 md:h-48 object-cover" 
                  onError={(e) => { 
                    e.currentTarget.src = defaultBanners[idx % defaultBanners.length].image_url; 
                  }} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Primary Actions Row */}
        <div className="flex justify-between items-start px-2">
          {[
            { icon: <FiShoppingCart size={20}/>, label: 'Buy Coins', to: '/user/buy-coins', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
            { icon: <FiUsers size={20}/>, label: 'Send JC', to: '/user/scan-pay', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
            { icon: <FiMaximize size={20}/>, label: 'Scan & Pay', to: '/user/scan-pay', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
            { icon: <FiGlobe size={20}/>, label: 'Request', to: '/user/wallet', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => navigate(item.to)}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${item.bg} ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-semibold text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Wealth & Investments Section (SIP, FD, RD) */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">Wealth & High-Yield Investments</h3>
            <span className="text-[11px] text-orange-600 font-bold">Up to 18% p.a.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* SIP Card */}
            <div 
              onClick={() => navigate('/user/sip')}
              className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 text-white shadow-md cursor-pointer hover:opacity-95 transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xl">📈</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-extrabold uppercase">Daily/Monthly</span>
              </div>
              <h4 className="font-extrabold text-sm leading-tight">SIP Plans</h4>
              <p className="text-[10px] text-orange-100 mt-1">Start micro-investing from ₹50 with Razorpay</p>
            </div>

            {/* FD & RD Card */}
            <div 
              onClick={() => navigate('/user/fd-rd')}
              className="bg-gradient-to-br from-sky-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md cursor-pointer hover:opacity-95 transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xl">🔒</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-extrabold uppercase">Guaranteed</span>
              </div>
              <h4 className="font-extrabold text-sm leading-tight">FD & RD Deposits</h4>
              <p className="text-[10px] text-sky-100 mt-1">Earn fixed interest up to 15% p.a. safely</p>
            </div>
          </div>
        </div>

        {/* Promo Banner */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-[20px] p-4 flex items-center justify-between border border-orange-200">
          <div className="flex-1 pr-2">
            <h3 className="font-bold text-slate-800 text-sm mb-1">Invite & Earn More</h3>
            <p className="text-[10px] text-slate-600 mb-3 leading-tight">Refer your friends and earn Unlimited JC Rewards</p>
            <button onClick={() => navigate('/user/referral')} className="bg-slate-900 text-white text-[10px] font-bold px-4 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              Invite Now
            </button>
          </div>
          <div className="text-4xl">🎁</div>
        </div>

        {/* Quick Access Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Access</h3>
          <div className="grid grid-cols-4 gap-y-4">
            {[
              { icon: '📈', label: 'SIP Plans', to: '/user/sip' },
              { icon: '🔒', label: 'FD & RD', to: '/user/fd-rd' },
              { icon: '🏪', label: 'Nearby Stores', to: '/user/nearby' },
              { icon: '🏷️', label: 'Hot Offers', to: '/user/offers' },
              { icon: '👥', label: 'My Network', to: '/user/network' },
              { icon: '📄', label: 'Transactions', to: '/user/wallet' },
              { icon: '🎁', label: 'Rewards', to: '/user/referral' },
              { icon: '🛡️', label: 'KYC', to: '/user/profile' }
            ].map((item, idx) => (
              <div key={idx} onClick={() => navigate(item.to)} className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                <div className="text-xl mb-1 text-slate-700">{item.icon}</div>
                <span className="text-[10px] font-medium text-slate-600 text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Performance */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-800">My Performance</h3>
            <span className="text-xs text-slate-500 cursor-pointer">This Month ⌵</span>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500">👥</span>
                <span className="text-xs font-semibold text-slate-700">Team Business</span>
              </div>
              <span className="text-xs font-bold text-slate-800">₹{Number(w.total_revenue_generated||0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">🔗</span>
                <span className="text-xs font-semibold text-slate-700">Total Referrals</span>
              </div>
              <span className="text-xs font-bold text-orange-500">{Number(w.total_coins_earned||0).toLocaleString()} JC</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
            <button onClick={() => navigate('/user/wallet')} className="text-slate-900 text-xs font-bold">View All</button>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
            <TransactionList transactions={data?.transactions?.slice(0,4) || []} />
          </div>
        </div>

      </div>

      {/* Daily Reward Modal Popup */}
      {showDailyRewardModal && dailyRewardData && (
        <DailyRewardModal 
          statusData={dailyRewardData}
          onClose={() => setShowDailyRewardModal(false)}
          onRewardClaimed={() => {
            getWallet().then(r => { if (r.data?.data) setData(r.data.data); });
            getDailyRewardStatus().then(r => { if (r.data?.success) setDailyRewardData(r.data.data); });
          }}
        />
      )}
    </div>
  );
}
