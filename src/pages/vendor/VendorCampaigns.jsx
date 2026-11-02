import React, { useState, useEffect } from 'react';
import { sendVendorCampaign, getNearbyCustomers } from '../../services/api';
import toast from 'react-hot-toast';

export default function VendorCampaigns() {
  const [campaign, setCampaign] = useState({ 
    type: 'push', 
    target: 'nearby', 
    title: '',
    message: '',
    radius: 10,
    customer_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyData, setNearbyData] = useState({ customers: [], total_count: 0, vendor_coordinates: null });
  const [selectedAll, setSelectedAll] = useState(true);

  // Load nearby customers when target is 'nearby' or radius changes
  const fetchNearby = async (radiusVal) => {
    setLoadingNearby(true);
    try {
      const res = await getNearbyCustomers({ radius: radiusVal });
      if (res.data?.success) {
        const custs = res.data.data.customers || [];
        setNearbyData(res.data.data);
        // By default, select all nearby customers
        setCampaign(prev => ({ ...prev, customer_ids: custs.map(c => c.id) }));
        setSelectedAll(true);
      }
    } catch (err) {
      console.error('Failed to load nearby customers', err);
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (campaign.target === 'nearby') {
      fetchNearby(campaign.radius);
    } else {
      setCampaign(prev => ({ ...prev, customer_ids: [] }));
    }
  }, [campaign.target, campaign.radius]);

  const toggleSelectCustomer = (id) => {
    setCampaign(prev => {
      const exists = prev.customer_ids.includes(id);
      const newIds = exists ? prev.customer_ids.filter(x => x !== id) : [...prev.customer_ids, id];
      setSelectedAll(newIds.length === nearbyData.customers.length);
      return { ...prev, customer_ids: newIds };
    });
  };

  const handleSelectAllToggle = () => {
    if (selectedAll) {
      setCampaign(prev => ({ ...prev, customer_ids: [] }));
      setSelectedAll(false);
    } else {
      const allIds = nearbyData.customers.map(c => c.id);
      setCampaign(prev => ({ ...prev, customer_ids: allIds }));
      setSelectedAll(true);
    }
  };

  const handleSend = async () => {
    if (!campaign.message.trim()) return toast.error('Kripya sandesh (message) likhein!');
    
    if (campaign.target === 'nearby' && campaign.customer_ids.length === 0) {
      return toast.error('Kam se kam 1 nearby customer ko chuniye!');
    }

    setLoading(true);
    try {
      const payload = {
        type: campaign.type,
        target: campaign.target,
        title: campaign.title.trim() || undefined,
        message: campaign.message.trim(),
        radius: campaign.radius,
        customer_ids: campaign.target === 'nearby' ? campaign.customer_ids : undefined
      };

      const res = await sendVendorCampaign(payload);
      toast.success(res?.data?.message || 'Notification safaltapoorvak bhej di gayi!');
      
      // WhatsApp multi-send helper
      if (campaign.type === 'whatsapp' && res?.data?.data?.whatsapp_numbers) {
        const numbers = res.data.data.whatsapp_numbers;
        if (numbers.length > 0) {
          const text = encodeURIComponent(campaign.message);
          window.open(`https://wa.me/${numbers[0].replace(/\D/g,'')}?text=${text}`, '_blank');
          if (numbers.length > 1) {
            toast.success(`1st customer WhatsApp open hua. Baki ${numbers.length - 1} customer list me hain.`);
          }
        }
      }
      
      setCampaign(prev => ({ ...prev, message: '', title: '' }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Notification bhejne me dikkat aayi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          📢 Customer Campaigns & Notifications
        </h2>
        <p className="text-sm text-slate-500">
          Aas-paas ke (Nearby) customers ko direct Push Notification ya WhatsApp offer bhein.
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-5">
        
        {/* Campaign Type */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notification Type</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button 
              type="button"
              className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                campaign.type === 'push' 
                  ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-500/20' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setCampaign({...campaign, type: 'push'})}>
              🔔 App Push Notification
            </button>
            <button 
              type="button"
              className={`p-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                campaign.type === 'whatsapp' 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setCampaign({...campaign, type: 'whatsapp'})}>
              💬 WhatsApp Broadcast
            </button>
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Audience</label>
          <select 
            className="input-field w-full mt-2 font-medium" 
            value={campaign.target} 
            onChange={e => setCampaign({...campaign, target: e.target.value})}>
            <option value="nearby">📍 Nearby Customers (Aas-Paas Ke Grahak)</option>
            <option value="all">👥 All My Registered Customers</option>
            <option value="repeat">🔄 Repeat Customers (&gt;2 visits)</option>
            <option value="high_value">💎 High Value Customers (&gt;₹5000)</option>
          </select>
        </div>

        {/* Nearby Customers Section */}
        {campaign.target === 'nearby' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm font-bold text-slate-800">Search Radius (KiloMeter):</span>
              </div>
              <div className="flex items-center gap-2">
                {[2, 5, 10, 25, 50].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCampaign(prev => ({ ...prev, radius: r }))}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      campaign.radius === r 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Total Count & Select All */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
              <span className="font-semibold text-slate-600">
                Found <span className="text-amber-600 font-bold">{nearbyData.total_count}</span> nearby customer(s) within {campaign.radius} km
              </span>
              {nearbyData.customers.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllToggle}
                  className="text-blue-600 font-bold hover:underline">
                  {selectedAll ? 'Deselect All' : 'Select All (' + nearbyData.customers.length + ')'}
                </button>
              )}
            </div>

            {/* List of Nearby Customers */}
            {loadingNearby ? (
              <div className="py-6 text-center text-slate-400 text-sm animate-pulse">
                Aas-paas ke customers dhoondhe ja rahe hain...
              </div>
            ) : nearbyData.customers.length === 0 ? (
              <div className="py-6 text-center bg-white rounded-lg border border-dashed border-slate-200 text-slate-500 text-sm">
                Is radius me koi customer nahi mila. Radius badhakar 25km ya 50km kijiye.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {nearbyData.customers.map(c => {
                  const isChecked = campaign.customer_ids.includes(c.id);
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => toggleSelectCustomer(c.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-amber-50/60 border-amber-300' 
                          : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                      }`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => {}} 
                          className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4"
                        />
                        <div>
                          <p className="font-bold text-slate-800">{c.name || 'Customer'}</p>
                          <p className="text-slate-400 text-[11px]">{c.masked_phone} {c.city ? `• ${c.city}` : ''}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                        📍 {c.distance_km > 0 ? `${c.distance_km} km door` : 'Aas-paas'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Message Title */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Notification Title (Optional)</label>
          <input 
            type="text"
            className="input-field w-full mt-2" 
            placeholder="e.g. Aaj ki Special Discount Offer! 🔥"
            value={campaign.title}
            onChange={e => setCampaign({...campaign, title: e.target.value})}
          />
        </div>

        {/* Message Content */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Message / Sandesh</label>
          <textarea 
            className="input-field w-full mt-2 h-28" 
            placeholder={
              campaign.type === 'push' 
                ? "e.g. Hamare store par padhariye aur har kharidari par 100 JC extra cashback payein!" 
                : "e.g. Namaste! Hamare store me naya stock aa gaya hai. Aapke liye special 10% discount uplabdh hai."
            }
            value={campaign.message}
            onChange={e => setCampaign({...campaign, message: e.target.value})}
          ></textarea>
        </div>

        {/* Submit Button */}
        <button 
          type="button"
          onClick={handleSend} 
          disabled={loading || (campaign.target === 'nearby' && campaign.customer_ids.length === 0)} 
          className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all text-sm flex items-center justify-center gap-2 ${
            campaign.type === 'whatsapp' 
              ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-500/30' 
              : 'bg-amber-500 hover:bg-amber-600 hover:shadow-amber-500/30 text-slate-900'
          } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
          {loading ? 'Bheja ja raha hai...' : (
            <>
              <span>🚀</span>
              <span>
                {campaign.type === 'push' ? 'Push Notification' : 'WhatsApp Message'} Bhejo
                {campaign.target === 'nearby' ? ` (${campaign.customer_ids.length} Nearby Customers)` : ''}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
