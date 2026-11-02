import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FiDollarSign, FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, 
  FiCheckCircle, FiTrendingUp, FiLock, FiRepeat, FiUsers, FiClock, FiShield 
} from 'react-icons/fi';
import { 
  getInvestmentPlans, createAdminInvestmentPlan, updateAdminInvestmentPlan, 
  deleteAdminInvestmentPlan, getAdminInvestments, getInvestmentSettings, updateInvestmentSettings 
} from '../../services/api';

export default function AdminInvestments() {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'plans', or 'user_investments'
  const [stats, setStats] = useState(null);
  
  // Dynamic Calculator & SIP Settings
  const [calcSettings, setCalcSettings] = useState({
    calculator_return_rate: 15.0,
    daily_return_rate: 14.5,
    weekly_return_rate: 15.0,
    monthly_return_rate: 16.5,
    min_amount: 100,
    max_amount: 100000,
    default_tenure_months: 12
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Plans Tab
  const [plans, setPlans] = useState([]);
  const [planFilter, setPlanFilter] = useState('all');
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    plan_type: 'sip',
    name: '',
    description: '',
    frequency: 'monthly',
    interest_rate: '',
    min_amount: '',
    max_amount: '',
    tenure_value: '',
    tenure_type: 'months',
    compounding_frequency: 'monthly',
    premature_penalty_percent: '1.00',
    badge: 'Popular',
    is_active: 1
  });

  // User Investments Tab
  const [userInvestments, setUserInvestments] = useState([]);
  const [invFilterType, setInvFilterType] = useState('all');
  const [invFilterStatus, setInvFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [invFilterType, invFilterStatus, searchQuery]);

  async function loadAll() {
    setLoading(true);
    try {
      const [plansRes, adminInvRes, settingsRes] = await Promise.all([
        getInvestmentPlans({ all: 1 }),
        getAdminInvestments({
          type: invFilterType !== 'all' ? invFilterType : undefined,
          status: invFilterStatus !== 'all' ? invFilterStatus : undefined,
          search: searchQuery || undefined
        }),
        getInvestmentSettings().catch(() => null)
      ]);

      if (plansRes?.data?.success) setPlans(plansRes.data.data || []);
      if (adminInvRes?.data?.success) {
        setUserInvestments(adminInvRes.data.data?.investments || []);
        setStats(adminInvRes.data.data?.stats || null);
      }
      if (settingsRes?.data?.success) {
        setCalcSettings(prev => ({ ...prev, ...settingsRes.data.data }));
      }
    } catch (err) {
      toast.error('Failed to load investments data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateInvestmentSettings(calcSettings);
      if (res.data?.success) {
        toast.success('🎉 SIP & Calculator return rates updated dynamically!');
        loadAll();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  }

  function handleOpenPlanModal(plan = null) {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        id: plan.id,
        plan_type: plan.plan_type,
        name: plan.name,
        description: plan.description || '',
        frequency: plan.frequency,
        interest_rate: plan.interest_rate,
        min_amount: plan.min_amount,
        max_amount: plan.max_amount || '',
        tenure_value: plan.tenure_value,
        tenure_type: plan.tenure_type,
        compounding_frequency: plan.compounding_frequency || 'monthly',
        premature_penalty_percent: plan.premature_penalty_percent || '1.00',
        badge: plan.badge || '',
        is_active: plan.is_active
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        plan_type: 'sip',
        name: '',
        description: '',
        frequency: 'monthly',
        interest_rate: '12.00',
        min_amount: '500',
        max_amount: '100000',
        tenure_value: '12',
        tenure_type: 'months',
        compounding_frequency: 'monthly',
        premature_penalty_percent: '1.00',
        badge: 'Popular',
        is_active: 1
      });
    }
    setShowPlanModal(true);
  }

  async function handleSavePlan(e) {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updateAdminInvestmentPlan(planForm);
        toast.success('Plan updated successfully');
      } else {
        await createAdminInvestmentPlan(planForm);
        toast.success('Plan created successfully');
      }
      setShowPlanModal(false);
      loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save plan');
    }
  }

  async function handleTogglePlanStatus(plan) {
    try {
      await updateAdminInvestmentPlan({ id: plan.id, toggle_active: 1 });
      toast.success('Status updated');
      loadAll();
    } catch (err) {
      toast.error('Failed to update status');
    }
  }

  async function handleDeletePlan(id) {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deleteAdminInvestmentPlan(id);
      toast.success('Plan deleted');
      loadAll();
    } catch (err) {
      toast.error('Failed to delete plan');
    }
  }

  const filteredPlans = planFilter === 'all' 
    ? plans 
    : plans.filter(p => p.plan_type === planFilter);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">Investments Management (SIP, FD, RD)</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor and configure high-yield systematic investment plans, fixed deposits, and recurring deposits.
        </p>
      </div>

      {/* Analytics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total AUM (Active)</p>
            <p className="text-xl font-black text-emerald-600 mt-1">₹{stats.total_aum?.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{stats.total_investments_count} Active Portfolios</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active SIPs</p>
            <p className="text-xl font-black text-orange-500 mt-1">{stats.active_sips}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Daily, Weekly & Monthly</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active FDs</p>
            <p className="text-xl font-black text-sky-600 mt-1">{stats.active_fds}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Fixed Term Deposits</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active RDs</p>
            <p className="text-xl font-black text-indigo-600 mt-1">{stats.active_rds}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Recurring Deposits</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm col-span-2 lg:col-span-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Settled Payouts</p>
            <p className="text-xl font-black text-slate-800 mt-1">₹{stats.total_payouts?.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Matured / Broken</p>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl max-w-xl shadow-inner">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FiTrendingUp size={14} /> Calculator & Return Settings
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'plans' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Investment Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('user_investments')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'user_investments' ? 'bg-white text-orange-600 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          User Holdings ({userInvestments.length})
        </button>
      </div>

      {/* TAB 0: DYNAMIC CALCULATOR & SIP SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FiTrendingUp className="text-orange-500" /> Dynamic SIP Return & Calculator Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure the expected annual return rates for the SIP Calculator and user investment plans dynamically.
              </p>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {savingSettings ? <FiClock className="animate-spin" /> : <FiCheckCircle />}
              {savingSettings ? 'Saving...' : 'Save & Apply Settings'}
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Primary Calculator Return */}
              <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-100 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-orange-900">Calculator Annual Return</label>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-500 text-white">Default</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={calcSettings.calculator_return_rate}
                    onChange={(e) => setCalcSettings({ ...calcSettings, calculator_return_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-orange-200 rounded-xl text-sm font-extrabold text-orange-900 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-extrabold text-orange-400">% p.a.</span>
                </div>
                <p className="text-[10px] text-orange-700/80">Primary rate used for user wealth projections.</p>
              </div>

              {/* Monthly SIP Return */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-800">Monthly SIP Return Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={calcSettings.monthly_return_rate}
                    onChange={(e) => setCalcSettings({ ...calcSettings, monthly_return_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">% p.a.</span>
                </div>
                <p className="text-[10px] text-slate-400">Applied to monthly frequency investments.</p>
              </div>

              {/* Weekly SIP Return */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-800">Weekly SIP Return Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={calcSettings.weekly_return_rate}
                    onChange={(e) => setCalcSettings({ ...calcSettings, weekly_return_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">% p.a.</span>
                </div>
                <p className="text-[10px] text-slate-400">Applied to weekly frequency investments.</p>
              </div>

              {/* Daily SIP Return */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <label className="text-xs font-bold text-slate-800">Daily SIP Return Rate</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    required
                    value={calcSettings.daily_return_rate}
                    onChange={(e) => setCalcSettings({ ...calcSettings, daily_return_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">% p.a.</span>
                </div>
                <p className="text-[10px] text-slate-400">Applied to daily micro-SIP investments.</p>
              </div>
            </div>

            {/* Threshold & Defaults */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Minimum Installment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={calcSettings.min_amount}
                  onChange={(e) => setCalcSettings({ ...calcSettings, min_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-slate-400">Minimum amount a user can invest per installment.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Maximum Installment Amount (₹)</label>
                <input
                  type="number"
                  min="100"
                  required
                  value={calcSettings.max_amount}
                  onChange={(e) => setCalcSettings({ ...calcSettings, max_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-slate-400">Cap on single installment amount.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Default Duration (Months)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={calcSettings.default_tenure_months}
                  onChange={(e) => setCalcSettings({ ...calcSettings, default_tenure_months: parseInt(e.target.value) || 12 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-[10px] text-slate-400">Default tenure pre-selected in the user calculator.</p>
              </div>
            </div>

            {/* Live Simulation Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Live Simulation Check</p>
                <h4 className="text-base font-bold mt-0.5">Example: ₹1,000 / month for {calcSettings.default_tenure_months} months at {calcSettings.calculator_return_rate}% p.a.</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Total Investment: ₹{(1000 * calcSettings.default_tenure_months).toLocaleString('en-IN')} • 
                  Estimated Maturity: ₹{(
                    Math.round(1000 * ((Math.pow(1 + (calcSettings.calculator_return_rate / 100 / 12), calcSettings.default_tenure_months) - 1) / (calcSettings.calculator_return_rate / 100 / 12)) * (1 + (calcSettings.calculator_return_rate / 100 / 12)))
                  ).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
              >
                {savingSettings ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 1: INVESTMENT PLANS MANAGEMENT */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs">
              {['all', 'sip', 'fd', 'rd'].map((t) => (
                <button
                  key={t}
                  onClick={() => setPlanFilter(t)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                    planFilter === t ? 'bg-orange-500 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t === 'all' ? 'All Plans' : t.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleOpenPlanModal()}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20"
            >
              <FiPlus size={15} /> Create New Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      p.plan_type === 'sip' ? 'bg-orange-100 text-orange-700' :
                      p.plan_type === 'fd' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {p.plan_type.toUpperCase()} • {p.frequency}
                    </span>
                    <button
                      onClick={() => handleTogglePlanStatus(p)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {p.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-2">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl my-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Interest / Return</p>
                      <p className="font-extrabold text-emerald-600">{p.interest_rate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Min Amount</p>
                      <p className="font-bold text-slate-800">₹{parseFloat(p.min_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Tenure</p>
                      <p className="font-bold text-slate-800">{p.tenure_value} {p.tenure_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Compounding</p>
                      <p className="font-bold text-slate-800 capitalize">{p.compounding_frequency}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenPlanModal(p)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <FiEdit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeletePlan(p.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: USER HOLDINGS MONITOR */}
      {activeTab === 'user_investments' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by User Name, Phone, Ref, or Plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-2 text-xs">
              <select
                value={invFilterType}
                onChange={(e) => setInvFilterType(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white"
              >
                <option value="all">All Types (SIP, FD, RD)</option>
                <option value="sip">SIP Only</option>
                <option value="fd">FD Only</option>
                <option value="rd">RD Only</option>
              </select>

              <select
                value={invFilterStatus}
                onChange={(e) => setInvFilterStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="broken_premature">Broken (Premature)</option>
              </select>
            </div>
          </div>

          {/* Table of User Investments */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="p-3.5">Ref / Type</th>
                    <th className="p-3.5">User Details</th>
                    <th className="p-3.5">Plan Name</th>
                    <th className="p-3.5">Principal / Installment</th>
                    <th className="p-3.5">Interest</th>
                    <th className="p-3.5">Dates</th>
                    <th className="p-3.5">Progress</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {userInvestments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8 text-slate-400">
                        No investment records found.
                      </td>
                    </tr>
                  ) : (
                    userInvestments.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-800">{inv.investment_ref}</p>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            inv.investment_type === 'sip' ? 'bg-orange-100 text-orange-700' :
                            inv.investment_type === 'fd' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {inv.investment_type}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{inv.user_name}</p>
                          <p className="text-[10px] text-slate-400">{inv.user_phone}</p>
                        </td>
                        <td className="p-3.5 font-medium text-slate-800">
                          {inv.plan_name}
                        </td>
                        <td className="p-3.5">
                          <p className="font-bold text-emerald-600">₹{parseFloat(inv.total_principal_invested).toLocaleString('en-IN')}</p>
                          <p className="text-[10px] text-slate-400">₹{inv.installment_amount} / {inv.frequency}</p>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {inv.interest_rate}% p.a.
                        </td>
                        <td className="p-3.5 text-[11px]">
                          <p className="text-slate-600">Start: {new Date(inv.start_date).toLocaleDateString('en-IN')}</p>
                          <p className="text-slate-400">Mat: {new Date(inv.maturity_date).toLocaleDateString('en-IN')}</p>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {inv.installments_paid} / {inv.installments_total}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            inv.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT PLAN */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPlan ? 'Edit Investment Plan' : 'Create New Investment Scheme'}
              </h3>
              <button 
                onClick={() => setShowPlanModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plan Category</label>
                  <select
                    value={planForm.plan_type}
                    onChange={(e) => setPlanForm({ ...planForm, plan_type: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="sip">SIP (Systematic Investment Plan)</option>
                    <option value="fd">Fixed Deposit (FD)</option>
                    <option value="rd">Recurring Deposit (RD)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Frequency</label>
                  <select
                    value={planForm.frequency}
                    onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="daily">Daily (SIP)</option>
                    <option value="weekly">Weekly (SIP)</option>
                    <option value="monthly">Monthly (SIP / RD)</option>
                    <option value="one_time">One-Time (FD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Plan Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Japsan Super SIP 12M"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Benefits</label>
                <textarea
                  rows="2"
                  placeholder="Details for users..."
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Annual Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 14.5"
                    value={planForm.interest_rate}
                    onChange={(e) => setPlanForm({ ...planForm, interest_rate: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={planForm.min_amount}
                    onChange={(e) => setPlanForm({ ...planForm, min_amount: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Optional"
                    value={planForm.max_amount}
                    onChange={(e) => setPlanForm({ ...planForm, max_amount: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tenure Value</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 12"
                    value={planForm.tenure_value}
                    onChange={(e) => setPlanForm({ ...planForm, tenure_value: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tenure Type</label>
                  <select
                    value={planForm.tenure_type}
                    onChange={(e) => setPlanForm({ ...planForm, tenure_type: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Compounding</label>
                  <select
                    value={planForm.compounding_frequency}
                    onChange={(e) => setPlanForm({ ...planForm, compounding_frequency: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="on_maturity">On Maturity</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Early Break Penalty (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={planForm.premature_penalty_percent}
                    onChange={(e) => setPlanForm({ ...planForm, premature_penalty_percent: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Most Popular, High Yield"
                  value={planForm.badge}
                  onChange={(e) => setPlanForm({ ...planForm, badge: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-500/20"
                >
                  Save Investment Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
