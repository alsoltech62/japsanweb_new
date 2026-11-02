import React from 'react';

export default function CoinBalance({ coins = 0, locked = 0, rate = 0.7, compact = false }) {
  if (compact) return (
    <div className="flex items-center gap-1.5">
      <span className="text-xl">🪙</span>
      <span className="font-bold text-orange-600">{Number(coins).toLocaleString('en-IN')}</span>
    </div>
  );

  return (
    <div className="coin-card p-6 text-white">
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-400 text-sm font-medium">Coin Balance</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-4xl font-black">{Number(coins).toLocaleString('en-IN')}</span>
              <div className="w-10 h-10 coin-gradient rounded-full flex items-center justify-center text-lg animate-spin-slow shadow-lg">🪙</div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-xs">INR Value</p>
            <p className="text-xl font-bold text-yellow-400">₹{(coins * rate).toFixed(2)}</p>
            <p className="text-xs text-slate-500">@₹{rate}/coin</p>
          </div>
        </div>
        {locked > 0 && (
          <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2 text-sm">
            <span>🔒</span>
            <span className="text-slate-300">{Number(locked).toLocaleString('en-IN')} coins locked</span>
          </div>
        )}
      </div>
    </div>
  );
}
