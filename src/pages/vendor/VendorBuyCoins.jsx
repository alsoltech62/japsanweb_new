import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { buyCoins, getWallet, createRazorpayOrder } from '../../services/api';

const PACKAGES = [
  { coins:100,   bonus:0,    label:'Starter',  popular:false },
  { coins:500,   bonus:0,    label:'Regular',  popular:false },
  { coins:1000,  bonus:100,  label:'Popular',  popular:true  },
  { coins:2000,  bonus:200,  label:'Pro',      popular:false },
  { coins:5000,  bonus:500,  label:'Premium',  popular:false },
];

export default function VendorBuyCoins() {
  const [selected, setSelected] = useState(null);
  const [custom, setCustom]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [minRecharge, setMinRecharge] = useState(10);

  useEffect(() => {
    getWallet().then(r => {
      setWallet(r.data.data?.wallet);
      if (r.data.data?.min_recharge_amount) {
        setMinRecharge(r.data.data.min_recharge_amount);
      }
    }).catch(()=>{});
  }, []);

  const coins   = selected ? selected.coins : (parseInt(custom)||0);
  const bonus   = selected ? selected.bonus : 0;
  const total   = coins + bonus;
  const amtInr  = coins;

  async function handleBuy() {
    if (!coins || coins < minRecharge) return toast.error(`Minimum purchase is ${minRecharge} coins (₹${minRecharge})`);
    setLoading(true);
    try {
      // Ensure Razorpay SDK is loaded
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
        description: `Purchase of ${coins} coins`,
        order_id: order_id,
        prefill: {
          contact: contactPhone,
          email: user.email || 'vendor@japsanpay.com',
          name: user.business_name || user.owner_name || user.name || 'Vendor'
        },
        handler: async function (response) {
          try {
            const res = await buyCoins({
              coins_requested: coins,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccess(res.data.data);
            toast.success(res.data.message || 'Coins credited successfully!');
            getWallet().then(r => setWallet(r.data.data?.wallet)).catch(()=>{});
          } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
          }
        },
        theme: { color: "#f97316" } // orange-500
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description || response.error.reason || 'Payment failed');
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  }

  if (success) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] slide-up">
      <div className="text-7xl mb-4">🎉</div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Coins Purchased!</h2>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow border border-orange-100 text-center">
        <p className="text-5xl font-black text-orange-500">{Number(success.total_coins).toLocaleString()}</p>
        <p className="text-slate-500 mt-1">Total Coins Added</p>
        {success.bonus_coins > 0 && <p className="mt-2 badge badge-success mx-auto">+{success.bonus_coins} Bonus Coins!</p>}
        <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
          <p>Amount Paid: <strong>₹{success.amount_paid_inr}</strong></p>
          <p>Ref: <span className="font-mono text-xs">{success.transaction_ref}</span></p>
        </div>
      </div>
      <button onClick={() => setSuccess(null)} className="btn-secondary mt-6">Buy More Coins</button>
    </div>
  );

  return (
    <div className="p-4 space-y-4 fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2 className="text-xl font-bold text-slate-800">🛒 Buy Coins</h2>
      </div>
      {wallet && (
        <div className="bg-orange-50 rounded-2xl p-3 flex items-center gap-2 text-sm">
          <span>🪙</span>
          <span className="text-orange-700">Current Balance: <strong>{Number(wallet.coin_balance||0).toLocaleString()} coins</strong></span>
        </div>
      )}

      {/* Packages */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-3">Select Package</p>
        <div className="grid grid-cols-2 gap-3">
          {PACKAGES.map(pkg => (
            <button key={pkg.coins} onClick={() => { setSelected(pkg); setCustom(''); }}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${selected?.coins === pkg.coins ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-300'}`}>
              {pkg.popular && <span className="absolute -top-2 right-3 badge badge-success text-xs">POPULAR</span>}
              <p className="text-lg font-black text-slate-800">{pkg.coins.toLocaleString()} 🪙</p>
              {pkg.bonus > 0 && <p className="text-xs font-semibold text-green-600">+{pkg.bonus} bonus coins!</p>}
              <p className="text-sm text-slate-500 mt-1">= ₹{pkg.coins}</p>
              <p className="text-xs font-medium text-slate-400">{pkg.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">Or enter custom amount</p>
        <input className="input-field" type="number" placeholder="Enter coins (min 100)" min={100} value={custom}
          onChange={e => { setCustom(e.target.value); setSelected(null); }} />
      </div>

      {/* Summary */}
      {coins > 0 && (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-slate-600">Coins</span><span className="font-semibold">{coins.toLocaleString()}</span></div>
          {bonus > 0 && <div className="flex justify-between text-sm text-green-600"><span>Bonus Coins</span><span className="font-semibold">+{bonus.toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold border-t border-slate-200 pt-2"><span>Total Coins</span><span className="text-orange-500">{total.toLocaleString()} 🪙</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-600">Amount to Pay</span><span className="font-bold text-slate-800">₹{amtInr}</span></div>
        </div>
      )}

      <button onClick={handleBuy} disabled={loading||!coins} className="btn-primary w-full text-lg mt-6 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? '⏳ Processing...' : `💰 Buy ${total>0?total.toLocaleString()+' Coins':'Coins'}`}
      </button>
    </div>
  );
}
