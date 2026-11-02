import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getROIDashboard } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

export default function VendorROI() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState('30');

  function load(p) {
    setLoading(true);
    getROIDashboard({ period: p }).then(r => setData(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }

  useEffect(() => { load(period); }, [period]);

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  const s  = data?.summary || {};
  const chart = (data?.daily_chart || []).map(d => ({
    date:   format(new Date(d.txn_date), 'dd MMM'),
    revenue:(+d.revenue).toFixed(0),
    coins:  +d.coins_given,
    customers: +d.unique_customers,
  }));

  return (
    <div className="p-4 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">📊 ROI Dashboard</h2>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:border-orange-400">
          {[['7','7 Days'],['30','30 Days'],['90','90 Days'],['365','1 Year']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Platform message */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-4 text-white">
        <p className="text-sm font-medium opacity-90">Platform Message</p>
        <p className="font-bold mt-1 text-sm leading-relaxed">{s.extra_revenue_msg || 'No data yet. Start transacting to see your ROI!'}</p>
        {s.roi_score > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="font-black text-3xl">{s.roi_score}</span>
            <div>
              <p className="text-xs opacity-80">ROI Score</p>
              <p className="text-xs opacity-60">out of 100</p>
            </div>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:'Total Customers',    value: s.total_customers||0,                           icon:'👥', color:'text-blue-600' },
          { label:'Repeat Customers',   value: `${s.repeat_customers||0} (${s.repeat_percent||0}%)`, icon:'🔄', color:'text-green-600' },
          { label:'Total Revenue',      value: `₹${Number(s.total_revenue||0).toLocaleString('en-IN')}`, icon:'💰', color:'text-orange-500' },
          { label:'Avg Order Value',    value: `₹${Number(s.avg_order_value||0).toFixed(0)}`,  icon:'📈', color:'text-purple-600' },
          { label:'Coins Distributed',  value: `${Number(s.coins_distributed||0).toLocaleString()} 🪙`, icon:'🎁', color:'text-yellow-600' },
          { label:'Coins Cost (INR)',    value: `₹${Number(s.coin_cost_inr||0).toFixed(0)}`,   icon:'💸', color:'text-red-500' },
          { label:'Net Profit Estimate',value: `₹${Number(s.net_profit||0).toLocaleString('en-IN')}`, icon:'🏆', color:'text-green-700' },
          { label:'Transactions',       value: s.transaction_count||0,                         icon:'📋', color:'text-slate-600' },
        ].map(({label,value,icon,color}) => (
          <div key={label} className="stat-card p-3">
            <div className="flex items-center gap-2 mb-1"><span>{icon}</span><span className="text-xs text-slate-400">{label}</span></div>
            <p className={`font-bold text-sm ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      {chart.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">📈 Revenue & Customer Retention</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #fed7aa'}} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} name="Revenue ₹" />
              <Line type="monotone" dataKey="customers" stroke="#3b82f6" strokeWidth={2} dot={false} name="Customers" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Coins Chart */}
      {chart.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">🪙 Coins Distributed Daily</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="date" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip contentStyle={{borderRadius:'12px'}} />
              <Bar dataKey="coins" fill="#eab308" radius={[6,6,0,0]} name="Coins Given" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Customers */}
      {data?.top_customers?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-3">🏆 Top Customers</h3>
          {data.top_customers.map((c, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center text-sm font-bold text-orange-600">{i+1}</div>
              <div className="flex-1">
                <p className="font-medium text-sm text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-400">{c.visit_count} visits</p>
              </div>
              <p className="font-bold text-sm text-orange-500">₹{Number(c.total_spent).toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}

      {chart.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <div className="text-5xl mb-3">📊</div>
          <p>No transaction data yet for this period</p>
          <p className="text-sm mt-1">Start processing payments to see your ROI</p>
        </div>
      )}
    </div>
  );
}
