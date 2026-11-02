import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiSettings, FiUsers, FiGrid, FiDollarSign, FiList, FiMenu, FiX, FiLogOut, FiBell, FiImage, FiPackage, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard', icon: <FiHome size={18} />, label: 'Dashboard' },
  { to: '/admin/investments', icon: <FiTrendingUp size={18} />, label: 'Investments (SIP/FD/RD)' },
  { to: '/admin/users', icon: <FiUsers size={18} />, label: 'Users' },
  { to: '/admin/vendors', icon: <FiGrid size={18} />, label: 'Vendors' },
  { to: '/admin/qr-orders', icon: <FiPackage size={18} />, label: 'QR Orders' },
  { to: '/admin/packages', icon: <FiList size={18} />, label: 'Coin Packages' },
  { to: '/admin/banners', icon: <FiImage size={18} />, label: 'Banners' },
  { to: '/admin/withdrawals', icon: <FiDollarSign size={18} />, label: 'Withdrawals' },
  { to: '/admin/transactions', icon: <FiList size={18} />, label: 'Transactions' },
  { to: '/admin/notifications', icon: <FiBell size={18} />, label: 'Notifications' },
  { to: '/admin/spin-rewards', icon: <span className="text-base">🎰</span>, label: 'Spin & Win' },
  { to: '/admin/settings', icon: <FiSettings size={18} />, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lastNotifId, setLastNotifId] = useState(null);

  React.useEffect(() => {
    let mounted = true;
    const checkNotifs = async () => {
      try {
        const token = localStorage.getItem('japsan_token');
        if (!token) return;
        const res = await fetch('https://japsanpay.com/backend/api/notifications/list.php?unread=1&limit=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data?.notifications?.length > 0) {
          const latest = data.data.notifications[0];
          if (mounted) {
            setLastNotifId(prev => {
              if (prev !== null && prev < latest.id) {
                toast(`New Notification: ${latest.title}`, {
                  icon: '🔔',
                  duration: 5000,
                });
              }
              return latest.id;
            });
          }
        }
      } catch (e) {}
    };
    checkNotifs();
    const interval = setInterval(checkNotifs, 10000); // 10s poll
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col`}>
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/JapSan.png" alt="Logo" className="w-10 h-10 rounded-xl" />
            <div>
              <p className="font-bold text-white">Japsan Admin</p>
              <p className="text-xs text-slate-400">{user?.name}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-orange-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {icon}{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl text-sm font-medium transition-all">
            <FiLogOut size={18} />Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 lg:hidden sticky top-0 z-20">
          <button onClick={() => setOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><FiMenu size={20} /></button>
          <span className="font-bold text-slate-800">Japsan Admin</span>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
