import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAdminSpinData, saveAdminSpinReward, deleteAdminSpinReward } from '../../services/api';
import { 
  FiSettings, FiGift, FiPlus, FiEdit2, FiTrash2, FiSave, 
  FiRefreshCw, FiZap, FiCheckCircle, FiClock, FiAlertTriangle 
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';

export default function AdminSpinRewards() {
  const [loading, setLoading]       = useState(true);
  const [data, setData]             = useState(null);
  const [settings, setSettings]     = useState({
    feature_spin_wheel: true,
    spin_daily_free_limit: 1,
    spin_extra_cost_jc: 5,
    spin_deposit_bonus_expiry_hours: 24,
    spin_title: 'SPIN & WIN',
    spin_subtitle: 'हर दिन जीतने का मौका!'
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingReward, setEditingReward]   = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [savingReward, setSavingReward]     = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAdminSpinData();
      if (res.data?.success) {
        setData(res.data.data);
        if (res.data.data.settings) {
          setSettings(res.data.data.settings);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load spin settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate sum of probabilities
  const totalProbability = (data?.rewards || []).reduce(
    (sum, r) => sum + (r.is_active ? parseFloat(r.probability || 0) : 0), 0
  );

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await saveAdminSpinReward({
        action: 'update_settings',
        ...settings
      });
      if (res.data?.success) {
        toast.success('Spin settings updated successfully');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenRewardModal = (reward = null) => {
    if (reward) {
      setEditingReward({ ...reward });
    } else {
      setEditingReward({
        id: 0,
        title: '',
        reward_type: 'instant',
        reward_value: 5,
        probability: 10,
        bg_color: '#f97316',
        text_color: '#ffffff',
        badge_text: 'BONUS',
        sort_order: (data?.rewards?.length || 0) + 1,
        is_active: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveReward = async (e) => {
    e.preventDefault();
    if (!editingReward.title) {
      return toast.error('Reward title is required');
    }
    setSavingReward(true);
    try {
      const res = await saveAdminSpinReward({
        action: 'save_reward',
        ...editingReward
      });
      if (res.data?.success) {
        toast.success('Reward segment saved successfully');
        setIsModalOpen(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reward segment');
    } finally {
      setSavingReward(false);
    }
  };

  const handleDeleteReward = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reward segment?')) return;
    try {
      const res = await deleteAdminSpinReward(id);
      if (res.data?.success) {
        toast.success('Reward deleted');
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleToggleRewardActive = async (reward) => {
    try {
      const res = await saveAdminSpinReward({
        action: 'save_reward',
        ...reward,
        is_active: reward.is_active ? 0 : 1
      });
      if (res.data?.success) {
        loadData();
      }
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 mt-3">Loading Spin & Win settings...</p>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>🎰</span> Spin & Win Management
          </h1>
          <p className="text-sm text-slate-500">
            Control wheel segments, probabilities, rewards, free spins, and extra spin costs.
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn-secondary self-start sm:self-auto flex items-center gap-2"
        >
          <FiRefreshCw /> Refresh Data
        </button>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Total Spins</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.total_spins?.toLocaleString() || 0}</p>
          <span className="text-[11px] text-emerald-600 font-semibold">{stats.today_spins || 0} spins today</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Paid Extra Spins</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{stats.total_paid_spins?.toLocaleString() || 0}</p>
          <span className="text-[11px] text-slate-500">Cost: {stats.total_jc_spent || 0} JC collected</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Pending Deposit Rewards</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats.pending_deposit_rewards || 0}</p>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting user deposit</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-400">Claimed Deposit Rewards</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.claimed_deposit_rewards || 0}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Converted into deposits!</span>
        </div>
      </div>

      {/* GLOBAL SETTINGS FORM */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FiSettings className="text-orange-500" /> Global Spin Rules & Settings
          </h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${settings.feature_spin_wheel ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {settings.feature_spin_wheel ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Spin Feature Status</label>
            <select
              value={settings.feature_spin_wheel ? 'true' : 'false'}
              onChange={e => setSettings(p => ({ ...p, feature_spin_wheel: e.target.value === 'true' }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
            >
              <option value="true">Enabled (Users can play)</option>
              <option value="false">Disabled (Hide from users)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Free Spins Per Day</label>
            <input
              type="number"
              min="0"
              value={settings.spin_daily_free_limit}
              onChange={e => setSettings(p => ({ ...p, spin_daily_free_limit: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Extra Spin Cost (JC)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={settings.spin_extra_cost_jc}
              onChange={e => setSettings(p => ({ ...p, spin_extra_cost_jc: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Deposit Bonus Expiry (Hours)</label>
            <input
              type="number"
              min="1"
              value={settings.spin_deposit_bonus_expiry_hours}
              onChange={e => setSettings(p => ({ ...p, spin_deposit_bonus_expiry_hours: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Game Title</label>
            <input
              type="text"
              value={settings.spin_title}
              onChange={e => setSettings(p => ({ ...p, spin_title: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Game Subtitle / Notice</label>
            <input
              type="text"
              value={settings.spin_subtitle}
              onChange={e => setSettings(p => ({ ...p, spin_subtitle: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="btn-primary flex items-center gap-2"
            >
              <FiSave /> {savingSettings ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* WHEEL SEGMENTS / REWARDS TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FiGift className="text-orange-500" /> Wheel Segments & Probabilities
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                Math.round(totalProbability) === 100 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800 flex items-center gap-1'
              }`}>
                {Math.round(totalProbability) !== 100 && <FiAlertTriangle />}
                Total Active Probability: {totalProbability.toFixed(1)}% {Math.round(totalProbability) === 100 ? '(Ideal 100%)' : '(Should sum to 100%)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => handleOpenRewardModal(null)}
            className="btn-primary flex items-center gap-2 self-start sm:self-auto text-sm"
          >
            <FiPlus /> Add New Segment
          </button>
        </div>

        {/* REWARDS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-y border-slate-100">
              <tr>
                <th className="py-3 px-3">Order</th>
                <th className="py-3 px-3">Segment Title</th>
                <th className="py-3 px-3">Reward Type</th>
                <th className="py-3 px-3">Value</th>
                <th className="py-3 px-3">Winning Prob.</th>
                <th className="py-3 px-3">Color</th>
                <th className="py-3 px-3">Badge</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.rewards || []).map((r, idx) => (
                <tr key={r.id || idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-3 font-bold text-slate-500">#{r.sort_order || idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: r.bg_color }}></span>
                      {r.title}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {r.reward_type === 'instant' && (
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Instant JC
                      </span>
                    )}
                    {r.reward_type === 'deposit_multiplier' && (
                      <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Deposit Multiplier (2X)
                      </span>
                    )}
                    {r.reward_type === 'deposit_percent' && (
                      <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Deposit % Extra
                      </span>
                    )}
                    {r.reward_type === 'try_again' && (
                      <span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        Try Again (0 JC)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    {r.reward_type === 'deposit_multiplier' ? `${r.reward_value}X` : r.reward_type === 'deposit_percent' ? `${r.reward_value}%` : `${r.reward_value} JC`}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {r.bg_color}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-black text-xs text-orange-600">
                    {r.probability}%
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-500">
                    {r.badge_text || '-'}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleToggleRewardActive(r)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full cursor-pointer transition ${
                        r.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {r.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenRewardModal(r)}
                        className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteReward(r.id)}
                        className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT USER SPINS LOG */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FiClock className="text-orange-500" /> Recent User Spins Log
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-y border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Reward Won</th>
                <th className="py-2.5 px-3">Spin Mode</th>
                <th className="py-2.5 px-3">Cost</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {(data?.recent_spins || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-400">
                    No spin records yet. Spins will show up here in real time.
                  </td>
                </tr>
              ) : (
                data.recent_spins.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{s.created_at}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{s.user_name || `User #${s.user_id}`}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.user_phone || '-'}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{s.reward_title}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                        s.spin_type === 'free' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {s.spin_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{s.cost_jc > 0 ? `${s.cost_jc} JC` : 'Free'}</td>
                    <td className="py-2.5 px-3">
                      {s.status === 'completed' && <span className="text-emerald-600 font-bold">Completed</span>}
                      {s.status === 'pending_deposit' && <span className="text-amber-600 font-bold">Pending Deposit</span>}
                      {s.status === 'claimed' && <span className="text-purple-600 font-bold">Deposit Claimed!</span>}
                      {s.status === 'expired' && <span className="text-slate-400">Expired</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT REWARD SEGMENT MODAL */}
      {isModalOpen && editingReward && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingReward.id ? 'Edit Reward Segment' : 'Add New Reward Segment'}
            </h3>

            <form onSubmit={handleSaveReward} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Segment Title</label>
                <input
                  type="text"
                  required
                  value={editingReward.title}
                  onChange={e => setEditingReward(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. 50 JC Mega Jackpot"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reward Type</label>
                  <select
                    value={editingReward.reward_type}
                    onChange={e => setEditingReward(p => ({ ...p, reward_type: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="instant">Instant JC</option>
                    <option value="deposit_multiplier">Deposit Multiplier (2X)</option>
                    <option value="deposit_percent">Deposit % Extra (5%, 10%)</option>
                    <option value="try_again">Try Again</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reward Value</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingReward.reward_value}
                    onChange={e => setEditingReward(p => ({ ...p, reward_value: e.target.value }))}
                    placeholder="e.g. 5 or 2 or 10"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Probability (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={editingReward.probability}
                    onChange={e => setEditingReward(p => ({ ...p, probability: e.target.value }))}
                    placeholder="e.g. 15"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slice Hex Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingReward.bg_color}
                      onChange={e => setEditingReward(p => ({ ...p, bg_color: e.target.value }))}
                      className="w-10 h-10 p-0 rounded-lg cursor-pointer border-0"
                    />
                    <input
                      type="text"
                      value={editingReward.bg_color}
                      onChange={e => setEditingReward(p => ({ ...p, bg_color: e.target.value }))}
                      className="w-full p-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editingReward.badge_text || ''}
                    onChange={e => setEditingReward(p => ({ ...p, badge_text: e.target.value }))}
                    placeholder="e.g. MEGA JACKPOT"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sort Order (Clockwise)</label>
                  <input
                    type="number"
                    value={editingReward.sort_order}
                    onChange={e => setEditingReward(p => ({ ...p, sort_order: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active_check"
                  checked={Boolean(editingReward.is_active)}
                  onChange={e => setEditingReward(p => ({ ...p, is_active: e.target.checked ? 1 : 0 }))}
                  className="rounded text-orange-500 focus:ring-orange-400"
                />
                <label htmlFor="active_check" className="text-xs font-bold text-slate-700">
                  Active in Wheel
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReward}
                  className="btn-primary text-sm"
                >
                  {savingReward ? 'Saving...' : 'Save Segment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

