import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FiLock, FiRepeat, FiAward, FiShield, FiPercent, FiArrowRight, 
  FiCalendar, FiCreditCard, FiCheckCircle, FiClock, FiDollarSign 
} from 'react-icons/fi';
import { 
  getInvestmentPlans, getMyInvestments, createInvestmentOrder, 
  startInvestment, payInvestmentInstallment, withdrawInvestment, getWallet 
} from '../../services/api';

export default function UserFDRD() {
  const [section, setSection] = useState('fd'); // 'fd' or 'rd'
  const [subTab, setSubTab] = useState('plans'); // 'plans', 'active', 'calculator'
  
  const [plans, setPlans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  // FD Calculator State
  const [fdAmount, setFdAmount] = useState(10000);
  const [fdRate, setFdRate] = useState(11);
  const [fdTenureMonths, setFdTenureMonths] = useState(12);

  // RD Calculator State
  const [rdAmount, setRdAmount] = useState(2000);
  const [rdRate, setRdRate] = useState(12);
  const [rdMonths, setRdMonths] = useState(12);

  // Modals
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [actionLoading, setActionLoading] = useState(false);

  // RD Installment Payment Modal
  const [payingRD, setPayingRD] = useState(null);
  const [instPayMethod, setInstPayMethod] = useState('razorpay');

  useEffect(() => {
    loadData(section);
  }, [section]);

  async function loadData(currentType) {
    setLoading(true);
    try {
      const [plansRes, invRes, walletRes] = await Promise.all([
        getInvestmentPlans({ type: currentType }),
        getMyInvestments({ type: currentType }),
        getWallet()
      ]);

      if (plansRes.data?.success) setPlans(plansRes.data.data || []);
      if (invRes.data?.success) {
        setMyInvestments(invRes.data.data?.investments || []);
        setSummary(invRes.data.data?.summary || null);
      }
      if (walletRes.data?.success) {
        setWallet(walletRes.data.data?.wallet || null);
      }
    } catch (err) {
      toast.error(`Failed to load ${currentType.toUpperCase()} information`);
    } finally {
      setLoading(false);
    }
  }

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

  // FD Formula
  function calculateFDResult(principal, annualRate, months) {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(annualRate) || 0) / 100;
    const t = (parseInt(months) || 1) / 12;
    const k = 4; // quarterly compounding
    const maturity = p * Math.pow(1 + (r / k), k * t);
    const interest = Math.max(0, maturity - p);
    return {
      principal: Math.round(p),
      interest: Math.round(interest),
      maturity: Math.round(maturity)
    };
  }

  // RD Formula
  function calculateRDResult(monthlyDeposit, annualRate, months) {
    const p = parseFloat(monthlyDeposit) || 0;
    const n = parseInt(months) || 1;
    const r = ((parseFloat(annualRate) || 0) / 100) / 12;
    const totalInvested = p * n;
    let maturity = totalInvested;
    if (r > 0 && p > 0) {
      maturity = p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    }
    const interest = Math.max(0, maturity - totalInvested);
    return {
      totalInvested: Math.round(totalInvested),
      interest: Math.round(interest),
      maturity: Math.round(maturity)
    };
  }

  const fdCalc = calculateFDResult(fdAmount, fdRate, fdTenureMonths);
  const rdCalc = calculateRDResult(rdAmount, rdRate, rdMonths);

  // Handle Start FD or RD
  async function handleStartDeposit() {
    if (!selectedPlan) return;
    const amt = parseFloat(depositAmount);
    if (!amt || amt < selectedPlan.min_amount) {
      return toast.error(`Minimum amount is ₹${selectedPlan.min_amount}`);
    }
    if (selectedPlan.max_amount && amt > selectedPlan.max_amount) {
      return toast.error(`Maximum amount is ₹${selectedPlan.max_amount}`);
    }

    setActionLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        const res = await startInvestment({
          plan_id: selectedPlan.id,
          amount: amt,
          payment_method: 'wallet'
        });
        if (res.data?.success) {
          toast.success(`🎉 ${selectedPlan.plan_type.toUpperCase()} deposit opened successfully!`);
          setSelectedPlan(null);
          setDepositAmount('');
          loadData(section);
          setSubTab('active');
        }
      } else {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) throw new Error('Razorpay SDK failed to load');

        const orderRes = await createInvestmentOrder({
          amount_inr: amt,
          investment_type: selectedPlan.plan_type,
          plan_id: selectedPlan.id
        });

        if (!orderRes.data?.success) throw new Error(orderRes.data?.message || 'Failed to create payment order');
        const { order_id, amount, key_id } = orderRes.data.data;
        const user = JSON.parse(localStorage.getItem('japsan_user') || '{}');

        const options = {
          key: key_id || 'rzp_live_TN8KciymYkApmH',
          amount: amount,
          currency: 'INR',
          name: 'Japsan Pay',
          description: `${selectedPlan.plan_type.toUpperCase()} Deposit - ${selectedPlan.name}`,
          order_id: order_id,
          prefill: {
            contact: (user.phone || '').replace(/\D/g, '').slice(-10),
            email: user.email || 'user@japsanpay.com',
            name: user.name || 'Investor'
          },
          handler: async function (response) {
            try {
              const res = await startInvestment({
                plan_id: selectedPlan.id,
                amount: amt,
                payment_method: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              if (res.data?.success) {
                toast.success(`🎉 ${selectedPlan.plan_type.toUpperCase()} opened successfully with Razorpay!`);
                setSelectedPlan(null);
                setDepositAmount('');
                loadData(section);
                setSubTab('active');
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          theme: { color: '#0ea5e9' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast.error(resp.error?.description || 'Payment cancelled or failed');
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Deposit initiation failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Pay RD Installment
  async function handlePayRDInstallment() {
    if (!payingRD) return;
    const amt = parseFloat(payingRD.installment_amount);
    setActionLoading(true);

    try {
      if (instPayMethod === 'wallet') {
        const res = await payInvestmentInstallment({
          investment_id: payingRD.id,
          payment_method: 'wallet'
        });
        if (res.data?.success) {
          toast.success('✅ RD installment paid successfully!');
          setPayingRD(null);
          loadData(section);
        }
      } else {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) throw new Error('Razorpay SDK failed to load');

        const orderRes = await createInvestmentOrder({
          amount_inr: amt,
          investment_type: 'rd',
          investment_id: payingRD.id
        });

        if (!orderRes.data?.success) throw new Error(orderRes.data?.message || 'Failed to create payment order');
        const { order_id, amount, key_id } = orderRes.data.data;
        const user = JSON.parse(localStorage.getItem('japsan_user') || '{}');

        const options = {
          key: key_id || 'rzp_live_TN8KciymYkApmH',
          amount: amount,
          currency: 'INR',
          name: 'Japsan Pay',
          description: `RD Installment Payment - ${payingRD.plan_name}`,
          order_id: order_id,
          prefill: {
            contact: (user.phone || '').replace(/\D/g, '').slice(-10),
            email: user.email || 'user@japsanpay.com',
            name: user.name || 'Investor'
          },
          handler: async function (response) {
            try {
              const res = await payInvestmentInstallment({
                investment_id: payingRD.id,
                payment_method: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              });
              if (res.data?.success) {
                toast.success('✅ RD Installment paid successfully with Razorpay!');
                setPayingRD(null);
                loadData(section);
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment verification failed');
            }
          },
          theme: { color: '#0ea5e9' }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          toast.error(resp.error?.description || 'Payment failed');
        });
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Handle Withdraw / Break Deposit
  async function handleWithdraw(invId, typeName) {
    if (!window.confirm(`Are you sure you want to withdraw / close this ${typeName}? Accrued interest minus early withdrawal penalty will be credited to your cash wallet.`)) return;
    try {
      const res = await withdrawInvestment({ investment_id: invId });
      if (res.data?.success) {
        toast.success(`🎉 Payout of ₹${res.data.data?.payout_amount} credited to your Cash Wallet!`);
        loadData(section);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Main Section Switcher */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl flex max-w-md mx-auto shadow-inner">
        <button
          onClick={() => { setSection('fd'); setSubTab('plans'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            section === 'fd' ? 'bg-white text-sky-700 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FiLock size={15} /> Fixed Deposit (FD)
        </button>
        <button
          onClick={() => { setSection('rd'); setSubTab('plans'); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            section === 'rd' ? 'bg-white text-indigo-700 shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FiRepeat size={15} /> Recurring Deposit (RD)
        </button>
      </div>

      {/* Header Banner */}
      <div className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden transition-colors duration-300 ${
        section === 'fd' 
          ? 'bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800' 
          : 'bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-800'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-2">
              <FiShield className="text-yellow-300" /> Guaranteed High Returns • 100% Safe
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {section === 'fd' ? 'Fixed Deposits (FD)' : 'Recurring Deposits (RD)'}
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              {section === 'fd' 
                ? 'Lock in high fixed interest rates up to 14.0% p.a. with flexible tenure from 6 months to 5 years.' 
                : 'Deposit a fixed amount monthly and earn compounded interest rates up to 15.0% p.a. at maturity.'}
            </p>
          </div>

          <div className="flex bg-black/20 p-1.5 rounded-2xl backdrop-blur-md self-stretch md:self-auto justify-between">
            <button
              onClick={() => setSubTab('plans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'plans' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setSubTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'active' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              My Deposits {myInvestments.length > 0 && <span className="bg-sky-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{myInvestments.length}</span>}
            </button>
            <button
              onClick={() => setSubTab('calculator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                subTab === 'calculator' ? 'bg-white text-slate-900 shadow-md' : 'text-white/80 hover:text-white'
              }`}
            >
              Calculator
            </button>
          </div>
        </div>

        {/* Summary metrics if available */}
        {summary && summary.total_invested > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/20">
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Active Capital</p>
              <p className="text-lg font-bold">₹{summary.total_invested?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Current Valuation</p>
              <p className="text-lg font-bold text-emerald-300">₹{summary.total_current_value?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Accrued Interest</p>
              <p className="text-lg font-bold text-yellow-300">+₹{summary.total_accrued_returns?.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-200">Active Deposits</p>
              <p className="text-lg font-bold">{myInvestments.length} Deposits</p>
            </div>
          </div>
        )}
      </div>

      {/* SUBTAB 1: PLANS */}
      {subTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              Available {section.toUpperCase()} Schemes
            </h2>
            <span className="text-xs text-slate-500 font-medium">{plans.length} schemes found</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] uppercase tracking-wider">
                      {plan.tenure_value} {plan.tenure_type}
                    </span>
                    {plan.badge && (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                        ★ {plan.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 my-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Interest Rate</p>
                      <p className="text-base font-extrabold text-sky-600">{plan.interest_rate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Min Deposit</p>
                      <p className="text-sm font-bold text-slate-800">₹{parseFloat(plan.min_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Compounding</p>
                      <p className="text-sm font-bold text-slate-800 capitalize">{plan.compounding_frequency}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setDepositAmount(plan.min_amount);
                  }}
                  className={`w-full mt-2 py-3 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                    section === 'fd'
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-sky-600/20'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/20'
                  }`}
                >
                  {section === 'fd' ? 'Open Fixed Deposit' : 'Start Recurring Deposit'} <FiArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: MY DEPOSITS */}
      {subTab === 'active' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">
              My Active {section.toUpperCase()} Holdings
            </h2>
            <button 
              onClick={() => setSubTab('plans')}
              className="text-xs text-sky-600 font-bold hover:underline"
            >
              + Open New Deposit
            </button>
          </div>

          {myInvestments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiLock size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Active {section.toUpperCase()} Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Secure your money with guaranteed returns by opening your first {section === 'fd' ? 'Fixed Deposit' : 'Recurring Deposit'}.
              </p>
              <button
                onClick={() => setSubTab('plans')}
                className="mt-4 px-6 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-sky-700 transition-all"
              >
                Explore Schemes
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myInvestments.map((inv) => (
                <div key={inv.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                          {inv.investment_type.toUpperCase()} • {inv.interest_rate}% p.a.
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
                      <p className="text-xs text-slate-400 font-medium">Principal Amount</p>
                      <p className="text-lg font-extrabold text-slate-900">₹{parseFloat(inv.total_principal_invested).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Current Valuation</p>
                      <p className="font-bold text-emerald-600">₹{inv.current_valuation?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Accrued Interest</p>
                      <p className="font-bold text-yellow-600">+₹{inv.accrued_interest?.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Expected Maturity</p>
                      <p className="font-bold text-blue-600">₹{parseFloat(inv.expected_maturity_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Maturity Date</p>
                      <p className="font-bold text-slate-800">{new Date(inv.maturity_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                      <span>Tenure Elapsed ({inv.days_elapsed} of {inv.total_days} days)</span>
                      <span>{inv.progress_percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${inv.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleWithdraw(inv.id, inv.investment_type.toUpperCase())}
                      className="text-xs text-red-500 font-semibold hover:underline"
                    >
                      {inv.is_matured ? 'Claim Maturity Settlement' : 'Premature Break / Withdraw'}
                    </button>

                    {inv.investment_type === 'rd' && inv.next_pending_installment && inv.status === 'active' && (
                      <button
                        onClick={() => setPayingRD(inv)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <FiCreditCard size={14} /> Pay RD Installment (₹{inv.installment_amount})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: CALCULATOR */}
      {subTab === 'calculator' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {section === 'fd' ? 'Fixed Deposit (FD) Calculator' : 'Recurring Deposit (RD) Calculator'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Estimate your guaranteed returns based on deposit tenure and interest rates.
            </p>
          </div>

          {section === 'fd' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                {/* Deposit Amount Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Total Deposit Amount</label>
                    <span className="text-sm font-extrabold text-sky-600">₹{fdAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range"
                    min="1000"
                    max="500000"
                    step="1000"
                    value={fdAmount}
                    onChange={(e) => setFdAmount(parseInt(e.target.value))}
                    className="w-full accent-sky-600 cursor-pointer"
                  />
                </div>

                {/* Interest Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Interest Rate (% p.a.)</label>
                    <span className="text-sm font-extrabold text-emerald-600">{fdRate}%</span>
                  </div>
                  <input 
                    type="range"
                    min="6"
                    max="16"
                    step="0.25"
                    value={fdRate}
                    onChange={(e) => setFdRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Duration */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Tenure (Months)</label>
                    <span className="text-sm font-extrabold text-slate-800">{fdTenureMonths} Months ({Math.round((fdTenureMonths/12)*10)/10} Yrs)</span>
                  </div>
                  <input 
                    type="range"
                    min="3"
                    max="60"
                    step="3"
                    value={fdTenureMonths}
                    onChange={(e) => setFdTenureMonths(parseInt(e.target.value))}
                    className="w-full accent-slate-800 cursor-pointer"
                  />
                </div>
              </div>

              {/* Visual Result */}
              <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white p-6 rounded-3xl shadow-xl space-y-4">
                <p className="text-xs text-sky-300 font-semibold uppercase tracking-wider">FD Maturity Value</p>
                <h3 className="text-3xl font-extrabold text-amber-300">
                  ₹{fdCalc.maturity.toLocaleString('en-IN')}
                </h3>

                <div className="space-y-3 pt-3 border-t border-slate-700 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Principal Deposit:</span>
                    <span className="font-bold text-white">₹{fdCalc.principal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Interest Earned:</span>
                    <span className="font-bold text-emerald-400">+₹{fdCalc.interest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Compounding:</span>
                    <span className="font-bold text-sky-300">Quarterly Reinvested</span>
                  </div>
                </div>

                <button
                  onClick={() => setSubTab('plans')}
                  className="w-full mt-4 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg"
                >
                  Book This Fixed Deposit
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-4">
                {/* RD Amount Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Monthly Deposit Amount</label>
                    <span className="text-sm font-extrabold text-indigo-600">₹{rdAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <input 
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={rdAmount}
                    onChange={(e) => setRdAmount(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* RD Rate */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Interest Rate (% p.a.)</label>
                    <span className="text-sm font-extrabold text-emerald-600">{rdRate}%</span>
                  </div>
                  <input 
                    type="range"
                    min="6"
                    max="18"
                    step="0.5"
                    value={rdRate}
                    onChange={(e) => setRdRate(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Duration */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Duration (Months)</label>
                    <span className="text-sm font-extrabold text-slate-800">{rdMonths} Months</span>
                  </div>
                  <input 
                    type="range"
                    min="6"
                    max="36"
                    step="6"
                    value={rdMonths}
                    onChange={(e) => setRdMonths(parseInt(e.target.value))}
                    className="w-full accent-slate-800 cursor-pointer"
                  />
                </div>
              </div>

              {/* Visual Result */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-xl space-y-4">
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">RD Maturity Corpus</p>
                <h3 className="text-3xl font-extrabold text-yellow-300">
                  ₹{rdCalc.maturity.toLocaleString('en-IN')}
                </h3>

                <div className="space-y-3 pt-3 border-t border-slate-700 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Monthly Deposits:</span>
                    <span className="font-bold text-white">₹{rdCalc.totalInvested.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Total Interest Earned:</span>
                    <span className="font-bold text-emerald-400">+₹{rdCalc.interest.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSubTab('plans')}
                  className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs transition-all shadow-lg"
                >
                  Start Recurring Deposit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: OPEN DEPOSIT (FD or RD) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                  {selectedPlan.plan_type.toUpperCase()} • {selectedPlan.interest_rate}% p.a.
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedPlan.name}</h3>
                <p className="text-xs text-slate-500">Tenure: {selectedPlan.tenure_value} {selectedPlan.tenure_type}</p>
              </div>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {selectedPlan.plan_type === 'fd' ? 'Lump-Sum Deposit Amount (₹)' : 'Monthly Deposit Amount (₹)'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold">₹</span>
                <input 
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Min ₹${selectedPlan.min_amount}`}
                  className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-sky-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Min: ₹{selectedPlan.min_amount} {selectedPlan.max_amount && `• Max: ₹${selectedPlan.max_amount}`}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Select Payment Source</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'razorpay' ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-600/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">Razorpay Gateway</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">UPI, Cards, NetBanking</p>
                </button>

                {/* Cash Wallet Commented Out
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wallet')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    paymentMethod === 'wallet' ? 'border-sky-600 bg-sky-50/50 ring-2 ring-sky-600/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-800">Cash Wallet</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Bal: ₹{wallet?.cash_wallet_balance || 0}</p>
                </button>
                */}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleStartDeposit}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm & Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAY RD INSTALLMENT */}
      {payingRD && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Pay Monthly RD Installment</h3>
                <p className="text-xs text-slate-500">{payingRD.plan_name}</p>
              </div>
              <button 
                onClick={() => setPayingRD(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl text-center">
              <p className="text-xs text-indigo-700 font-medium">Monthly Installment Amount</p>
              <p className="text-2xl font-extrabold text-indigo-700 mt-0.5">₹{parseFloat(payingRD.installment_amount).toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-slate-500 mt-1">Due Date: {payingRD.next_due_date ? new Date(payingRD.next_due_date).toLocaleDateString('en-IN') : 'Today'}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">Select Payment Method</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setInstPayMethod('razorpay')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    instPayMethod === 'razorpay' ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20' : 'border-slate-200 hover:border-slate-300'
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
                    instPayMethod === 'wallet' ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20' : 'border-slate-200 hover:border-slate-300'
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
                onClick={() => setPayingRD(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePayRDInstallment}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : `Pay ₹${payingRD.installment_amount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
