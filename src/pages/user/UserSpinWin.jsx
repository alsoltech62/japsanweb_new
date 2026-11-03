import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { getSpinWheelData, executeSpin } from '../../services/api';
import {
  FiArrowLeft, FiGift, FiAward, FiZap, FiPercent, FiRotateCw,
  FiCheckCircle, FiAlertCircle, FiInfo, FiChevronRight
} from 'react-icons/fi';
import { FaCoins, FaFire } from 'react-icons/fa';

export default function UserSpinWin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [wheelData, setWheelData] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [winResult, setWinResult] = useState(null);
  const [showWinModal, setShowWinModal] = useState(false);

  const canvasRef = useRef(null);

  // Load wheel status and segments from backend
  const loadWheel = async () => {
    try {
      const res = await getSpinWheelData();
      if (res.data?.success) {
        setWheelData(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load Spin & Win');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWheel();
  }, []);

  // Draw the Canvas Fortune Wheel
  useEffect(() => {
    if (!wheelData?.rewards || wheelData.rewards.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rewards = wheelData.rewards;
    const numSegments = rewards.length;
    const arcSize = (2 * Math.PI) / numSegments;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 14;

    ctx.clearRect(0, 0, size, size);

    // Draw Outer Rim with light dots
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 2, 0, 2 * Math.PI);
    const rimGrad = ctx.createLinearGradient(0, 0, size, size);
    rimGrad.addColorStop(0, '#f59e0b');
    rimGrad.addColorStop(0.5, '#ffd700');
    rimGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = rimGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    // Draw Outer Lights (small golden & white dots)
    const numDots = 24;
    for (let i = 0; i < numDots; i++) {
      const dotAngle = (i * (2 * Math.PI)) / numDots;
      const dotX = center + (center - 7) * Math.cos(dotAngle);
      const dotY = center + (center - 7) * Math.sin(dotAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#fef08a';
      ctx.fill();
    }

    // Draw Segments
    rewards.forEach((r, i) => {
      const angle = i * arcSize;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.closePath();

      // Custom or fallback color
      ctx.fillStyle = r.bg_color || (i % 2 === 0 ? '#f97316' : '#2563eb');
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text inside segment
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = r.text_color || '#ffffff';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 4;

      // Wrap or shorten text nicely
      const title = r.title || '';
      ctx.fillText(title, radius - 18, 4);

      ctx.restore();
    });

    // Center Gold Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 44, 0, 2 * Math.PI);
    const centerGrad = ctx.createRadialGradient(center, center, 10, center, center, 44);
    centerGrad.addColorStop(0, '#fef08a');
    centerGrad.addColorStop(0.7, '#eab308');
    centerGrad.addColorStop(1, '#a16207');
    ctx.fillStyle = centerGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

    // Center Inner Button Background
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Center Text: SPIN NOW
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ea580c';
    ctx.font = '900 11px Inter, sans-serif';
    ctx.fillText('SPIN', center, center - 6);
    ctx.fillStyle = '#c2410c';
    ctx.font = '900 11px Inter, sans-serif';
    ctx.fillText('NOW', center, center + 7);
    ctx.restore();

  }, [wheelData]);

  // Handle Spin Execution
  const handleSpin = async () => {
    if (spinning || !wheelData?.rewards?.length) return;

    if (!wheelData.can_free_spin && !wheelData.can_paid_spin) {
      toast.error(`Extra Spin ke liye ${wheelData.extra_spin_cost_jc} JC chahiye. Kripya pehle recharge karein.`);
      navigate('/user/buy-coins');
      return;
    }

    setSpinning(true);
    setWinResult(null);

    try {
      const res = await executeSpin();
      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Spin failed');
      }

      const result = res.data.data;
      const winningIndex = result.winning_index;
      const numSegments = wheelData.rewards.length;
      const segmentDegree = 360 / numSegments;

      // Wheel lands under top pointer (270 degrees in canvas coordinates)
      // The center of segment i is at (i * segmentDegree + segmentDegree / 2)
      // To bring segment i to the top pointer (270°):
      // Final rotation R % 360 = (270 - (i * segmentDegree + segmentDegree / 2)) % 360
      const segmentCenter = winningIndex * segmentDegree + (segmentDegree / 2);
      let targetSliceAngle = (270 - segmentCenter) % 360;
      if (targetSliceAngle < 0) targetSliceAngle += 360;

      // Add 6 to 8 full revolutions for excitement
      const fullRotations = 360 * 6;
      const currentMod = rotationAngle % 360;
      const extraTurn = (targetSliceAngle - currentMod + 360) % 360;
      const finalAngle = rotationAngle + fullRotations + extraTurn;

      setRotationAngle(finalAngle);

      // Wait for spin animation (4.5 seconds)
      setTimeout(() => {
        setSpinning(false);
        setWinResult(result);
        setShowWinModal(true);

        // Update local wallet balance
        setWheelData(prev => ({
          ...prev,
          user_coin_balance: result.user_coin_balance,
          free_spins_left: result.is_free_spin ? Math.max(0, prev.free_spins_left - 1) : prev.free_spins_left,
          can_free_spin: result.is_free_spin ? false : prev.can_free_spin,
        }));

        if (result.reward_type === 'instant' || result.requires_deposit) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }, 4500);

    } catch (err) {
      setSpinning(false);
      toast.error(err.response?.data?.message || err.message || 'Spin failed');
    }
  };

  const handleClaimDepositReward = () => {
    setShowWinModal(false);
    navigate('/user/buy-coins');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white font-medium mt-4 text-sm">Loading Spin & Win...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white pb-28 select-none">

      {/* Top Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/10 sticky top-0 bg-slate-950/90 backdrop-blur-md z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl text-slate-300 hover:bg-white/10">
          <FiArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-200">
            SPIN & WIN
          </h1>
          <p className="text-[10px] text-amber-200/80 font-medium">हर दिन जीतने का मौका!</p>
        </div>
        <div className="bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <FaCoins className="text-amber-400 text-xs" />
          <span className="text-xs font-bold text-amber-300">
            {Number(wheelData?.user_coin_balance || 0).toLocaleString()} JC
          </span>
        </div>
      </div>

      {/* Sub-banner */}
      <div className="px-4 pt-3">
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-2.5 text-center">
          <p className="text-xs text-amber-200 font-medium">
            कुछ रिवॉर्ड <span className="text-yellow-400 font-bold">तुरंत मिलेंगे</span> और कुछ रिवॉर्ड के लिए आपको <span className="text-orange-400 font-bold">Deposit</span> करना होगा।
          </p>
        </div>
      </div>

      {/* Free Spin Status Pill */}
      <div className="px-4 pt-3 flex items-center justify-center gap-2">
        {wheelData?.can_free_spin ? (
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 animate-pulse">
            <FaFire className="text-yellow-300 text-sm" /> हर दिन 1 FREE SPIN पाएं (Available)
          </div>
        ) : (
          <div className="bg-slate-800 border border-white/10 px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400"></span> Free spin used! Extra Spin: <span className="font-bold text-amber-300">{wheelData?.extra_spin_cost_jc} JC</span>
          </div>
        )}
      </div>

      {/* Active Deposit Reward Floating Alert if user already has one */}
      {wheelData?.active_deposit_reward && (
        <div className="mx-4 mt-3 bg-gradient-to-r from-orange-600/30 to-amber-600/30 border border-orange-500/40 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/30 flex items-center justify-center text-orange-300">
              <FiZap />
            </div>
            <div>
              <p className="text-xs font-bold text-orange-200">Active Deposit Bonus!</p>
              <p className="text-[11px] text-white/80">{wheelData.active_deposit_reward.reward_title}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/user/buy-coins')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition"
          >
            Deposit Now
          </button>
        </div>
      )}

      {/* WHEEL CONTAINER */}
      <div className="relative mt-6 flex flex-col items-center justify-center">

        {/* Pointer / Ticker at Top */}
        <div className="relative z-10 -mb-5 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-amber-400 drop-shadow-[0_4px_8px_rgba(251,191,36,0.8)] animate-pulse"></div>
          <div className="w-3.5 h-3.5 bg-white rounded-full -mt-7 shadow-md border-2 border-amber-600"></div>
        </div>

        {/* Rotating Wheel Canvas */}
        <div
          className="relative rounded-full shadow-[0_0_50px_rgba(245,158,11,0.25)] p-1 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 cursor-pointer"
          onClick={handleSpin}
        >
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            style={{
              transform: `rotate(${rotationAngle}deg)`,
              transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
            }}
            className="rounded-full select-none"
          />
        </div>

        {/* SPIN BUTTON BELOW WHEEL */}
        <div className="mt-6 w-full px-6 max-w-sm">
          <button
            onClick={handleSpin}
            disabled={spinning}
            className={`w-full py-3.5 rounded-2xl font-black text-base shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${spinning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : wheelData?.can_free_spin
                ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 shadow-orange-500/30 hover:brightness-110'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:brightness-110'
              }`}
          >
            {spinning ? (
              <>
                <FiRotateCw className="animate-spin text-lg" /> Spinning...
              </>
            ) : wheelData?.can_free_spin ? (
              <>
                🎰 SPIN NOW <span className="text-xs bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full font-bold">1 FREE</span>
              </>
            ) : (
              <>
                🎰 SPIN AGAIN <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">{wheelData?.extra_spin_cost_jc} JC</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 8 REWARDS और उनकी PROBABILITY TABLE */}
      <div className="mt-8 px-4 max-w-md mx-auto space-y-4">

        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <h3 className="font-extrabold text-sm text-amber-300 flex items-center gap-1.5">
              <span>🎯</span> 8 REWARDS और उनकी PROBABILITY
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
              Total 100%
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-bold">
                <tr>
                  <th className="py-2 px-2.5">No.</th>
                  <th className="py-2 px-2.5">Reward</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5 text-right">Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {wheelData?.rewards?.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-white/5 transition">
                    <td className="py-2 px-2.5 font-bold text-slate-400">{i + 1}</td>
                    <td className="py-2 px-2.5 font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.bg_color }}></span>
                      {r.title}
                    </td>
                    <td className="py-2 px-2.5">
                      {r.reward_type === 'instant' && (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Instant
                        </span>
                      )}
                      {(r.reward_type === 'deposit_multiplier' || r.reward_type === 'deposit_percent') && (
                        <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          Deposit Based
                        </span>
                      )}
                      {r.reward_type === 'try_again' && (
                        <span className="bg-red-500/20 text-red-300 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          -
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2.5 text-right font-black text-amber-400">
                      {Number(r.probability).toFixed(0)}%
                    </td>
                  </tr>
                ))}
                <tr className="bg-white/5 font-black text-amber-300">
                  <td className="py-2.5 px-2.5" colSpan={3}>Total</td>
                  <td className="py-2.5 px-2.5 text-right font-black">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4 EXPLANATORY CARDS MATCHING THE IMAGE */}
        <div className="grid grid-cols-2 gap-3 text-xs">

          {/* Instant Reward Card */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <FiCheckCircle /> Instant Reward
            </div>
            <p className="text-[11px] text-emerald-200/80 mb-2">ये Rewards तुरंत Wallet में मिलेंगे।</p>
            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">5 JC</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">10 JC</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">25 JC</span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">50 JC</span>
            </div>
          </div>

          {/* Deposit Based Card */}
          <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-1">
              <FiPercent /> Deposit Reward
            </div>
            <p className="text-[11px] text-purple-200/80 mb-2">Claim Now करने के बाद सीधे Deposit Page खुलेगा।</p>
            <div className="flex flex-wrap gap-1 text-[10px] font-bold">
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">2X Coins</span>
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">5% / 10% Extra</span>
            </div>
          </div>

          {/* Try Again Card */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-red-400 font-bold mb-1">
              <FiRotateCw /> Try Again
            </div>
            <p className="text-[11px] text-red-200/80">इसमें कोई Coins नहीं मिलेंगे। अगली बार फिर प्रयास करें।</p>
          </div>

          {/* Extra Spin Card */}
          <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
              <FiZap /> EXTRA SPIN
            </div>
            <p className="text-[11px] text-blue-200/80">
              1 Free Spin हर दिन मिलेगा। Extra Spin के लिए 5 JC खर्च करने होंगे।
            </p>
          </div>

        </div>

        {/* IMPORTANT RULES */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3.5 space-y-2">
          <p className="text-xs font-black text-amber-400 flex items-center gap-1.5">
            <FiInfo /> IMPORTANT RULES
          </p>
          <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
            <li>2X और Extra Coins वाले Rewards में Claim Now पर क्लिक करने के बाद ही Deposit Page पर ले जाया जाता है।</li>
            <li>जिस Amount का Deposit होगा, उसी पर 2X या Extra % लागू होगा।</li>
            <li>Deposit सफल होने के बाद ही JAPSAN COINS Credit होंगे।</li>
            <li>Failed या Cancelled Deposit पर कोई Coins नहीं मिलेंगे।</li>
          </ul>
        </div>

      </div>

      {/* RESULT MODAL DIALOGS */}
      {showWinModal && winResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          {/* FLOW 1: 2X COINS WIN POPUP (MATCHES IMAGE PHONE 1) */}
          {winResult.reward_type === 'deposit_multiplier' && (
            <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-2 border-orange-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative animate-scale-up">

              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/40 mb-4 border-2 border-white/30">
                <span className="text-3xl font-black text-slate-950">2X</span>
              </div>

              <p className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">आपने जीता है</p>
              <h2 className="text-3xl font-black text-white mb-2">2X COINS</h2>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 my-4 text-xs text-slate-300 leading-relaxed text-left space-y-1.5">
                <p className="text-amber-300 font-bold">✨ Deposit Offer Unlocked!</p>
                <p>User सीधे Deposit Page पर चला जाएगा। यहाँ आपको बताया जाएगा कि जो भी Amount Deposit करेंगे, उसके <b>2 गुना (2X) JAPSAN COINS</b> मिलेंगे।</p>
                <p className="text-[10px] text-emerald-400 font-medium">उदाहरण: ₹100 Deposit = 200 JC मिलेंगे!</p>
              </div>

              <button
                onClick={handleClaimDepositReward}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-orange-500/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                CLAIM NOW <FiChevronRight />
              </button>

              <button
                onClick={() => setShowWinModal(false)}
                className="mt-3 text-xs text-slate-400 hover:text-white"
              >
                Later
              </button>
            </div>
          )}

          {/* FLOW 2: 5% / 10% EXTRA COINS WIN POPUP (MATCHES IMAGE PHONE 2) */}
          {winResult.reward_type === 'deposit_percent' && (
            <div className="bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 border-2 border-purple-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative animate-scale-up">

              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-purple-400 via-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/40 mb-4 border-2 border-white/30">
                <span className="text-3xl font-black text-white">%</span>
              </div>

              <p className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-1">आपने जीता है</p>
              <h2 className="text-2xl font-black text-white mb-2">{winResult.reward_title}</h2>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 my-4 text-xs text-slate-300 leading-relaxed text-left space-y-1.5">
                <p className="text-purple-300 font-bold">✨ Extra Coins Offer Unlocked!</p>
                <p>User सीधे Deposit Page पर चला जाएगा। यहाँ आपको बताया जाएगा कि जो भी Amount Deposit करेंगे, उस पर <b>{winResult.reward_value}% Extra JAPSAN COINS</b> मिलेंगे।</p>
                <p className="text-[10px] text-emerald-400 font-medium">
                  उदाहरण: ₹100 Deposit = {100 + Number(winResult.reward_value)} JC मिलेंगे!
                </p>
              </div>

              <button
                onClick={handleClaimDepositReward}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 hover:brightness-110 text-white font-black text-base rounded-2xl shadow-lg shadow-purple-500/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                CLAIM NOW <FiChevronRight />
              </button>

              <button
                onClick={() => setShowWinModal(false)}
                className="mt-3 text-xs text-slate-400 hover:text-white"
              >
                Later
              </button>
            </div>
          )}

          {/* FLOW 3: INSTANT REWARD POPUP (5 JC, 10 JC, 25 JC, 50 JC MEGA JACKPOT) */}
          {winResult.reward_type === 'instant' && (
            <div className="bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative animate-scale-up">

              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 mb-4 border-2 border-white/30 text-white text-3xl">
                🎁
              </div>

              <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1">🎉 बधाई हो!</p>
              <h2 className="text-2xl font-black text-white mb-2">{winResult.reward_title}</h2>

              <p className="text-xs text-emerald-200/90 mb-4">
                +{winResult.reward_value} JC आपके Wallet में तुरंत Credit कर दिए गए हैं!
              </p>

              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-3 mb-5">
                <p className="text-xs text-slate-300">Updated Wallet Balance</p>
                <p className="text-xl font-black text-emerald-300">
                  {Number(winResult.user_coin_balance).toLocaleString()} JC
                </p>
              </div>

              <button
                onClick={() => setShowWinModal(false)}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-sm rounded-2xl shadow-lg transition"
              >
                Collect & Continue
              </button>
            </div>
          )}

          {/* FLOW 4: TRY AGAIN POPUP */}
          {winResult.reward_type === 'try_again' && (
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 border-2 border-red-500/50 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative animate-scale-up">

              <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-2xl mb-4">
                <FiRotateCw />
              </div>

              <h2 className="text-xl font-black text-white mb-2">Try Again!</h2>
              <p className="text-xs text-slate-300 mb-6">
                इसमें कोई Coins नहीं मिलेंगे। अगली बार फिर प्रयास करें।
              </p>

              <button
                onClick={() => setShowWinModal(false)}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm rounded-2xl transition"
              >
                Close
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

