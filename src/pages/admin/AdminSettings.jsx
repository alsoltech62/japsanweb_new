import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../../services/api';

const GROUPS = {
  'Reward Engine': [
      'joining_bonus_user_l1', 'joining_bonus_user_l2', 'joining_bonus_user_l3',
      'joining_bonus_vendor_direct', 'joining_bonus_vendor_l2', 'joining_bonus_vendor_l3', 'joining_bonus_vendor_active',
      'txn_reward_user_l1', 'txn_reward_user_l2', 'txn_reward_user_l3',
      'txn_reward_vendor_l1', 'txn_reward_vendor_l2', 'txn_reward_vendor_l3', 'txn_reward_min_payment',
      'customer_referral_by_vendor_signup', 'customer_referral_by_vendor_txn_count', 'customer_referral_by_vendor_txn_bonus',
      'loyalty_program_visits_1', 'loyalty_program_bonus_1', 'loyalty_program_visits_2', 'loyalty_program_bonus_2'
  ],
  'Daily Login Rewards': [
      'feature_daily_rewards',
      'daily_reward_mode',
      'daily_reward_day_1',
      'daily_reward_day_2',
      'daily_reward_day_3',
      'daily_reward_day_4',
      'daily_reward_day_5',
      'daily_reward_day_6',
      'daily_reward_day_7',
      'daily_reward_title',
      'daily_reward_subtitle'
  ],
  'Holding & Ranks': [
      'holding_reward_tiers', 'vendor_coin_lock_days', 'coin_expiry_days', 'rank_criteria', 'vendor_rank_criteria', 'daily_holding_reward_percent', 'min_balance_for_holding_reward'
  ],
  'Coin Economy': ['coin_purchase_price_inr', 'min_recharge_amount', 'recharge_bonus_percent', 'redemption_rate_min','redemption_rate_max','redemption_rate_current'],
  'Limits & Caps': ['min_recharge_amount', 'min_payment_amount', 'min_withdrawal_amount', 'default_search_radius_km', 'daily_redemption_cap','vendor_distribution_limit'],
  'Bonus & Cashback': ['recharge_bonus_percent', 'bonus_threshold','bonus_coins','cashback_percent','max_cashback_percent'],
  'WhatsApp Integration': ['feature_whatsapp', 'whatsapp_api_url', 'whatsapp_user', 'whatsapp_pass', 'whatsapp_sender', 'whatsapp_vendor_welcome_template', 'whatsapp_user_welcome_template'],
  'Vendor Advertising': ['vendor_ad_fee_per_day'],
  'Physical QR Orders': ['qr_order_coin_price', 'feature_physical_qr_order', 'qr_order_package_items'],
  'Fees & Settlement': ['vendor_withdrawal_fee_percent','settlement_delay_days'],
  'Referral System': ['max_referral_levels','referral_coins_user_user','referral_coins_vendor_user','referral_coins_vendor_vendor','referral_lock_days','referral_unlock_on_transaction'],
  'Feature Toggles': ['feature_referral','feature_qr_payment','feature_physical_qr_order','feature_whatsapp','feature_notifications','feature_coin_purchase'],
  'Platform Info': ['platform_name','support_phone','support_email','otp_expiry_minutes','max_otp_attempts'],
};

