import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getNotifications, markNotifRead } from '../../services/api';
import { format } from 'date-fns';

const TYPE_ICONS = { cashback:'🎁', expiry:'⏰', referral:'👥', withdrawal:'🏦', system:'🔔', payment:'💳', kyc:'📋', transaction:'💰' };

export default function UserNotifications() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread]   = useState(0);

  function load() {
    getNotifications({ limit:50 }).then(r => {
      setItems(r.data.data?.notifications || []);
      setUnread(r.data.data?.unread_count || 0);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    await markNotifRead({});
    setItems(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setUnread(0);
    toast.success('All notifications marked as read');
  }

  async function markOne(id) {
    await markNotifRead({ notification_id: id });
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  if (loading) return <div className="p-6 space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-16 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  return (
    <div className="p-4 space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">🔔 Notifications</h2>
        {unread > 0 && <button onClick={markAllRead} className="text-orange-500 text-sm font-medium">Mark all read</button>}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">🔔</div>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markOne(n.id)}
              className={`rounded-2xl p-4 flex gap-3 transition-all cursor-pointer ${n.is_read ? 'bg-white border border-slate-100' : 'bg-orange-50 border border-orange-200'}`}>
              <div className="text-2xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-sm ${n.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                  {!n.is_read && <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5"/>}
                </div>
                {(() => {
                  const imgMatch = n.message.match(/\[IMG:(.+?)\]/);
                  const textMessage = n.message.replace(/\[IMG:.+?\]/, '');
                  return (
                    <>
                      <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{textMessage}</p>
                      {imgMatch && imgMatch[1] && (
                        <div className="mt-2">
                          <img src={`${import.meta.env.VITE_API_URL || 'http://localhost/japsan-coin-ecosystem/japsan-coin-ecosystem/japsan-coin-ecosystem/backend'}${imgMatch[1]}`} alt="Notification" className="w-full max-h-48 object-cover rounded-xl border border-slate-200" />
                        </div>
                      )}
                    </>
                  );
                })()}
                <p className="text-xs text-slate-400 mt-2">{n.created_at ? format(new Date(n.created_at), 'dd MMM, hh:mm a') : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
