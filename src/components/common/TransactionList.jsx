import React from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const TYPE_CONFIG = {
  coin_purchase:  { icon:'🛒', label:'Coin Purchase',   color:'badge-info'   },
  coin_redemption:{ icon:'💸', label:'Coins Redeemed',  color:'badge-warning'},
  cashback:       { icon:'🎁', label:'Cashback',         color:'badge-success'},
  referral_reward:{ icon:'👥', label:'Referral Reward',  color:'badge-orange' },
  withdrawal:     { icon:'🏦', label:'Withdrawal',       color:'badge-info'   },
  withdrawal_fee: { icon:'📋', label:'Withdrawal Fee',   color:'badge-warning'},
  admin_credit:   { icon:'➕', label:'Admin Credit',     color:'badge-success'},
  admin_debit:    { icon:'➖', label:'Admin Debit',      color:'badge-danger' },
  coin_expiry:    { icon:'⏰', label:'Coins Expired',    color:'badge-danger' },
  payment:        { icon:'💳', label:'Payment',           color:'badge-info'   },
};

export default function TransactionList({ transactions = [], emptyMessage = 'No transactions yet' }) {
  const { isUser } = useAuth();
  
  if (!transactions.length) return (
    <div className="text-center py-12 text-slate-400">
      <div className="text-5xl mb-3">📋</div>
      <p>{emptyMessage}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {transactions.map(tx => {
        const cfg   = TYPE_CONFIG[tx.type] || { icon:'💰', label:tx.type, color:'badge-info' };
        
        let isPos = true;
        if (['payment', 'transfer_out', 'admin_debit', 'vendor_withdrawal', 'withdrawal_fee'].includes(tx.type)) {
            isPos = false;
        }

        let coinsAmt = Number(tx.coins_amount || 0);
        if (tx.type === 'payment' && isUser) {
            coinsAmt = Number(tx.coins_used || 0);
        }

        const inrAmt   = Number(tx.amount_inr || 0);
        return (
          <div key={tx.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:border-orange-100 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">{cfg.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm truncate">{cfg.label}</span>
                <span className={`badge ${cfg.color} text-xs`}>{tx.status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{tx.description || `Ref: ${tx.transaction_ref}`}</p>
              {tx.vendor_name && <p className="text-xs text-slate-400">At: {tx.vendor_name}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              {coinsAmt > 0 && (
                <p className={`font-bold text-sm ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                  {isPos ? '+' : '-'}{coinsAmt.toLocaleString('en-IN')} 🪙
                </p>
              )}
              {inrAmt > 0 && (
                <p className="text-xs text-slate-500">₹{inrAmt.toFixed(2)}</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {tx.created_at ? format(new Date(tx.created_at), 'dd MMM, hh:mm a') : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
