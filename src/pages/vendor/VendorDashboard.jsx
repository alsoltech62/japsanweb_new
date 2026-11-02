import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getWallet, getNotifications, getActiveBanners } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiBell, FiX, FiChevronRight, FiPackage } from 'react-icons/fi';
import banner1 from '../../../assets/ba1.jpeg';
import banner2 from '../../../assets/ba2.jpeg';
import banner3 from '../../../assets/ba3.jpeg';

export default function VendorDashboard() {
  const [data, setData]       = useState(null);
  const [banners, setBanners] = useState([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [latestNotif, setLatestNotif] = useState(null);
  const [showNotifAlert, setShowNotifAlert] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user }              = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    Promise.allSettled([
      getWallet().then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')),
      getActiveBanners('vendor').then(r => {
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
      })
    ]).finally(() => setLoading(false));
  }, []);

  // Auto scroll banners
  useEffect(() => {
    const total = banners.length > 0 ? banners.length : 3;
    if (total <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx(prev => (prev + 1) % total);
    }, 4500);
    return () => clearInterval(interval);
  }, [banners]);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  const defaultBanners = [
    { id: 'def1', image_url: banner1, title: 'Vendor Growth Program' },
    { id: 'def2', image_url: banner2, title: 'Instant Coin Settlements' },
    { id: 'def3', image_url: banner3, title: 'Boost Customer Visits' },
  ];
  const displayBanners = banners.length > 0 ? banners : defaultBanners;

  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) return url;
    return `https://japsanpay.com/backend${url.startsWith('/') ? '' : '/'}${url}`;
  };

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
        
        {/* Total Wallet Balance Card */}
        <div className="relative group cursor-pointer overflow-hidden rounded-[24px] bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg text-white" onClick={() => navigate('/vendor/wallet')}>
          <div className="absolute -right-4 -top-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium text-sm">Total Wallet Balance</span>
                <span className="text-slate-400">👁️</span>
              </div>
              <img src="/JapSan.png" alt="Coins" className="w-12 h-12 absolute right-0 top-6 opacity-90 object-contain drop-shadow-md" />
            </div>
            
            <h2 className="text-3xl font-black mb-1">
              {Number(w.coin_balance || 0).toLocaleString()} <span className="text-orange-400 text-2xl">JC</span>
              <span className="text-xs font-bold text-amber-300 ml-2">≈ ₹{Number(w.coin_inr_value || w.coin_balance || 0).toLocaleString('en-IN')}</span>
            </h2>
            <div className="flex items-center gap-2 mb-6">
              <p className="text-slate-400 text-xs font-medium">Cash Wallet: ₹{Number(w.cash_wallet_balance || 0).toFixed(2)}</p>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700" title="This is your reimbursement for the coin discounts used by your customers. You can withdraw this to your bank.">ℹ️ Coin Reimbursements</span>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/vendor/buy-coins'); }} 
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full px-4 py-1.5 text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <span>🪙</span> Buy Coins
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); navigate('/vendor/wallet'); }} 
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium text-white transition-colors"
              >
                Wallet Details &gt;
              </button>
            </div>
          </div>
        </div>

        {/* KYC Status */}
        {w.kyc_status !== 'approved' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-[20px] p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl shrink-0">⚠️</div>
            <div>
              <p className="font-bold text-orange-800 text-sm">KYC {w.kyc_status}</p>
              <p className="text-[10px] text-orange-600/80 leading-tight">Your KYC is under review. Please wait for approval.</p>
            </div>
          </div>
        )}

        {/* Dynamic Vendor Banners Carousel */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-slate-800">Special Updates & Offers</h3>
            <div className="flex gap-1.5">
              {displayBanners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBannerIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeBannerIdx === i ? 'w-5 bg-orange-500' : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-100 aspect-[21/9] bg-slate-100">
            {displayBanners.map((banner, index) => (
              <div
                key={banner.id || index}
                onClick={() => {
                  if (banner.target_url) {
                    if (banner.target_url.startsWith('http')) window.open(banner.target_url, '_blank');
                    else navigate(banner.target_url);
                  }
                }}
                className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${
                  activeBannerIdx === index ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={formatImageUrl(banner.image_url)}
                  alt={banner.title || 'Vendor Banner'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = banner1; }}
                />
                {banner.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 text-white">
                    <p className="text-xs font-bold truncate drop-shadow">{banner.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Physical QR Order Highlight Card */}
        <div 
          onClick={() => navigate('/vendor/qr')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-4 text-white shadow-md cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
                📦
              </div>
              <div>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Deliver to your shop
                </span>
                <h4 className="font-black text-sm mt-0.5">Order Physical QR Kit</h4>
                <p className="text-[11px] text-amber-100">2 Waterproof Stickers + 1 Acrylic Standee for 50 JC</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform shadow">
              <FiChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Quick Access Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Access</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '📦', label:'Order QR Kit', to:'/vendor/qr' },
              { icon: '🪙', label:'Buy Coins', to:'/vendor/buy-coins' },
              { icon: '🚀', label:'Boost Ad', to:'/vendor/advertising' },
              { icon: '💳', label:'Bill Customer', to:'/vendor/payment' },
              { icon: '📱', label:'Show QR', to:'/vendor/qr' },
              { icon: '🎁', label:'Offers',  to:'/vendor/offers' },
              { icon: '🏦', label:'Withdraw',to:'/vendor/withdraw' },
              { icon: '⚙️', label:'Rewards', to:'/vendor/reward-settings' },
              { icon: '📢', label:'Campaign',to:'/vendor/campaigns' },
              { icon: '👤', label:'Profile', to:'/vendor/profile' }
            ].map((item, idx) => (
              <div key={idx} onClick={() => navigate(item.to)} className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-transform">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl mb-1 text-slate-700">{item.icon}</div>
                <span className="text-[10px] font-semibold text-slate-600 text-center">{item.label}</span>
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
                <span className="text-emerald-500">📈</span>
                <span className="text-xs font-semibold text-slate-700">Total Revenue</span>
              </div>
              <span className="text-xs font-bold text-slate-800">₹{Number(w.total_revenue_generated||0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-orange-500">👥</span>
                <span className="text-xs font-semibold text-slate-700">Total Customers</span>
              </div>
              <span className="text-xs font-bold text-orange-500">{w.total_customers||0}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">🪙</span>
                <span className="text-xs font-semibold text-slate-700">Reward Given</span>
              </div>
              <span className="text-xs font-bold text-yellow-600">{Number(w.total_coins_distributed||0).toLocaleString()} JC</span>
            </div>
          </div>
        </div>

        {/* Pending Withdrawals */}
        {data?.pending_withdrawals?.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="font-semibold text-blue-800 text-sm">⏳ Pending Withdrawals</p>
            {data.pending_withdrawals.map(wd => (
              <div key={wd.id} className="mt-2 flex justify-between text-sm text-blue-700">
                <span>₹{wd.amount_requested}</span>
                <span className="badge badge-info">{wd.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
            <button onClick={() => navigate('/vendor/wallet')} className="text-slate-900 text-xs font-bold">View All</button>
          </div>
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100">
            {data?.transactions?.slice(0,5).map(tx => (
              <div key={tx.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">💳</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{tx.user_name || 'Customer'}</p>
                  <p className="text-[10px] text-slate-400">Bill: ₹{Number(tx.bill_amount||0).toFixed(0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-500">-{Number(tx.coins_amount||0).toLocaleString()} JC</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
