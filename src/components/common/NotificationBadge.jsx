import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell } from 'react-icons/fi';
import { getNotifications } from '../../services/api';

export default function NotificationBadge({ userType }) {
  const [count, setCount] = useState(0);
  const navigate          = useNavigate();
  const path = userType === 'user' ? '/user/notifications' : userType === 'vendor' ? '/vendor/notifications' : '/admin/notifications';

  useEffect(() => {
    getNotifications({ unread: '1', limit: 1 }).then(res => {
      setCount(res.data.data?.unread_count || 0);
    }).catch(() => {});
    const interval = setInterval(() => {
      getNotifications({ unread: '1', limit: 1 }).then(res => {
        setCount(res.data.data?.unread_count || 0);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button onClick={() => navigate(path)} className="relative p-2 text-slate-400 hover:text-orange-500 rounded-xl hover:bg-orange-50 transition-all">
      <FiBell size={18}/>
      {count > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
