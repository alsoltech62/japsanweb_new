import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRewardSettings, updateRewardSettings } from '../../services/api';
import toast from 'react-hot-toast';

export default function VendorRewardSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    base_cashback: '10',
    service_radius_km: 100,
    smart_rules: [{ amount: '500', reward: '25' }],
    loyalty_enabled: true,
    loyalty_visits: '5',
    loyalty_reward: '100'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getRewardSettings()
      .then(res => {
        if (res.data.data) setSettings(res.data.data);
      })
      .catch(() => toast.error('Failed to load reward settings'));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateRewardSettings(settings);
      toast.success('Reward settings updated!');
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setSettings(s => ({ ...s, smart_rules: [...s.smart_rules, { amount: '', reward: '' }] }));
  };

  return (
    <div className="p-4 space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">⚙️ Reward Settings</h2>
        <button 
          onClick={() => navigate('/vendor/buy-coins')} 
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs px-3 py-1.5 rounded-full shadow-xs transition-all flex items-center gap-1"
        >
          <span>🪙</span> Buy Coins
        </button>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 rounded-xl border border-orange-200 flex items-center justify-between">
        <div className="flex-1 pr-2">
          <p className="font-bold text-xs text-orange-900">Need Coins for Customer Rewards?</p>
          <p className="text-[11px] text-orange-700">Recharge your coin balance to distribute cashback smoothly.</p>
        </div>
        <button onClick={() => navigate('/vendor/buy-coins')} className="btn-primary text-xs py-1.5 px-3 whitespace-nowrap">
          Buy Coins →
        </button>
      </div>

      {/* Basic Cashback */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
        <h3 className="font-bold text-slate-800">Automatic Cashback</h3>
        <p className="text-xs text-slate-500">Set the default % of Japsan Pays awarded to customers on every purchase.</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            className="input-field w-24"
            value={settings.base_cashback}
            onChange={(e) => setSettings({ ...settings, base_cashback: e.target.value })}
          />
          <span className="font-medium text-slate-600">%</span>
        </div>
      </div>

      {/* Customer Discovery & Visibility Radius */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span>📡</span> Customer Discovery Radius
          </h3>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 font-black text-sm rounded-full border border-blue-200">
            {settings.service_radius_km || 100} KM
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Control how far (50 KM to 500 KM) customers can discover your store and offers on the Japsan Pay app.
        </p>
        
        <div className="pt-2">
          <input
            type="range"
            min="50"
            max="500"
            step="10"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            value={settings.service_radius_km || 100}
            onChange={(e) => setSettings({ ...settings, service_radius_km: parseInt(e.target.value) || 50 })}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1 font-semibold">
            <span>50 KM</span>
            <span>150 KM</span>
            <span>300 KM</span>
            <span>500 KM</span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[50, 100, 200, 350, 500].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setSettings({ ...settings, service_radius_km: km })}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                settings.service_radius_km == km
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {km} KM
            </button>
          ))}
        </div>
      </div>

      {/* Smart Rules */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Smart Reward Rules</h3>
          <button onClick={addRule} className="text-sm font-medium text-blue-600">+ Add Rule</button>
        </div>
        <p className="text-xs text-slate-500">Set fixed coin rewards for specific bill amounts.</p>
        
        {settings.smart_rules.map((rule, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <span className="text-sm text-slate-600">Buy ₹</span>
            <input
              type="number"
              className="input-field w-full"
              placeholder="Amt"
              value={rule.amount}
              onChange={(e) => {
                const newRules = [...settings.smart_rules];
                newRules[idx].amount = e.target.value;
                setSettings({ ...settings, smart_rules: newRules });
              }}
            />
            <span className="text-sm text-slate-600">=</span>
            <input
              type="number"
              className="input-field w-full"
              placeholder="Coins"
              value={rule.reward}
              onChange={(e) => {
                const newRules = [...settings.smart_rules];
                newRules[idx].reward = e.target.value;
                setSettings({ ...settings, smart_rules: newRules });
              }}
            />
            <span className="text-sm text-slate-600">🪙</span>
          </div>
        ))}
      </div>

      {/* Loyalty Program */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Loyalty Program</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={settings.loyalty_enabled} onChange={e => setSettings({...settings, loyalty_enabled: e.target.checked})} />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>
        <p className="text-xs text-slate-500">Reward repeat customers after a certain number of visits.</p>
        {settings.loyalty_enabled && (
          <div className="flex gap-2 items-center mt-2">
            <span className="text-sm text-slate-600">After</span>
            <input type="number" className="input-field w-16" value={settings.loyalty_visits} onChange={e => setSettings({...settings, loyalty_visits: e.target.value})} />
            <span className="text-sm text-slate-600">visits, give</span>
            <input type="number" className="input-field w-20" value={settings.loyalty_reward} onChange={e => setSettings({...settings, loyalty_reward: e.target.value})} />
            <span className="text-sm text-slate-600">🪙</span>
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}
