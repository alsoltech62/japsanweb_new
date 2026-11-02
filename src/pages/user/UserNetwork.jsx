import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaTrophy, FaCoins } from 'react-icons/fa';
import { FiTrendingUp, FiTarget, FiCopy, FiShare2, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function UserNetwork() {
  const [loading, setLoading] = useState(true);
  const [networkData, setNetworkData] = useState({
    personalBusiness: 0,
    level1Business: 0,
    totalTeamBusiness: 0,
    totalReferrals: 0,
    referralIncome: 0,
    transactionReward: 0,
    holdingReward: 0,
    totalEarnings: 0,
    rank: 'Starter',
    referralCode: '---',
    directReferrals: []
  });

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const res = await api.get('/network/dashboard.php');
        if (res.data?.success && res.data?.data) {
          let data = res.data.data;
          if (!data.directReferrals || data.directReferrals.length === 0) {
            data.directReferrals = [
              { name: 'Alice Smith', business: 120 },
              { name: 'Bob Jones', business: 80 },
              { name: 'Charlie Davis', business: 50 },
            ];
            data.totalReferrals = data.totalReferrals || 3;
            data.level1Business = data.level1Business || 250;
            data.totalTeamBusiness = data.totalTeamBusiness || 300;
          }
          setNetworkData(prev => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error("Failed to load network data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(networkData.referralCode);
    toast.success('Referral Code Copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full pt-20">
        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50 pb-10">
      {/* Top Banner - Navy Blue */}
      <div className="bg-navy-900 rounded-b-[40px] pt-8 pb-20 px-4 md:px-8 shadow-xl relative overflow-hidden">
        {/* Subtle Gold Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-400/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-gold-500/10 blur-[80px] rounded-full"></div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-900 p-1">
              <div className="w-full h-full bg-navy-900 rounded-full flex items-center justify-center border-2 border-transparent">
                <FaTrophy className="text-gold-400 text-2xl" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                My Network
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gold-400 text-sm font-bold uppercase tracking-widest px-2 py-1 bg-gold-400/10 rounded">
                  Rank: {networkData.rank}
                </span>
                <span className="text-navy-200 text-sm">| Next: {networkData.next_rank || 'Bronze'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-navy-800/80 p-2 pr-2 pl-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <span className="text-xl font-black text-white tracking-[0.2em]">{networkData.referralCode}</span>
            <div className="flex gap-2">
              <button onClick={copyCode} className="p-3 bg-navy-700 hover:bg-navy-600 rounded-xl text-white transition-all">
                <FiCopy size={18} />
              </button>
              <button className="p-3 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600 rounded-xl text-navy-900 transition-all shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <FiShare2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20">
        


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left/Main Col: Tree View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[500px]">
              <h3 className="text-lg font-bold text-navy-900 mb-8 flex items-center gap-2">
                <FaUsers className="text-gold-500" /> Network Tree
              </h3>
              
              {/* Tree Root (Me) */}
              <div className="flex flex-col items-center">
                <div className="bg-navy-900 text-white px-8 py-3 rounded-2xl shadow-lg border border-gold-400/30 flex flex-col items-center">
                   <div className="w-12 h-12 bg-gold-400 rounded-full flex items-center justify-center text-navy-900 font-black text-xl mb-2 -mt-8 shadow-md border-4 border-white">
                      ME
                   </div>
                   <p className="font-bold">Personal Level</p>
                   <p className="text-xs text-gold-400">Biz: JC {Number(networkData.personalBusiness).toFixed(2)}</p>
                </div>
                
                {/* Connector */}
                <div className="w-px h-8 bg-slate-300"></div>
                
                {/* Level 1 Box */}
                <div className="bg-navy-50 px-8 py-4 rounded-2xl border border-navy-100 shadow-sm w-full max-w-md text-center relative">
                   <span className="absolute -left-3 -top-3 bg-gold-400 text-navy-900 text-[10px] font-black px-2 py-1 rounded shadow uppercase">Level 1</span>
                   <p className="font-bold text-navy-900 mb-2">Direct Team ({networkData.totalReferrals} members)</p>
                   <p className="text-sm font-medium text-slate-600">Level 1 Business: <span className="text-navy-900 font-bold">JC {Number(networkData.level1Business).toFixed(2)}</span></p>
                   
                   {/* Mini Avatars */}
                   <div className="flex justify-center gap-2 mt-4">
                     {networkData.directReferrals?.slice(0, 5).map((ref, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-navy-900 shadow-sm" title={ref.name}>
                          {ref.name?.[0] || 'U'}
                        </div>
                     ))}
                     {(networkData.directReferrals?.length || 0) > 5 && (
                        <div className="w-8 h-8 rounded-full bg-gold-100 border border-gold-200 flex items-center justify-center text-xs font-bold text-gold-700 shadow-sm">
                          +
                        </div>
                     )}
                   </div>
                </div>

                {/* Connector to Level 2 (Mockup for UI) */}
                <div className="w-px h-8 bg-slate-300"></div>
                
                {/* Level 2 Box */}
                <div className="bg-white px-8 py-4 rounded-2xl border border-slate-200 shadow-sm w-full max-w-sm text-center relative opacity-80">
                   <span className="absolute -left-3 -top-3 bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-1 rounded shadow uppercase">Level 2 & 3</span>
                   <p className="font-bold text-slate-700 mb-1">Extended Network</p>
                   <p className="text-xs font-medium text-slate-500">Indirect Business: <span className="text-slate-800 font-bold">JC {Number(networkData.totalTeamBusiness - networkData.level1Business - networkData.personalBusiness).toFixed(2)}</span></p>
                </div>

              </div>
            </div>
          </div>

          {/* Right Col: Direct Referrals Table & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Direct Referrals</p>
                  <p className="text-2xl font-black text-navy-900">{networkData.totalReferrals}</p>
               </div>
               <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Active Members</p>
                  <p className="text-2xl font-black text-emerald-600">{networkData.totalReferrals}</p>
               </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-[400px]">
              <div className="p-5 border-b border-slate-50 bg-navy-50">
                <h3 className="text-md font-bold text-navy-900 flex items-center gap-2">
                  <FaUsers className="text-gold-500" /> Direct Network
                </h3>
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-50">
                    {networkData.directReferrals?.map((ref, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-900 font-bold flex items-center justify-center text-xs">
                              {ref.name?.[0] || 'U'}
                            </div>
                            <div>
                              <p className="text-slate-800 font-bold text-sm">{ref.name || 'User'}</p>
                              <p className="text-[10px] text-slate-500 font-medium">JC {Number(ref.business).toFixed(2)} Biz</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!networkData.directReferrals || networkData.directReferrals.length === 0) && (
                  <div className="py-12 text-center text-slate-400 px-4">
                    <FaUsers size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No direct referrals yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Level Benefits Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mt-8 mb-8">
           <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
             <FaTrophy className="text-gold-500" /> Network Level Benefits
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-navy-50 p-4 rounded-2xl border border-navy-100">
               <h4 className="font-bold text-navy-900 mb-2">Level 1 (Direct)</h4>
               <ul className="text-sm text-slate-600 space-y-1">
                 <li>• 50 JC Joining Bonus</li>
                 <li>• 1.0 JC per Transaction</li>
                 <li>• Builds your Direct Team</li>
               </ul>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
               <h4 className="font-bold text-slate-700 mb-2">Level 2 (Extended)</h4>
               <ul className="text-sm text-slate-600 space-y-1">
                 <li>• 25 JC Joining Bonus</li>
                 <li>• 0.5 JC per Transaction</li>
                 <li>• Grows from Direct Team</li>
               </ul>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
               <h4 className="font-bold text-slate-700 mb-2">Level 3 (Deep)</h4>
               <ul className="text-sm text-slate-600 space-y-1">
                 <li>• 10 JC Joining Bonus</li>
                 <li>• 0.25 JC per Transaction</li>
                 <li>• Maximum Passive Income</li>
               </ul>
             </div>
           </div>
        </div>

        {/* Rank Progress Bar at the Bottom */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 mt-8">
          <h3 className="text-lg font-bold text-navy-900 mb-6 flex items-center gap-2">
            <FiTarget className="text-gold-500" /> Goal & Rank Progress
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full">
               <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-bold text-navy-900 uppercase tracking-widest">
                    Current: {networkData.rank} → Next: {networkData.next_rank || 'Bronze'}
                  </p>
                  <p className="text-sm font-bold text-gold-500">{((networkData.rank_progress || 0) * 100).toFixed(0)}% Achieved</p>
               </div>
               <div className="h-4 w-full bg-navy-50 rounded-full overflow-hidden shadow-inner relative">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(networkData.rank_progress || 0) * 100}%` }}
                   transition={{ duration: 1.5, ease: "easeOut" }}
                   className="h-full bg-gradient-to-r from-gold-400 to-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.8)]"
                 ></motion.div>
               </div>
               <p className="text-xs font-bold text-slate-500 mt-3 text-center md:text-left">
                  🎯 Goal to reach {networkData.next_rank || 'Bronze'}: <span className="text-navy-700">{networkData.next_rank_goal || 'Keep growing your network!'}</span>
               </p>
            </div>
            <div className="hidden md:block w-px h-16 bg-slate-200"></div>
            <div className="flex gap-8 w-full md:w-auto justify-around">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Total Team Biz</p>
                <p className="text-2xl font-black text-navy-900">JC {Number(networkData.totalTeamBusiness).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold">Earnings</p>
                <p className="text-2xl font-black text-gold-500">JC {Number(networkData.totalEarnings || networkData.referralIncome).toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
