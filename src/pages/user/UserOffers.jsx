import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserOffers } from '../../services/api';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTag, FiClock, FiMapPin, FiSearch, FiGift } from 'react-icons/fi';

export default function UserOffers() {
  const [offers, setOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = () => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadOffers({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          loadOffers({ lat: 22.5726, lng: 88.3639 });
        },
        { timeout: 8000 }
      );
    } else {
      loadOffers({ lat: 22.5726, lng: 88.3639 });
    }
  };

  const loadOffers = (coords) => {
    getUserOffers(coords)
      .then((res) => {
        const data = res.data.data || [];
        setOffers(data);
        setFilteredOffers(data);
      })
      .catch(() => {
        toast.error('Failed to load offers');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let list = offers;
    if (filterType !== 'All') {
      list = list.filter((o) => o.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          (o.title && o.title.toLowerCase().includes(q)) ||
          (o.description && o.description.toLowerCase().includes(q)) ||
          (o.business_name && o.business_name.toLowerCase().includes(q)) ||
          (o.city && o.city.toLowerCase().includes(q))
      );
    }
    setFilteredOffers(list);
  }, [filterType, search, offers]);

  const offerTypes = ['All', 'Cashback Offer', 'Festival Offer', 'Happy Hour Offer', 'Bonus Coin Offer'];

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-2xl mx-auto space-y-4 fade-in pb-24 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/user/dashboard')} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-100">
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              🏷️ Hot Offers & Deals
            </h1>
            <p className="text-xs text-slate-500">Exclusive discount & cashback deals from nearby stores</p>
          </div>
        </div>
        <button onClick={fetchOffers} className="text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 font-semibold px-3 py-1.5 rounded-xl border border-orange-200">
          🔄 Refresh
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search offers, discounts, or stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-orange-500 shadow-sm"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {offerTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterType === type
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Offers List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
          <div className="text-4xl">🎁</div>
          <h3 className="font-bold text-slate-800">No active offers available</h3>
          <p className="text-xs text-slate-500">Check back soon for festival & discount deals from local merchants.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all"
            >
              {/* Header Gradient */}
              <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-4 text-white relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-black bg-black/20 backdrop-blur px-2.5 py-0.5 rounded-full">
                    {o.type || 'Special Deal'}
                  </span>
                  <span className="text-xs font-semibold flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                    <FiClock size={12} /> Valid till {o.valid_until}
                  </span>
                </div>
                <h3 className="text-lg font-black leading-tight drop-shadow-sm">{o.title}</h3>
                {o.description && <p className="text-xs text-orange-50 mt-1 line-clamp-2">{o.description}</p>}
              </div>

              {/* Merchant Info Footer */}
              <div className="p-4 flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  {o.profile_photo ? (
                    <img src={o.profile_photo} alt={o.business_name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center text-lg font-bold shrink-0">
                      🏪
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{o.business_name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <FiMapPin size={12} className="shrink-0 text-slate-400" />
                      {[o.city, o.state].filter(Boolean).join(', ') || 'Local Store'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/user/scan-pay')}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
                >
                  Avail Offer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
