import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { processPayment, createRazorpayOrder, getWallet } from '../../services/api';

export default function VendorPayment() {
  const [activeTab, setActiveTab]   = useState('reward'); // 'reward' (direct coins) or 'bill' (billing)
  const [phone, setPhone]           = useState('');
  
  // Direct Reward State
  const [rewardCoins, setRewardCoins] = useState('');
  const [rewardNote, setRewardNote]   = useState('');

  // Billing State
  const [bill, setBill]             = useState('');
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [method, setMethod]         = useState('cash'); // default to 'cash' for direct in-store billing
  const [manualBonus, setManualBonus] = useState('');

  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [wallet, setWallet]         = useState(null);
  const navigate                    = useNavigate();

  useEffect(() => {
    fetchWallet();
  }, []);

  function fetchWallet() {
    getWallet().then(r => setWallet(r.data.data?.wallet)).catch(() => {});
  }

  const vendorBalance = parseFloat(wallet?.coin_balance || 0);

  // Bill Calculations
  const billAmt   = parseFloat(bill) || 0;
  const discount  = coinsToUse * 0.7;
  const cashToPay = Math.max(0, billAmt - discount).toFixed(2);

  // Handle Direct Reward (Send Coins from Wallet)
  async function handleDirectReward() {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return toast.error('Please enter a valid 10-digit customer mobile number');
    }
    const coins = parseFloat(rewardCoins);
    if (!coins || coins <= 0) {
      return toast.error('Please enter the number of coins to give');
    }
    if (coins > vendorBalance) {
      return toast.error(`Insufficient balance! You have ${vendorBalance.toLocaleString()} JC in your wallet.`);
    }

    setLoading(true);
    try {
      const payload = {
        user_phone: cleanPhone,
        bill_amount: 0,
        manual_bonus_coins: coins,
        payment_method: 'cash',
        note: rewardNote || 'Direct Vendor Reward'
      };

      const res = await processPayment(payload);
      setResult(res.data.data);
      toast.success(res.data.message || `Successfully sent ${coins} JC to customer!`);
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reward coins');
    } finally {
      setLoading(false);
    }
  }

  // Handle Billing Customer
  async function handleProcessBill() {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return toast.error('Please enter a valid 10-digit customer mobile number');
    }
    if (!billAmt || billAmt <= 0) {
      return toast.error('Please enter a valid bill amount');
    }

    setLoading(true);
    try {
      const payload = { 
        user_phone: cleanPhone, 
        bill_amount: billAmt, 
        coins_to_use: coinsToUse, 
        payment_method: 'cash',
        manual_bonus_coins: manualBonus ? parseFloat(manualBonus) : 0
      };

      const res = await processPayment(payload);
      setResult(res.data.data);
      toast.success(res.data.message || 'Bill processed and reward coins credited!');
      fetchWallet();
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to process transaction'); 
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setPhone('');
    setRewardCoins('');
    setRewardNote('');
    setBill('');
    setCoinsToUse(0);
    setManualBonus('');
  }

  if (result) return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[70vh] slide-up">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-4 shadow-md">
        ✓
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-1">Transaction Successful!</h2>
      <p className="text-slate-500 text-sm mb-6">Reward and transaction recorded on blockchain ledger</p>

      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-md border border-green-100 space-y-3.5">
        {result.bill_amount > 0 ? (
          <>
            {[
              ['Total Bill Amount',    `₹${Number(result.bill_amount).toFixed(2)}`],
              ['Coins Redeemed by Customer',     `${Number(result.coins_used).toLocaleString()} 🪙`],
              ['Discount Applied',  `₹${Number(result.coin_discount).toFixed(2)}`],
              ['Cash / Store Collected', `₹${Number(result.cash_paid).toFixed(2)}`],
              ['Cashback Given to Customer', `${Number(result.cashback_coins).toLocaleString()} 🪙`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 font-medium">{label}</span>
                <span className="font-bold text-slate-800 text-sm">{val}</span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500 font-medium">Transaction Type</span>
              <span className="font-bold text-orange-600 text-sm">🎁 Direct Reward Gift</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500 font-medium">Coins Given from Wallet</span>
              <span className="font-bold text-green-600 text-base">{Number(result.cashback_coins).toLocaleString()} 🪙 JC</span>
            </div>
          </>
        )}
        
        {result.vendor_coin_balance !== undefined && (
          <div className="bg-orange-50 p-3 rounded-2xl flex justify-between items-center">
            <span className="text-xs text-orange-800 font-bold">Your Remaining Balance:</span>
            <span className="font-black text-orange-600 text-sm">{Number(result.vendor_coin_balance).toLocaleString()} JC</span>
          </div>
        )}

        <p className="text-[11px] text-slate-400 text-center font-mono pt-1">Ref: {result.transaction_ref}</p>
      </div>

      <button onClick={handleReset} className="btn-primary mt-6 w-full max-w-sm text-base py-3">
        + New Transaction / Reward
      </button>
    </div>
  );

  return (
    <div className="p-4 space-y-4 fade-in max-w-lg mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={() => window.history.back()} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="22" width="22" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">Customer Rewards & Billing</h2>
            <p className="text-xs text-slate-500">Reward customers directly from your coin balance</p>
          </div>
        </div>
      </div>

      {/* Vendor Coin Balance Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-4.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
            🪙
          </div>
          <div>
            <p className="text-[11px] text-orange-100 font-medium uppercase tracking-wider">Your Reward Coin Balance</p>
            <h3 className="text-2xl font-black">{vendorBalance.toLocaleString()} <span className="text-orange-200 text-lg">JC</span></h3>
          </div>
        </div>
        <button 
          type="button" 
          onClick={() => navigate('/vendor/buy-coins')} 
          className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs px-3.5 py-2 rounded-2xl shadow-sm transition-all flex items-center gap-1 active:scale-95"
        >
          <span>+</span> Buy Coins
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
        <button 
          onClick={() => setActiveTab('reward')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'reward' 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🎁</span> Give Direct Coins
        </button>
        <button 
          onClick={() => setActiveTab('bill')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'bill' 
              ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🧾</span> Bill & Cashback
        </button>
      </div>

      {/* TAB 1: GIVE DIRECT REWARD COINS */}
      {activeTab === 'reward' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="bg-amber-50/80 border border-amber-200/60 p-3.5 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-lg leading-none">💡</span>
            <p className="leading-relaxed">
              <strong>Direct Reward:</strong> Reward any customer with Japsan Coins directly from your wallet balance. No UPI/Card or gateway payment required!
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center px-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm">+91</div>
              <input 
                className="input-field text-base font-semibold" 
                type="tel" 
                placeholder="Enter 10-digit mobile" 
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Coins to Give (JC 🪙)</label>
            <div className="relative">
              <input 
                className="input-field text-xl font-black text-orange-600 pr-14" 
                type="number" 
                placeholder="0" 
                min="1"
                value={rewardCoins} 
                onChange={e => setRewardCoins(e.target.value)} 
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-xl">
                JC 🪙
              </span>
            </div>

            {/* Quick Coin Selectors */}
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100, 250].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRewardCoins(amt.toString())}
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-orange-50 hover:border-orange-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-orange-600 transition-all"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reward Reason / Note (Optional)</label>
            <input 
              className="input-field text-xs" 
              type="text" 
              placeholder="e.g. Festival bonus, regular customer gift" 
              value={rewardNote}
              onChange={e => setRewardNote(e.target.value)} 
            />
          </div>

          {parseFloat(rewardCoins) > 0 && (
            <div className="bg-slate-50 rounded-2xl p-3.5 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Deducted from your balance:</span>
                <span className="font-bold text-orange-600">-{parseFloat(rewardCoins).toLocaleString()} JC</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Credited to customer wallet:</span>
                <span className="font-bold text-green-600">+{parseFloat(rewardCoins).toLocaleString()} JC</span>
              </div>
            </div>
          )}

          <button 
            onClick={handleDirectReward} 
            disabled={loading || !phone || !rewardCoins || parseFloat(rewardCoins) <= 0} 
            className="btn-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
          >
            {loading ? '⏳ Sending Coins...' : '🎁 Send Reward Coins from Wallet'}
          </button>
        </div>
      )}

      {/* TAB 2: BILL CUSTOMER & GIVE CASHBACK */}
      {activeTab === 'bill' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="bg-blue-50/80 border border-blue-200/60 p-3.5 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
            <span className="text-lg leading-none">🧾</span>
            <p className="leading-relaxed">
              <strong>Store Counter Billing:</strong> Enter customer bill amount. Customer can redeem their coins for discount, and you reward them with cashback from your coin wallet!
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Customer Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center px-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm">+91</div>
              <input 
                className="input-field text-base font-semibold" 
                type="tel" 
                placeholder="Enter customer's 10-digit phone" 
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                maxLength={10}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Total Bill Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
              <input 
                className="input-field text-xl font-black pl-8" 
                type="number" 
                placeholder="0.00" 
                min="0" 
                step="0.01"
                value={bill} 
                onChange={e => setBill(e.target.value)} 
              />
            </div>
          </div>

          {billAmt > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Customer Coins to Redeem: <strong className="text-orange-500">{coinsToUse.toLocaleString()} 🪙</strong>
                </label>
                <input 
                  type="range" 
                  min={0} 
                  max={Math.min(500, Math.floor(billAmt / 0.7))} 
                  step={10} 
                  value={coinsToUse}
                  onChange={e => setCoinsToUse(parseInt(e.target.value))} 
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>0 (No discount)</span>
                  <span>Max: {Math.min(500, Math.floor(billAmt / 0.7))} coins</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 space-y-2 text-xs border border-slate-100 shadow-xs">
                {coinsToUse > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coin Discount (1 JC = ₹0.70)</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-100">
                  <span className="text-slate-700">Net Cash to Collect:</span>
                  <span className="text-orange-600 text-base">₹{cashToPay}</span>
                </div>
              </div>
            </div>
          )}

          {billAmt > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Manual Bonus Cashback Coins (Optional)</label>
              <div className="flex gap-2">
                <input 
                  className="input-field flex-1 text-sm font-semibold" 
                  type="number" 
                  placeholder="Enter extra bonus coins" 
                  value={manualBonus}
                  onChange={e => setManualBonus(e.target.value)} 
                  min="0" 
                />
                <div className="flex items-center px-3.5 bg-orange-50 border border-orange-200 rounded-2xl text-orange-600 font-bold text-xs">
                  🪙 JC
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Leave empty to use your default Cashback settings.</p>
            </div>
          )}

          {/* Direct In-Store Counter Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
            <span className="text-2xl">💵</span>
            <div>
              <p className="text-xs font-bold text-slate-700">In-Store Counter Settlement</p>
              <p className="text-[11px] text-slate-500">Bill amount is settled in cash/UPI directly at your counter. Reward coins are transferred directly from your wallet balance to the customer.</p>
            </div>
          </div>

          {billAmt > 0 && (
            <div className="bg-orange-50 rounded-2xl p-3.5 text-center border border-orange-100">
              <p className="text-xs text-slate-600">Reward Coins Customer Will Earn:</p>
              <p className="text-xl font-black text-orange-600 mt-0.5">
                ~{Math.floor(billAmt * 0.1) + (manualBonus ? parseFloat(manualBonus) : 0)} 🪙 JC
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Deducted from your wallet balance to reward customer</p>
            </div>
          )}

          <button 
            onClick={handleProcessBill} 
            disabled={loading || !billAmt || !phone} 
            className="btn-primary w-full text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
          >
            {loading ? '⏳ Processing...' : '✅ Complete Bill & Give Cashback'}
          </button>
        </div>
      )}
    </div>
  );
}
