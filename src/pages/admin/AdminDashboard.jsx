import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminDashboard } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('30');

  useEffect(() => {
    setLoading(true);
    getAdminDashboard({ period }).then(r => setData(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>
      <div className="h-64 bg-slate-200 rounded-2xl animate-pulse"/>
    </div>
  );

  const ov = data?.overview || {};
  const fin= data?.finance  || {};
  const cs = data?.coin_stats || {};
  const pr = data?.profit || {};

  const dailyChart = (data?.daily_chart || []).map(d => ({
    date:   format(new Date(d.txn_date), 'dd MMM'),
    revenue:(+d.revenue).toFixed(0)*1,
    count:  +d.count,
    coins:  +d.coins,
  }));

  const regChart = [];
  const regMap   = {};
  (data?.registrations || []).forEach(r => {
    if (!regMap[r.date]) regMap[r.date] = { date: format(new Date(r.date),'dd MMM'), users: 0, vendors: 0 };
    regMap[r.date][r.type+'s'] = +r.count;
  });
  Object.values(regMap).forEach(v => regChart.push(v));

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">🏠 Admin Dashboard</h1>
        <select value={period} onChange={e=>setPeriod(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-orange-400">
          {[['7','7 Days'],['30','30 Days'],['90','90 Days'],['365','1 Year']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total Users',      value:ov.total_users||0,          icon:'👥', color:'text-blue-600',   bg:'bg-blue-50' },
          { label:'Approved Vendors', value:ov.approved_vendors||0,     icon:'🏪', color:'text-orange-500', bg:'bg-orange-50' },
          { label:'KYC Pending',      value:ov.pending_kyc_vendors||0,  icon:'📋', color:'text-amber-600',  bg:'bg-amber-50' },
          { label:'Total Transactions',value:ov.total_transactions||0,  icon:'💳', color:'text-green-600',  bg:'bg-green-50' },
        ].map(({label,value,icon,color,bg}) => (
          <div key={label} className="stat-card p-4">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center text-xl mb-2`}>{icon}</div>
            <p className={`text-2xl font-black ${color}`}>{Number(value).toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:'Total GMV',         value:`₹${Number(fin.total_gmv||0).toLocaleString('en-IN')}`,         color:'text-slate-800' },
          { label:'Coin Sales Revenue',value:`₹${Number(fin.total_coin_sales||0).toLocaleString('en-IN')}`,  color:'text-orange-500' },
          { label:'Arbitrage Profit',  value:`₹${Number(pr.arb||fin.total_arbitrage_profit||0).toFixed(0)}`, color:'text-green-600' },
          { label:'Withdrawal Fees',   value:`₹${Number(pr.wfee||fin.total_withdrawal_fees||0).toFixed(0)}`, color:'text-blue-600' },
        ].map(({label,value,color}) => (
          <div key={label} className="stat-card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Coin Economy */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">🪙 Coin Economy Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Coins Sold',        value:Number(cs.coins_sold||0).toLocaleString() },
            { label:'Coins Distributed', value:Number(cs.coins_distributed||0).toLocaleString() },
            { label:'Coins Expired',     value:Number(cs.coins_expired||0).toLocaleString() },
            { label:'In Circulation',    value:Number(cs.total_coins_in_circulation||0).toLocaleString() },
          ].map(({label,value}) => (
            <div key={label} className="text-center p-3 bg-slate-50 rounded-xl">
              <p className="font-bold text-lg text-orange-500">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(ov.pending_kyc_vendors > 0 || ov.pending_withdrawals > 0 || ov.frozen_accounts > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {ov.pending_kyc_vendors > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-xl">📋</span>
              <div><p className="font-semibold text-amber-800 text-sm">{ov.pending_kyc_vendors} KYC Pending</p>
              <p className="text-xs text-amber-600">Vendors awaiting approval</p></div>
            </div>
          )}
          {ov.pending_withdrawals > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-xl">🏦</span>
              <div><p className="font-semibold text-blue-800 text-sm">{ov.pending_withdrawals} Withdrawals Pending</p>
              <p className="text-xs text-blue-600">Require approval</p></div>
            </div>
          )}
          {ov.frozen_accounts > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
              <span className="text-xl">🔒</span>
              <div><p className="font-semibold text-red-800 text-sm">{ov.frozen_accounts} Frozen Accounts</p>
              <p className="text-xs text-red-600">Users/vendors frozen</p></div>
            </div>
          )}
        </div>
      )}

      {/* Revenue Chart */}
      {dailyChart.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">📈 Daily Revenue & Transactions</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #fed7aa'}}/>
              <Legend/>
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} name="Revenue ₹"/>
              <Line type="monotone" dataKey="count"   stroke="#3b82f6" strokeWidth={2} dot={false} name="Transactions"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Registrations */}
      {regChart.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">👥 New Registrations</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip contentStyle={{borderRadius:'12px'}}/>
              <Legend/>
              <Bar dataKey="users"   fill="#3b82f6" radius={[4,4,0,0]} name="Users"/>
              <Bar dataKey="vendors" fill="#f97316" radius={[4,4,0,0]} name="Vendors"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Vendors */}
      {data?.top_vendors?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3">🏆 Top Vendors by Revenue</h3>
          {data.top_vendors.map((v,i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <span className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-600">{i+1}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-slate-800">{v.business_name}</p>
                <p className="text-xs text-slate-400">{v.city} • {v.tx_count} txns</p>
              </div>
              <p className="font-bold text-orange-500">₹{Number(v.revenue).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
