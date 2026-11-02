import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { buyCoins, getWallet, createRazorpayOrder, getActiveSpinReward } from '../../services/api';
import { FiCheckCircle, FiZap, FiPercent, FiArrowLeft } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';

const DEFAULT_AMOUNTS = [100, 500, 1000, 2000, 5000, 10000];

export default function UserBuyCoins() {
  const [wallet, setWallet]           = useState(null);
  const [success, setSuccess]         = useState(null);
  const [selectedAmt, setSelectedAmt] = useState(100);
  const [customAmt, setCustomAmt]     = useState('100');
  const [loading, setLoading]         = useState(false);
  const [minRecharge, setMinRecharge] = useState(10);
  const [spinReward, setSpinReward]   = useState(null);

  useEffect(() => {
    // 1. Load wallet
    getWallet().then(r => {
      setWallet(r.data.data?.wallet);
      if (r.data.data?.min_recharge_amount) {
        setMinRecharge(r.data.data.min_recharge_amount);
      }
    }).catch(()=>{});

    // 2. Load active spin deposit reward
    getActiveSpinReward().then(r => {
      if (r.data?.success && r.data?.data?.has_active_reward) {
        setSpinReward(r.data.data);
      }
    }).catch(()=>{});
  }, []);

  const coinsRequested = parseInt(customAmt) || selectedAmt || 0;
  
  // Calculate bonus: regular or spin bonus
  let bonusCoins = 0;
  let bonusLabel = '';

  if (spinReward?.has_active_reward) {
    if (spinReward.multiplier && spinReward.multiplier > 1) {
      // 2X Multiplier: user gets coinsRequested * multiplier total
      bonusCoins = Math.floor(coinsRequested * (spinReward.multiplier - 1));
      bonusLabel = `${spinReward.multiplier}X SPIN BONUS`;
    } else if (spinReward.extra_percent && spinReward.extra_percent > 0) {
      bonusCoins = Math.floor(coinsRequested * (spinReward.extra_percent / 100));
      bonusLabel = `${spinReward.extra_percent}% EXTRA COINS BONUS`;
    }
  } else {
    // Standard package bonus if no active spin reward
    if (coinsRequested >= 5000) { bonusCoins = 500; bonusLabel = 'Premium Bonus'; }
    else if (coinsRequested >= 2000) { bonusCoins = 200; bonusLabel = 'Pro Bonus'; }
    else if (coinsRequested >= 1000) { bonusCoins = 100; bonusLabel = 'Popular Bonus'; }
  }

  const totalCoins = coinsRequested + bonusCoins;
  const amtInr    = coinsRequested;

  const handleAmountSelect = (val) => {
    setSelectedAmt(val);
    setCustomAmt(val.toString());
  };

  async function handleBuy() {
    if (!coinsRequested || coinsRequested < minRecharge) {
      return toast.error(`Minimum purchase is ${minRecharge} coins (₹${minRecharge})`);
    }

    setLoading(true);
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load payment gateway'));
          document.body.appendChild(script);
        });
      }

      const orderRes = await createRazorpayOrder({ amount_inr: amtInr });
      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Failed to create payment order');
      }
      const { order_id, amount, key_id } = orderRes.data.data;
      const user = JSON.parse(localStorage.getItem('japsan_user') || '{}');

      const rawPhone = user.phone || '';
      const cleanPhone = rawPhone.replace(/\D/g, '');
      const contactPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

      const options = {
        key: key_id || import.meta.env.VITE_RAZORPAY_KEY || 'rzp_live_TN8KciymYkApmH',
        amount: amount,
        currency: "INR",
        name: "Japsan Pay",
        description: `Deposit of ₹${amtInr} (${totalCoins} coins)`,
        order_id: order_id,
        prefill: {
          contact: contactPhone,
          email: user.email || 'user@japsanpay.com',
          name: user.name || 'Customer'
        },
        handler: async function (response) {
          try {
            const res = await buyCoins({
              coins_requested: coinsRequested,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccess(res.data.data);
            toast.success(res.data.message || 'Coins credited successfully!');
            // Re-fetch active spin reward in case it got claimed
            getActiveSpinReward().then(r => setSpinReward(r.data?.data)).catch(()=>{});
            getWallet().then(r => setWallet(r.data.data?.wallet)).catch(()=>{});
          } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
          }
        },
        theme: { color: "#f97316" }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error?.description || response.error?.reason || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  }

  // SUCCESS SCREEN (MATCHES RIGHT SCREEN IN IMAGE)
  if (success) {
    return (
      <div className="p-4 min-h-[85vh] flex flex-col items-center justify-center fade-in">
        <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative text-white">
          
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-4xl mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
            <FiCheckCircle />
          </div>

          <h3 className="text-xl font-black text-emerald-400 mb-1">Deposit Successful!</h3>
          <p className="text-sm text-slate-300 mb-6">
            आपको मिले <span className="font-extrabold text-amber-300 text-lg">{Number(success.total_coins).toLocaleString()} JC</span>
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Amount Paid</span>
              <span className="font-bold text-white">₹{success.amount_paid_inr}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Base Coins</span>
              <span className="font-bold text-white">{Number(success.coins_purchased).toLocaleString()} JC</span>
            </div>
            {success.bonus_coins > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 font-bold border-t border-white/10 pt-1.5">
                <span>Extra / Bonus Coins</span>
                <span>+{Number(success.bonus_coins).toLocaleString()} JC</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-amber-300 font-black border-t border-white/10 pt-2">
              <span>Total Credited</span>
              <span>{Number(success.total_coins).toLocaleString()} JC</span>
            </div>
          </div>

          <button
            onClick={() => { setSuccess(null); window.location.href = '/user/dashboard'; }}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 text-slate-950 font-black rounded-2xl shadow-lg transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto fade-in pb-24 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-slate-600 hover:bg-slate-200 p-2 rounded-full">
          <FiArrowLeft size={22} />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900">Deposit / Buy Coins</h2>
          <p className="text-xs text-slate-500">1 JC = ₹1.00</p>
        </div>
      </div>

      {/* ACTIVE SPIN & WIN REWARD BANNER (MATCHES IMAGE FLOW 1 & 2) */}
      {spinReward?.has_active_reward && (
        <div className="relative overflow-hidden rounded-3xl p-5 shadow-xl text-white bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 animate-pulse border-2 border-yellow-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-black/30 backdrop-blur-md text-yellow-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FiZap /> SPIN & WIN REWARD ACTIVE
              </span>
              <span className="text-2xl font-black text-yellow-200">
                {spinReward.multiplier ? `${spinReward.multiplier}X` : `${spinReward.extra_percent}%`}
              </span>
            </div>
            
            <h3 className="text-lg font-black text-white leading-tight mb-1">
              {spinReward.banner_title}
            </h3>
            <p className="text-xs text-amber-100 font-medium">
              {spinReward.banner_text}
            </p>
          </div>
        </div>
      )}

      {/* Current Wallet Balance */}
      {wallet && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <FaCoins />
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Balance</p>
              <p className="text-sm font-bold text-slate-800">{Number(wallet.coin_balance || 0).toLocaleString()} JC</p>
            </div>
          </div>
          <button onClick={() => window.location.href = '/user/spin-win'} className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition">
            🎰 Spin & Win
          </button>
        </div>
      )}

      {/* QUICK SELECT AMOUNTS (MATCHES SCREEN 1 & 2 IN IMAGE: ₹100, ₹500, ₹1000, ₹2000, ₹5000, ₹10000) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Deposit Amount
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {DEFAULT_AMOUNTS.map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => handleAmountSelect(amt)}
                className={`py-3 px-2 rounded-2xl font-bold text-sm border-2 transition-all ${
                  coinsRequested === amt
                    ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-slate-300'
                }`}
              >
                ₹{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Or Enter Custom Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-base">₹</span>
            <input
              type="number"
              min={minRecharge}
              value={customAmt}
              onChange={e => {
                setCustomAmt(e.target.value);
                setSelectedAmt(null);
              }}
              placeholder={`Min ₹${minRecharge}`}
              className="w-full pl-8 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-orange-500 focus:outline-none font-bold text-base text-slate-800"
            />
          </div>
        </div>

        {/* CALCULATION BREAKDOWN */}
        {coinsRequested > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Deposit Amount</span>
              <span className="font-bold text-slate-800">₹{amtInr}</span>
            </div>
            
            <div className="flex justify-between text-xs text-slate-600">
              <span>Base JC</span>
              <span className="font-bold text-slate-800">{coinsRequested.toLocaleString()} JC</span>
            </div>

            {bonusCoins > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold border-t border-slate-200/60 pt-1.5">
                <span>{bonusLabel || 'Bonus JC'}</span>
                <span>+{bonusCoins.toLocaleString()} JC</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
              <span>You Will Receive</span>
              <span className="text-orange-600 text-base">{totalCoins.toLocaleString()} JC</span>
            </div>
          </div>
        )}

        {/* DEPOSIT NOW BUTTON */}
        <button
          onClick={handleBuy}
          disabled={loading || coinsRequested < minRecharge}
          className="w-full py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-105 active:scale-[0.99] text-white font-black text-lg rounded-2xl shadow-lg shadow-orange-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing Payment...' : `DEPOSIT NOW (₹${amtInr || 0})`}
        </button>

      </div>

    </div>
  );
}
