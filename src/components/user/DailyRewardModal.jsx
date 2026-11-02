import React, { useState } from 'react';
import { claimDailyReward } from '../../services/api';
import toast from 'react-hot-toast';
import { FiX, FiCheck, FiLock, FiAward, FiGift, FiAlertTriangle } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';

export default function DailyRewardModal({ statusData, onClose, onRewardClaimed }) {
  const [data, setData] = useState(statusData);
  const [claiming, setClaiming] = useState(false);
  const [celebration, setCelebration] = useState(null);

  if (!data || !data.feature_enabled) return null;

  const currentStreak = data.current_streak || 0;
  const canClaim = data.can_claim;
  const todayClaimed = data.today_claimed;
  const todayDay = data.today_day || 1;
  const todayCoins = data.today_coins || 1;
  const days = data.days || [];
  const payoutMode = data.payout_mode || 'week_complete';

  async function handleClaim() {
    if (!canClaim || claiming) return;
    setClaiming(true);
    try {
      const res = await claimDailyReward();
      if (res.data?.success) {
        const result = res.data.data;
        toast.success(result.message || 'Check-in successful!');

        if (result.is_week_completed) {
          setCelebration({
            amount: result.credited_amount,
            message: result.message
          });
        }

        // Update local status view
        setData(prev => {
          const updatedDays = prev.days.map(d => {
            if (d.day === result.day_claimed) {
              return { ...d, status: 'completed' };
            }
            return d;
          });
          return {
            ...prev,
            today_claimed: true,
            can_claim: false,
            current_streak: result.current_streak,
            accumulated_coins: result.accumulated_coins,
            days: updatedDays
          };
        });

        if (onRewardClaimed) {
          onRewardClaimed(result);
        }
      } else {
        toast.error(res.data?.message || 'Claim failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim daily reward');
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-[22px] border border-amber-500/30 shadow-2xl overflow-hidden">
        
        {/* Subtle Background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-orange-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition"
          title="Close"
        >
          <FiX className="text-base" />
        </button>

        {/* Scrollable content container */}
        <div className="overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 space-y-3">
          
          {/* Header with Title and Streak badge */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 rounded-full px-3 py-0.5 text-amber-400 text-[10px] font-bold tracking-wide uppercase">
              <FaFire className="text-amber-400 text-xs animate-pulse" />
              <span>7-Day Streak Rewards</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 leading-tight">
              {data.title || 'Roj Open Karo, Roj Rewards Paao!'}
            </h2>
            <p className="text-slate-300 text-[11px] leading-tight">
              {data.subtitle || '7 din lagatar open karein aur week complete hone par paayein rewards!'}
            </p>
          </div>

          {/* Rule Alert Banner - Compact */}
          <div className="bg-gradient-to-r from-amber-950/60 to-orange-950/60 border border-amber-500/30 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-amber-200">
            <FiAlertTriangle className="text-amber-400 text-sm shrink-0" />
            <div className="leading-snug">
              <span className="font-bold text-amber-300">Rule: </span>
              {payoutMode === 'week_complete' 
                ? 'Miss hone par streak Day 1 se shuru hogi. Pura 7 din complete karne par hi rewards wallet me credit honge!'
                : 'Lagatar open karein aur daily rewards claim karein. Miss hone par streak reset ho jayegi!'}
            </div>
          </div>

          {/* Progress Bar - Compact */}
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/10">
            <div className="flex justify-between items-center text-[11px] font-semibold mb-1.5">
              <span className="text-slate-300">Week Progress:</span>
              <span className="text-amber-400 font-bold">{todayClaimed ? currentStreak : currentStreak} of 7 Days Done</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((todayClaimed ? currentStreak : currentStreak) / 7) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400">
              <span>Accumulated: <strong className="text-amber-300">{data.accumulated_coins || 0} JC</strong></span>
              <span>Total Week Pool: <strong className="text-amber-300">{data.total_week_coins || 28} JC</strong></span>
            </div>
          </div>

          {/* 7-Day Grid - Compact */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
            {days.slice(0, 6).map((item) => {
              const isCompleted = item.status === 'completed';
              const isCurrent = item.status === 'current';

              return (
                <div 
                  key={item.day}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all text-center ${
                    isCompleted 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : isCurrent 
                      ? 'bg-gradient-to-b from-amber-500/25 to-orange-500/25 border-amber-400 ring-2 ring-amber-400/40 shadow-md shadow-amber-500/20' 
                      : 'bg-white/5 border-white/10 text-slate-400 opacity-70'
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Day {item.day}
                  </span>

                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center my-0.5 text-amber-300 font-black text-[11px]">
                    {isCompleted ? <FiCheck className="text-emerald-400 text-xs font-bold" /> : `${item.coins}`}
                  </div>

                  <span className="text-[11px] font-extrabold text-amber-300">
                    +{item.coins} JC
                  </span>

                  {isCompleted && (
                    <span className="mt-0.5 text-[8px] bg-emerald-500/20 text-emerald-300 font-bold px-1 rounded-full">
                      Done ✓
                    </span>
                  )}
                  {isCurrent && (
                    <span className="mt-0.5 text-[8px] bg-amber-400 text-slate-900 font-extrabold px-1 rounded-full animate-pulse">
                      Today
                    </span>
                  )}
                  {!isCompleted && !isCurrent && (
                    <span className="mt-0.5 text-[8px] text-slate-500 flex items-center gap-0.5">
                      <FiLock className="text-[7px]" /> Lock
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Featured Grand Day 7 Card (Full Width Compact) */}
          {days.length >= 7 && (
            <div 
              className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${
                days[6].status === 'completed'
                  ? 'bg-emerald-950/50 border-emerald-400 text-emerald-300'
                  : days[6].status === 'current'
                  ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/30 to-orange-500/30 border-amber-300 ring-2 ring-amber-400 shadow-md'
                  : 'bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-orange-950/40 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
                  <FiAward className="text-base" />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                    Day 7 • Grand Reward
                  </p>
                  <p className="text-xs font-black text-amber-200">
                    +{days[6].coins} JC Bonus
                  </p>
                </div>
              </div>

              <div>
                {days[6].status === 'completed' ? (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    Completed ✓
                  </span>
                ) : days[6].status === 'current' ? (
                  <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full animate-bounce">
                    Claim All!
                  </span>
                ) : (
                  <span className="text-[9px] bg-white/10 text-slate-400 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <FiLock className="text-[8px]" /> Final Goal
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Celebration Banner if week completed */}
          {celebration && (
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border border-emerald-400/50 text-center animate-bounce">
              <span className="text-xl">🎉</span>
              <p className="font-extrabold text-emerald-200 text-xs mt-0.5">Week Completed Successfully!</p>
              <p className="text-emerald-300 text-[10px]">{celebration.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-1 space-y-1.5">
            {canClaim ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <FiGift className="text-sm animate-bounce" />
                {claiming 
                  ? 'Claiming Reward...' 
                  : `Claim Day ${todayDay} Reward (${todayCoins} JC)`}
              </button>
            ) : todayClaimed ? (
              <div className="w-full py-2 px-3 rounded-xl font-medium text-[11px] text-center bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center gap-1.5">
                <FiCheck className="text-emerald-400 text-xs" />
                <span>Aaj ka check-in complete ✓ Kal agle din open karein.</span>
              </div>
            ) : null}

            <button
              onClick={onClose}
              className="w-full py-1 text-[11px] text-slate-400 hover:text-white font-medium transition text-center"
            >
              Close
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
