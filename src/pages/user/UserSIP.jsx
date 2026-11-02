import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FiTrendingUp, FiCalendar, FiClock, FiCheckCircle, FiDollarSign, 
  FiShield, FiArrowRight, FiPercent, FiPlay, FiInfo, FiChevronRight, FiCreditCard,
  FiZap, FiSliders, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { 
  getInvestmentPlans, getMyInvestments, createInvestmentOrder, createSipSubscription,
  startInvestment, payInvestmentInstallment, withdrawInvestment, getWallet,
  getInvestmentSettings
} from '../../services/api';

export default function UserSIP() {
  const [plans, setPlans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('start'); // 'start' (unified customizer/calculator) or 'my_sips'
  const [showPlansList, setShowPlansList] = useState(false);

  // Admin Configured Dynamic Settings
  const [adminSettings, setAdminSettings] = useState({
    calculator_return_rate: 15.0,
    daily_return_rate: 14.5,
    weekly_return_rate: 15.0,
    monthly_return_rate: 16.5,
    min_amount: 100,
    max_amount: 100000,
    default_tenure_months: 12
  });

  // User Customizable SIP State
  const [calcFreq, setCalcFreq] = useState('monthly'); // 'monthly', 'weekly', 'daily'
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcTenure, setCalcTenure] = useState(12); // periods
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'wallet'
  const [actionLoading, setActionLoading] = useState(false);

  // Installment Pay Modal
  const [payingSIP, setPayingSIP] = useState(null);
  const [instPayMethod, setInstPayMethod] = useState('razorpay');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [plansRes, invRes, walletRes, settingsRes] = await Promise.all([
        getInvestmentPlans({ type: 'sip' }),
        getMyInvestments({ type: 'sip' }),
        getWallet(),
        getInvestmentSettings().catch(() => null)
      ]);

      if (plansRes?.data?.success) setPlans(plansRes.data.data || []);
      if (invRes?.data?.success) {
        setMyInvestments(invRes.data.data?.investments || []);
        setSummary(invRes.data.data?.summary || null);
      }
      if (walletRes?.data?.success) {
        setWallet(walletRes.data.data?.wallet || null);
      }
      if (settingsRes?.data?.success) {
        const s = settingsRes.data.data;
        setAdminSettings(prev => ({ ...prev, ...s }));
        if (s.default_tenure_months) setCalcTenure(s.default_tenure_months);
        if (s.min_amount && calcAmount < s.min_amount) setCalcAmount(s.min_amount);
      }
    } catch (err) {
      toast.error('Failed to load SIP information');
    } finally {
      setLoading(false);
    }
  }

  // Active return rate dynamically dictated by Admin settings
  const activeRate = calcFreq === 'daily'
    ? (adminSettings.daily_return_rate || 14.5)
    : calcFreq === 'weekly'
      ? (adminSettings.weekly_return_rate || 15.0)
      : (adminSettings.monthly_return_rate || 16.5);

  // Load Razorpay Checkout script dynamically
  async function loadRazorpayScript() {
    if (window.Razorpay) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  // Calculation Logic
  function calculateSIPProjection(installment, annualRate, tenurePeriods, freq) {
    const p = parseFloat(installment) || 0;
    const n = parseInt(tenurePeriods) || 1;
    const r = freq === 'daily' 
      ? (annualRate / 100) / 365 
      : freq === 'weekly' 
        ? (annualRate / 100) / 52 
        : (annualRate / 100) / 12;
    
    const totalInvested = p * n;
    let fv = totalInvested;
    if (r > 0 && p > 0) {
      fv = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    }
    const estimatedReturns = Math.max(0, fv - totalInvested);
    return {
      totalInvested: Math.round(totalInvested),
      estimatedReturns: Math.round(estimatedReturns),
      maturityAmount: Math.round(fv)
    };
  }

  const calcResults = calculateSIPProjection(calcAmount, activeRate, calcTenure, calcFreq);

  // Handle Start SIP directly from interactive customizer (or preset plan)
  async function handleStartSIP(overridePlan = null) {
    const targetPlan = overridePlan || plans.find(p => p.frequency?.toLowerCase() === calcFreq.toLowerCase()) || plans[0];
    if (!targetPlan) {
      return toast.error('No investment plan available. Please contact administrator.');
    }

    const amt = parseFloat(calcAmount);
    const minAmt = parseFloat(targetPlan.min_amount || adminSettings.min_amount || 100);
    const maxAmt = parseFloat(targetPlan.max_amount || adminSettings.max_amount || 100000);

    if (!amt || amt < minAmt) {
      return toast.error(`Minimum installment amount is ₹${minAmt.toLocaleString('en-IN')}`);
    }
    if (maxAmt && amt > maxAmt) {
      return toast.error(`Maximum installment amount is ₹${maxAmt.toLocaleString('en-IN')}`);
    }

    if (paymentMethod === 'wallet') {
      const balance = parseFloat(wallet?.cash_wallet_balance || 0);
      if (balance < amt) {
        return toast.error(`Insufficient wallet balance (₹${balance.toLocaleString('en-IN')}). Please recharge or select Razorpay.`);
      }
    }

    setActionLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        const res = await startInvestment({
          plan_id: targetPlan.id,
          amount: amt,
          tenure_value: calcTenure,
          payment_method: 'wallet'
        });
        if (res.data?.success) {
          toast.success('🎉 SIP started successfully from your Cash Wallet!');
          await loadData();
          setActiveTab('my_sips');
        } else {
          throw new Error(res.data?.message || 'Failed to start SIP');
        }
      } else {
        // Razorpay Subscription Flow (Autopay / Mandate)
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) throw new Error('Razorpay SDK failed to load');

        let subRes;
        try {
          subRes = await createSipSubscription({
            amount_inr: amt,
            plan_id: targetPlan.id,
            tenure_months: calcTenure
          });
        } catch (e) {
          // Fallback to order if subscriptions not enabled on test key
          subRes = await createInvestmentOrder({
            amount_inr: amt,
            investment_type: 'sip',
            plan_id: targetPlan.id,
            tenure_months: calcTenure
          });
        }

        if (!subRes.data?.success) throw new Error(subRes.data?.message || 'Failed to initialize Razorpay checkout');
        const subData = subRes.data.data;
        const user = JSON.parse(localStorage.getItem('japsan_user') || '{}');

        const options = {
          key: subData.key_id || 'rzp_live_TN8KciymYkApmH',
          name: 'Japsan Pay',
          description: `SIP (${targetPlan.frequency.toUpperCase()}) - ₹${amt.toLocaleString('en-IN')} / ${targetPlan.frequency}`,
          prefill: {
            contact: (user.phone || '').replace(/\D/g, '').slice(-10),
            email: user.email || 'user@japsanpay.com',
            name: user.name || 'Investor'
          },
          // For Razorpay Subscriptions (Autopay), DO NOT pass amount/currency/order_id.
          ...(subData.subscription_id
            ? { subscription_id: subData.subscription_id }
            : { order_id: subData.order_id, amount: subData.amount, currency: 'INR' }),
          handler: async function (response) {
            try {
              const res = await startInvestment({
                plan_id: targetPlan.id,
                amount: amt,
                tenure_value: calcTenure,
                payment_method: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id || subData.subscription_id,
                razorpay_order_id: response.razorpay_order_id || subData.order_id,
                razorpay_signature: response.razorpay_signature
              });
              if (res.data?.success) {
                toast.success('🎉 SIP Subscription activated successfully!');
                await loadData();
                setActiveTab('my_sips');
              } else {
                toast.error(res.data?.message || 'Investment activation failed');
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          theme: { color: '#f97316' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast.error(resp.error?.description || 'Subscription setup cancelled or failed');
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to initiate SIP');
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Pay Installment
  async function handlePayInstallment() {
    if (!payingSIP) return;
    const amt = parseFloat(payingSIP.installment_amount);
    setActionLoading(true);

    try {
      if (instPayMethod === 'wallet') {
        const res = await payInvestmentInstallment({
          investment_id: payingSIP.id,
          payment_method: 'wallet'
        });
        if (res.data?.success) {
          toast.success('✅ Installment paid successfully!');
          setPayingSIP(null);
          loadData();
        }
      } else {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) throw new Error('Razorpay SDK failed to load');

        const orderRes = await createInvestmentOrder({
          amount_inr: amt,
          investment_type: 'installment',
          investment_id: payingSIP.id
        });

        if (!orderRes.data?.success) throw new Error(orderRes.data?.message || 'Failed to create payment order');
        const { order_id, amount, key_id } = orderRes.data.data;
        const user = JSON.parse(localStorage.getItem('japsan_user') || '{}');

        const options = {
          key: key_id || 'rzp_live_TN8KciymYkApmH',
          amount: amount,
          currency: 'INR',
          name: 'Japsan Pay',
          description: `SIP Installment Payment - ${payingSIP.plan_name}`,
          order_id: order_id,
          prefill: {
            contact: (user.phone || '').replace(/\D/g, '').slice(-10),
            email: user.email || 'user@japsanpay.com',
            name: user.name || 'Investor'
          },
          handler: async function (response) {
            try {
              const res = await payInvestmentInstallment({
                investment_id: payingSIP.id,
                payment_method: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              if (res.data?.success) {
                toast.success('✅ Installment paid successfully with Razorpay!');
                setPayingSIP(null);
                loadData();
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          theme: { color: '#f97316' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast.error(resp.error?.description || 'Payment cancelled or failed');
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Withdraw / Break SIP
  async function handleWithdraw(invId) {
    if (!window.confirm('Are you sure you want to withdraw / close this SIP? If withdrawing before maturity, standard early break fee will apply.')) return;
    try {
      const res = await withdrawInvestment({ investment_id: invId });
      if (res.data?.success) {
        toast.success(`Withdrawal processed! ₹${res.data.data?.payout_amount} credited to your Cash Wallet.`);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <FiTrendingUp className="text-yellow-300" /> Systematic Investment Plan (SIP)
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Invest Daily, Weekly or Monthly</h1>
            <p className="text-orange-100 text-sm mt-1 max-w-xl">
              Build your wealth systematically with compounding returns up to 18% p.a. Start small and automate your future with Razorpay & Wallet.
            </p>
          </div>

          <div className="flex bg-black/25 p-1.5 rounded-2xl backdrop-blur-md self-stretch md:self-auto gap-1">
            <button
              onClick={() => setActiveTab('start')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'start' ? 'bg-white text-orange-600 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <FiZap size={14} /> Start SIP
            </button>
            <button
              onClick={() => setActiveTab('my_sips')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'my_sips' ? 'bg-white text-orange-600 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              <FiCheckCircle size={14} /> My SIPs {myInvestments.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold">{myInvestments.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        {summary && summary.total_invested > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-orange-200">Total Invested</p>
              <p className="text-lg font-bold">₹{summary.total_invested?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-orange-200">Current Valuation</p>
              <p className="text-lg font-bold text-emerald-300">₹{summary.total_current_value?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-orange-200">Accrued Returns</p>
              <p className="text-lg font-bold text-yellow-300">+₹{summary.total_accrued_returns?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-orange-200">Active SIPs</p>
              <p className="text-lg font-bold">{summary.active_sips} Plans</p>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: UNIFIED INTERACTIVE SIP BUILDER & CALCULATOR */}
      {activeTab === 'start' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <FiZap className="text-orange-500" /> Customize Your SIP
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose your installment schedule, amount and duration. Live returns are guaranteed up to {adminSettings.monthly_return_rate || 16.5}% p.a.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60 flex items-center gap-1">
                  <FiPercent size={12} /> {activeRate}% p.a. Expected Return
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Controls Column */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Frequency */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                    1. Select Frequency
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'monthly', label: 'Monthly', rate: adminSettings.monthly_return_rate || 16.5, badge: 'Popular' },
                      { key: 'weekly', label: 'Weekly', rate: adminSettings.weekly_return_rate || 15.0, badge: 'High Yield' },
                      { key: 'daily', label: 'Daily', rate: adminSettings.daily_return_rate || 14.5, badge: 'Micro' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCalcFreq(item.key)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                          calcFreq === item.key
                            ? 'border-orange-500 bg-orange-50/70 shadow-md ring-2 ring-orange-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        {item.badge && (
                          <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            calcFreq === item.key ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        <p className={`text-sm font-extrabold capitalize ${calcFreq === item.key ? 'text-orange-700' : 'text-slate-800'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          {item.rate}% p.a.
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Amount */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      2. Installment Amount
                    </label>
                    <span className="text-base font-extrabold text-orange-600">
                      ₹{calcAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[500, 1000, 2500, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCalcAmount(amt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          calcAmount === amt
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        ₹{amt.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>

                  {/* Input & Slider */}
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        min={adminSettings.min_amount || 100}
                        max={adminSettings.max_amount || 100000}
                        step="100"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <input 
                      type="range"
                      min={adminSettings.min_amount || 100}
                      max={Math.min(adminSettings.max_amount || 100000, 25000)}
                      step="100"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(parseInt(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Min: ₹{(adminSettings.min_amount || 100).toLocaleString('en-IN')}</span>
                      <span>Max: ₹{(adminSettings.max_amount || 100000).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Duration */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      3. Duration ({calcFreq === 'daily' ? 'Days' : calcFreq === 'weekly' ? 'Weeks' : 'Months'})
                    </label>
                    <span className="text-sm font-extrabold text-slate-900">
                      {calcTenure} {calcFreq === 'daily' ? 'Days' : calcFreq === 'weekly' ? 'Weeks' : 'Months'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {(calcFreq === 'daily'
                      ? [30, 60, 90, 180, 365]
                      : calcFreq === 'weekly'
                        ? [12, 26, 52, 104]
                        : [6, 12, 24, 36, 60]
                    ).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCalcTenure(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          calcTenure === t
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t} {calcFreq === 'daily' ? 'd' : calcFreq === 'weekly' ? 'w' : 'm'}
                      </button>
                    ))}
                  </div>

                  <input 
                    type="range"
                    min={calcFreq === 'daily' ? 7 : calcFreq === 'weekly' ? 4 : 3}
                    max={calcFreq === 'daily' ? 365 : calcFreq === 'weekly' ? 104 : 60}
                    step="1"
                    value={calcTenure}
                    onChange={(e) => setCalcTenure(parseInt(e.target.value))}
                    className="w-full accent-slate-900 cursor-pointer"
                  />
                </div>

                {/* 4. Payment Method */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                    4. Payment Source
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'razorpay'
                          ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                        <FiCreditCard className="text-orange-500" /> Razorpay Autopay
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Automated recurring UPI / Card mandate
                      </p>
                    </button>

                    {/* Cash Wallet Commented Out
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        paymentMethod === 'wallet'
                          ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs text-slate-800">
                        <span className="flex items-center gap-2">
                          <FiDollarSign className="text-emerald-500" /> Cash Wallet
                        </span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          ₹{wallet?.cash_wallet_balance || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Deduct directly from cash balance
                      </p>
                    </button>
                    */}
                  </div>
                </div>
              </div>

              {/* Projection & Action Card */}
              <div className="lg:col-span-5">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-7 rounded-3xl shadow-xl space-y-5 border border-slate-700/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Projected Maturity Value</p>
                      <h3 className="text-3xl md:text-4xl font-black text-amber-400 mt-1">
                        ₹{calcResults.maturityAmount.toLocaleString('en-IN')}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold">
                      {activeRate}% p.a.
                    </span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-700/80 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Invested:</span>
                      <span className="font-bold text-white">₹{calcResults.totalInvested.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Estimated Returns:</span>
                      <span className="font-bold text-emerald-400">+₹{calcResults.estimatedReturns.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Wealth Gain Ratio:</span>
                      <span className="font-bold text-yellow-300">
                        {calcResults.totalInvested > 0 ? Math.round((calcResults.estimatedReturns / calcResults.totalInvested) * 100) : 0}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-slate-400">Schedule:</span>
                      <span className="font-semibold text-slate-300 capitalize">
                        ₹{calcAmount.toLocaleString('en-IN')} / {calcFreq} × {calcTenure}
                      </span>
                    </div>
                  </div>

                  {/* Primary 1-Click CTA */}
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleStartSIP()}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Setting up SIP...
                      </>
                    ) : (
                      <>
                        Start SIP Now (₹{calcAmount.toLocaleString('en-IN')}/{calcFreq}) <FiArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="space-y-1.5 pt-1 text-[11px] text-slate-400 text-center">
                    <p className="flex items-center justify-center gap-1.5">
                      <FiShield className="text-emerald-400" /> 100% Safe & RBI Compliant Mandate
                    </p>
                    <p className="text-[10px] text-slate-500">
                      No lock-in penalty for regular maturity • Automated periodic debits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Preset Packages Accordion */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPlansList(!showPlansList)}
              className="w-full p-5 flex justify-between items-center text-left hover:bg-slate-50/80 transition-all"
            >
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Prefer Pre-configured Packages? ({plans.length} Available)
                </p>
                <p className="text-xs text-slate-500">
                  Click to inspect our curated pre-packaged Monthly, Weekly and Daily SIP portfolios.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                {showPlansList ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
              </div>
            </button>

            {showPlansList && (
              <div className="p-5 pt-0 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {plans.map((plan) => (
                  <div 
                    key={plan.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-orange-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-semibold text-[10px] uppercase">
                          {plan.frequency} SIP
                        </span>
                        {plan.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                            ★ {plan.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{plan.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{plan.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <span className="font-extrabold text-emerald-600">{plan.interest_rate}% p.a.</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-bold text-slate-700">Min ₹{parseFloat(plan.min_amount).toLocaleString('en-IN')}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{plan.tenure_value} {plan.tenure_type}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCalcFreq(plan.frequency.toLowerCase());
                        setCalcAmount(parseFloat(plan.min_amount) || 1000);
                        setCalcTenure(parseInt(plan.tenure_value) || 12);
                        setShowPlansList(false);
                        window.scrollTo({ top: 120, behavior: 'smooth' });
                        toast.success(`Selected ${plan.name}`);
                      }}
                      className="mt-3 py-2 bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition-all text-center"
                    >
                      Use This Plan ➔
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY SIPS */}
      {activeTab === 'my_sips' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">My Active SIP Subscriptions</h2>
            <button 
              onClick={() => setActiveTab('start')}
              className="text-xs text-orange-600 font-bold hover:underline"
            >
              + Start New SIP
            </button>
          </div>

          {myInvestments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiTrendingUp size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Active SIP Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Start your first daily, weekly or monthly SIP today to grow your savings automatically.
              </p>
              <button
                onClick={() => setActiveTab('start')}
                className="mt-4 px-6 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-orange-600 transition-all"
              >
                Start Your First SIP
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myInvestments.map((inv) => (
                <div key={inv.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase">
                          {inv.frequency} SIP
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {inv.status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{inv.plan_name}</h3>
                      <p className="text-[11px] text-slate-400">Ref: {inv.investment_ref}</p>
                    </div>

                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-400 font-medium">Installment Amount</p>
                      <p className="text-lg font-extrabold text-orange-600">₹{parseFloat(inv.installment_amount).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Total Invested</p>
                      <p className="font-bold text-slate-800">₹{parseFloat(inv.total_principal_invested).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Current Value</p>
                      <p className="font-bold text-emerald-600">₹{inv.current_valuation?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Installments</p>
                      <p className="font-bold text-slate-800">{inv.installments_paid} of {inv.installments_total} Paid</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Maturity Date</p>
                      <p className="font-bold text-slate-800">{new Date(inv.maturity_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span>Progress ({Math.round((inv.installments_paid / inv.installments_total) * 100)}%)</span>
                      <span>Next Due: {inv.next_due_date ? new Date(inv.next_due_date).toLocaleDateString('en-IN') : 'Completed'}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (inv.installments_paid / inv.installments_total) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleWithdraw(inv.id)}
                      className="text-xs text-red-500 font-semibold hover:underline"
                    >
                      {inv.is_matured ? 'Claim Maturity Payout' : 'Premature Break / Withdraw'}
                    </button>

                    {inv.next_pending_installment && inv.status === 'active' && (
                      <button
                        onClick={() => setPayingSIP(inv)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                      >
                        <FiCreditCard size={14} /> Pay Next Due (₹{inv.installment_amount})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* MODAL: PAY INSTALLMENT */}
      {payingSIP && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pay SIP Installment</h3>
                <p className="text-xs text-slate-500">{payingSIP.plan_name}</p>
              </div>
              <button 
                onClick={() => setPayingSIP(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-orange-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-orange-600 font-medium">Due Installment Amount</p>
              <p className="text-2xl font-extrabold text-orange-600 mt-0.5">₹{parseFloat(payingSIP.installment_amount).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-500 mt-1">Due Date: {payingSIP.next_due_date ? new Date(payingSIP.next_due_date).toLocaleDateString('en-IN') : 'Today'}</p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Select Payment Method</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setInstPayMethod('razorpay')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    instPayMethod === 'razorpay' ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">Razorpay Gateway</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">UPI, GPay, Cards</p>
                </button>

                {/* Cash Wallet Commented Out
                <button
                  type="button"
                  onClick={() => setInstPayMethod('wallet')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    instPayMethod === 'wallet' ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">Cash Wallet</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bal: ₹{wallet?.cash_wallet_balance || 0}</p>
                </button>
                */}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayingSIP(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePayInstallment}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : `Pay ₹${payingSIP.installment_amount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