const DEFAULT_METADATA = {
  feature_daily_rewards: { type: 'boolean', description: 'Enable or disable Daily Login Rewards popup and claims in App & Web', raw: 'true' },
  daily_reward_mode: { type: 'string', description: 'Payout Rule: Week Complete (reward credited only on Day 7 completion) or Daily Immediate', raw: 'week_complete' },
  daily_reward_day_1: { type: 'number', description: 'Day 1 Login Coins (JC)', raw: '1' },
  daily_reward_day_2: { type: 'number', description: 'Day 2 Login Coins (JC)', raw: '2' },
  daily_reward_day_3: { type: 'number', description: 'Day 3 Login Coins (JC)', raw: '3' },
  daily_reward_day_4: { type: 'number', description: 'Day 4 Login Coins (JC)', raw: '4' },
  daily_reward_day_5: { type: 'number', description: 'Day 5 Login Coins (JC)', raw: '5' },
  daily_reward_day_6: { type: 'number', description: 'Day 6 Login Coins (JC)', raw: '6' },
  daily_reward_day_7: { type: 'number', description: 'Day 7 Grand Reward Coins (JC)', raw: '7' },
  daily_reward_title: { type: 'string', description: 'Popup Title displayed to users in App & Web', raw: 'Roj Open Karo, Roj Rewards Paao!' },
  daily_reward_subtitle: { type: 'string', description: 'Popup Subtitle/Instruction text', raw: '7 din lagatar open karein aur week complete hone par paayein rewards!' },
};

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [dirty, setDirty]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeGroup, setActiveGroup] = useState('Coin Economy');

  useEffect(() => {
    getSettings().then(r => setSettings(r.data.data)).catch(() => toast.error('Failed to load settings')).finally(() => setLoading(false));
  }, []);

  function handleChange(key, value) {
    setDirty(d => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    if (!Object.keys(dirty).length) return toast('No changes to save');
    setSaving(true);
    try {
      await updateSettings(dirty);
      setSettings(s => {
        const updated = { ...s };
        Object.entries(dirty).forEach(([k,v]) => {
          updated[k] = {
            ...(updated[k] || DEFAULT_METADATA[k] || {}),
            value: v,
            raw: String(v)
          };
        });
        return updated;
      });
      setDirty({});
      toast.success(`${Object.keys(dirty).length} setting(s) saved!`);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    setSaving(false);
  }

  function getValue(key) {
    if (dirty[key] !== undefined) return dirty[key];
    return settings[key]?.raw ?? DEFAULT_METADATA[key]?.raw ?? '';
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i=><div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  const keys = GROUPS[activeGroup] || [];

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">⚙️ Platform Settings</h1>
        {Object.keys(dirty).length > 0 && (
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
            {saving ? '⏳ Saving...' : `💾 Save ${Object.keys(dirty).length} Change(s)`}
          </button>
        )}
      </div>

      <p className="text-sm text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        ⚠️ All platform rules are controlled here — no coding needed. Changes take effect immediately.
      </p>

      {/* Group Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.keys(GROUPS).map(g => (
          <button key={g} onClick={() => setActiveGroup(g)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeGroup===g?'bg-orange-500 text-white':'bg-white text-slate-600 border border-slate-200 hover:border-orange-300'}`}>
            {g}
          </button>
        ))}
      </div>

      {activeGroup === 'Daily Login Rewards' && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
          <p className="font-bold text-sm">🎁 Daily Streak Rewards Controller (Day 1 - Day 7)</p>
          <p>Yahan se aap set kar sakte hain ki Day 1 se Day 7 tak user ko har din kitna JC coin reward milega, popup enable/disable hoga, aur pura week complete karne ke baad reward milega ya daily.</p>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {keys.map((key, idx) => {
          const s = settings[key] || DEFAULT_METADATA[key];
          if (!s) return null;
          const isDirty = dirty[key] !== undefined;
          const isBoolean = s.type === 'boolean';
          return (
            <div key={key} className={`p-4 ${idx < keys.length-1 ? 'border-b border-slate-100' : ''} ${isDirty ? 'bg-orange-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block font-semibold text-slate-700 text-sm">
                    {key.startsWith('daily_reward_day_')
                      ? `Day ${key.replace('daily_reward_day_', '')} Coins (JC)`
                      : key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                  </label>
                  {s.description && <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isDirty && <span className="text-xs text-orange-500 font-medium">Modified</span>}
                  {isBoolean ? (
                    <button onClick={() => handleChange(key, getValue(key)==='true' ? 'false' : 'true')}
                      className={`relative w-12 h-6 rounded-full transition-all ${getValue(key)==='true'?'bg-green-500':'bg-slate-300'}`}>
                      <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow ${getValue(key)==='true'?'right-0.5':'left-0.5'}`}/>
                    </button>
                  ) : key === 'daily_reward_mode' ? (
                    <select
                      className={`px-3 py-2 border-2 rounded-xl text-xs font-semibold focus:outline-none transition-all ${isDirty?'border-orange-400 bg-white':'border-slate-200'}`}
                      value={getValue(key)}
                      onChange={e => handleChange(key, e.target.value)}
                    >
                      <option value="week_complete">Week Complete (Credit on Day 7 only)</option>
                      <option value="daily_immediate">Daily Immediate (Credit every day)</option>
                    </select>
                  ) : s.type === 'json' ? (
                    <textarea 
                      className={`w-64 h-24 px-3 py-2 border-2 rounded-xl text-xs font-mono focus:outline-none transition-all ${isDirty?'border-orange-400 bg-white':'border-slate-200'}`}
                      value={getValue(key)} onChange={e => handleChange(key, e.target.value)}
                    />
                  ) : (
                    <input type={s.type==='number'?'number':'text'}
                      className={`${s.type==='number'?'w-32 text-right':'w-64 text-left'} px-3 py-2 border-2 rounded-xl text-sm font-medium focus:outline-none transition-all ${isDirty?'border-orange-400 bg-white':'border-slate-200'}`}
                      value={getValue(key)} onChange={e => handleChange(key, e.target.value)} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
