import React, { useState, useEffect } from 'react';
import { getVendorAdStatus, buyVendorAd } from '../../services/api';
import toast from 'react-hot-toast';
import { FiAward, FiCheck, FiCalendar, FiClock, FiZap, FiTrendingUp, FiShoppingBag, FiInfo } from 'react-icons/fi';

export default function VendorAdvertising() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [customDays, setCustomDays] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('coins');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = () => {
    setLoading(true);
    getVendorAdStatus()
      .then((res) => {
        setData(res.data.data);
      })
      .catch(() => {
        toast.error('Failed to load advertising status');
      })
      .finally(() => setLoading(false));
  };

  const activeDays = customDays ? parseInt(customDays, 10) || 1 : selectedDays;
  const dailyFee = data?.daily_fee || 50;

  // Calculate discount
  let discount = 0;
  if (activeDays >= 30) discount = 0.15;
  else if (activeDays >= 15) discount = 0.10;
  else if (activeDays >= 7) discount = 0.05;

  const totalFee = Math.round(dailyFee * activeDays * (1 - discount));

  const handlePurchase = async () => {
    if (activeDays < 1) return toast.error('Please select at least 1 day');
    if (paymentMethod === 'coins' && (data?.coin_balance || 0) < totalFee) {
      return toast.error(`Insufficient JC Coin balance (${data?.coin_balance || 0} JC available, ${totalFee} JC required)`);
    }

    setPurchasing(true);
    try {
      const res = await buyVendorAd({
        days: activeDays,
        payment_method: paymentMethod,
      });
      toast.success(res.data.message || 'Advertising activated successfully!');
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate advertising');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-3xl mx-auto space-y-6 fade-in pb-24 font-sans">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-36 h-36 bg-white/10 rounded-full blur-xl" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <FiAward className="text-yellow-300" /> Rank #1, #2, #3 Nearby Placement
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Boost Your Store to Top Ranking</h1>
          <p className="text-xs sm:text-sm text-orange-100 max-w-xl">
            Appear at the very top of the <strong>Nearby Stores (50km)</strong> search with an exclusive Golden Sponsored Badge! Get 5x more footfall and JC payments.
          </p>
        </div>
      </div>

      {/* Current Status Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Ad Status</span>
            {data?.is_sponsored ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FiZap size={12} /> ACTIVE (Top 1-3 Boosted)
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                Inactive
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {data?.is_sponsored ? `Boosted for ${data?.remaining_days} more days` : 'Store is currently on standard ranking'}
          </h3>
          {data?.sponsored_until && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <FiCalendar size={12} /> Valid until: {new Date(data.sponsored_until).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-right shrink-0">
          <div className="text-xs text-slate-500 font-medium">Your JC Coin Balance</div>
          <div className="text-xl font-black text-slate-800">{Number(data?.coin_balance || 0).toLocaleString()} <span className="text-orange-500 text-base">JC</span></div>
        </div>
      </div>

      {/* Select Duration Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-black text-slate-800">1. Select Advertising Duration (Days)</h2>
          <p className="text-xs text-slate-500">Choose how many days your shop should be featured at the top of Nearby Stores.</p>
        </div>

        {/* Preset Packages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(data?.preset_packages || []).map((pkg) => {
            const isSelected = !customDays && selectedDays === pkg.days;
            return (
              <div
                key={pkg.days}
                onClick={() => {
                  setCustomDays('');
                  setSelectedDays(pkg.days);
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all text-center relative overflow-hidden ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50/50 shadow-md ring-2 ring-orange-200'
                    : 'border-slate-200 hover:border-orange-300 bg-white'
                }`}
              >
                {pkg.discount_percent > 0 && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
                    {pkg.discount_percent}% OFF
                  </div>
                )}
                <div className="text-xl font-black text-slate-800">{pkg.days} Days</div>
                <div className="text-xs text-slate-500 mt-1">{pkg.label.split('(')[1]?.replace(')', '') || 'Boost'}</div>
                <div className="mt-3 text-sm font-bold text-orange-600">{pkg.total_fee} JC</div>
              </div>
            );
          })}
        </div>

        {/* Custom Days Input */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Or Enter Custom Number of Days:</label>
          <div className="flex gap-2 max-w-xs">
            <input
              type="number"
              min="1"
              max="365"
              placeholder="e.g. 10"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="input-field text-sm font-semibold"
            />
            <button
              onClick={() => setCustomDays('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Payment & Summary */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-black text-slate-800">2. Review & Activate</h2>
          <p className="text-xs text-slate-500">Ad fees configured by Admin: <strong>{dailyFee} JC / Day</strong></p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-200">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Selected Duration:</span>
            <span className="font-bold text-slate-800">{activeDays} Days</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>Daily Rate:</span>
            <span>{dailyFee} JC / Day</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-bold">
              <span>Package Discount:</span>
              <span>{(discount * 100).toFixed(0)}% OFF</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-800">
            <span>Total Payable:</span>
            <span className="text-orange-600 text-base">{totalFee} JC</span>
          </div>
        </div>

        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-base py-3.5 rounded-2xl shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {purchasing ? (
            '⏳ Activating Top Ranking...'
          ) : (
            <>
              <FiZap /> Activate {activeDays} Days Top Boost for {totalFee} JC
            </>
          )}
        </button>
      </div>

      {/* Past Ad Purchases History */}
      {data?.history && data.history.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">Advertising History</h3>
          <div className="divide-y divide-slate-100">
            {data.history.map((h) => (
              <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{h.days} Days Boost ({h.total_fee} JC)</div>
                  <div className="text-slate-400 text-[10px]">{h.start_date.substring(0, 10)} to {h.end_date.substring(0, 10)}</div>
                </div>
                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
