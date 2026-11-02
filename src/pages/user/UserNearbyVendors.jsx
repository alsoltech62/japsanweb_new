import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNearbyVendors } from '../../services/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiSearch, FiPhone, FiCheckCircle, FiStar, FiArrowLeft, FiAward, FiTag, FiX } from 'react-icons/fi';

export const VENDOR_CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌐', keywords: [] },
  { id: 'electronics', label: 'Electronics & Mobile', icon: '📱', keywords: ['electronic', 'electronics', 'mobile', 'phone', 'smartphone', 'laptop', 'computer', 'tv', 'repair', 'charger', 'accessories', 'camera', 'electrical', 'gadgets'] },
  { id: 'medical', label: 'Medical & Clinic', icon: '💊', keywords: ['medical', 'medicine', 'medicines', 'hospital', 'clinic', 'pharmacy', 'chemist', 'doctor', 'healthcare', 'diagnostic', 'dental', 'optical', 'lab'] },
  { id: 'footwear', label: 'Footwear & Shoes', icon: '👟', keywords: ['footwear', 'shoe', 'shoes', 'sneaker', 'sneakers', 'slipper', 'slippers', 'sandal', 'sandals', 'boots', 'leather', 'chappal'] },
  { id: 'fashion', label: 'Fashion & Clothes', icon: '👗', keywords: ['fashion', 'clothing', 'clothes', 'garments', 'saree', 'kurti', 'jeans', 'shirt', 'boutique', 'tailor', 'apparel', 'textile', 'menswear', 'womenswear'] },
  { id: 'grocery', label: 'Grocery & Kirana', icon: '🛒', keywords: ['grocery', 'kirana', 'supermarket', 'ration', 'daily needs', 'spices', 'oil', 'food', 'rice', 'atta', 'fmcg'] },
  { id: 'food', label: 'Restaurant & Cafe', icon: '🍽️', keywords: ['restaurant', 'cafe', 'food', 'bakery', 'sweets', 'mithai', 'cake', 'fast food', 'biryani', 'dhaba', 'tea', 'snacks'] },
  { id: 'beauty', label: 'Salon & Beauty', icon: '💇', keywords: ['salon', 'parlour', 'beauty', 'spa', 'hair', 'makeup', 'barber', 'cosmetics', 'grooming', 'facial'] },
  { id: 'automobile', label: 'Automobile & Garage', icon: '🚗', keywords: ['automobile', 'garage', 'bike', 'car', 'tyres', 'puncture', 'oil', 'service', 'spare parts', 'mechanic'] },
  { id: 'education', label: 'Books & Stationery', icon: '📚', keywords: ['stationery', 'books', 'school', 'xerox', 'printing', 'coaching', 'tuition', 'education'] },
  { id: 'hardware', label: 'Hardware & Sanitary', icon: '🔨', keywords: ['hardware', 'paint', 'sanitary', 'pipes', 'tools', 'tiles', 'plywood', 'electricals'] },
  { id: 'jewellery', label: 'Jewellery & Watches', icon: '💎', keywords: ['jewellery', 'jewelry', 'gold', 'silver', 'watch', 'watches', 'diamond', 'ornaments', 'gifts'] },
  { id: 'other', label: 'General / Other', icon: '🏪', keywords: ['general', 'retail', 'services', 'other'] }
];

export const RADIUS_OPTIONS = [
  { value: 5, label: '5 KM' },
  { value: 10, label: '10 KM' },
  { value: 25, label: '25 KM' },
  { value: 50, label: '50 KM' },
  { value: 100, label: '100 KM' },
  { value: 'all', label: 'All Distance' }
];

export default function UserNearbyVendors() {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRadius, setSelectedRadius] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = (overrideRadius) => {
    setLoading(true);
    const radiusToUse = overrideRadius !== undefined ? overrideRadius : selectedRadius;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          loadData(coords, radiusToUse);
        },
        () => {
          // Fallback location if permission denied
          const fallback = { lat: 22.5726, lng: 88.3639 };
          setUserLocation(fallback);
          loadData(fallback, radiusToUse);
        },
        { timeout: 8000 }
      );
    } else {
      const fallback = { lat: 22.5726, lng: 88.3639 };
      setUserLocation(fallback);
      loadData(fallback, radiusToUse);
    }
  };

  const loadData = (coords, radiusVal = selectedRadius) => {
    const params = {
      lat: coords?.lat ?? 22.5726,
      lng: coords?.lng ?? 88.3639,
      radius: radiusVal
    };
    getNearbyVendors(params)
      .then((res) => {
        const data = res.data.data || [];
        setVendors(data);
        applyFilters(data, search, selectedCategory, radiusVal);
      })
      .catch(() => {
        toast.error('Failed to load nearby stores');
      })
      .finally(() => setLoading(false));
  };

  const handleCategorySelect = (catId) => {
    if (catId === 'all') {
      // When 'All' is chosen, remove all filters and show all distance and all list
      setSelectedCategory('all');
      setSearch('');
      setSelectedRadius('all');
      if (userLocation) {
        loadData(userLocation, 'all');
      } else {
        fetchVendors('all');
      }
    } else {
      setSelectedCategory(catId);
    }
  };

  const handleRadiusSelect = (rVal) => {
    setSelectedRadius(rVal);
    if (rVal === 'all') {
      setSelectedCategory('all');
      setSearch('');
    }
    if (userLocation) {
      loadData(userLocation, rVal);
    } else {
      fetchVendors(rVal);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearch('');
    setSelectedRadius('all');
    if (userLocation) {
      loadData(userLocation, 'all');
    } else {
      fetchVendors('all');
    }
  };

  const applyFilters = (vendorList, queryText, categoryId, radiusVal = selectedRadius) => {
    let result = [...vendorList];

    // Distance Filter (if specific numeric radius is chosen and distance exists)
    if (radiusVal && radiusVal !== 'all' && Number(radiusVal) > 0) {
      const maxR = Number(radiusVal);
      result = result.filter(v => Number(v.distance || 0) <= maxR);
    }

    // Category Filter
    if (categoryId && categoryId !== 'all') {
      const catObj = VENDOR_CATEGORIES.find(c => c.id === categoryId);
      const catKeywords = catObj ? catObj.keywords : [];
      const catLabel = catObj ? catObj.label.toLowerCase() : '';

      result = result.filter(v => {
        const bType = (v.business_type || '').toLowerCase();
        const bKeywords = (v.keywords || '').toLowerCase();
        const bName = (v.business_name || '').toLowerCase();

        if (bType.includes(categoryId) || bType.includes(catLabel) || catLabel.includes(bType)) {
          return true;
        }

        // Check if vendor keywords or name match category keywords
        const vendorText = `${bType} ${bKeywords} ${bName}`;
        return catKeywords.some(kw => vendorText.includes(kw));
      });
    }

    // Search Query Filter (Searches name, category, keywords, address, and city)
    if (queryText && queryText.trim()) {
      const q = queryText.toLowerCase().trim();
      
      // Also expand search term if it matches known category keywords
      const matchingCats = VENDOR_CATEGORIES.filter(c => 
        c.label.toLowerCase().includes(q) || c.keywords.some(k => k.includes(q) || q.includes(k))
      );
      const expandedKeywords = matchingCats.flatMap(c => c.keywords);

      result = result.filter(v => {
        const bName = (v.business_name || '').toLowerCase();
        const oName = (v.owner_name || '').toLowerCase();
        const bType = (v.business_type || '').toLowerCase();
        const bKeywords = (v.keywords || '').toLowerCase();
        const bCity = (v.city || '').toLowerCase();
        const bAddr = (v.business_address || '').toLowerCase();

        const combinedText = `${bName} ${oName} ${bType} ${bKeywords} ${bCity} ${bAddr}`;

        if (combinedText.includes(q)) return true;

        // Check if any expanded category keywords match the vendor
        return expandedKeywords.some(kw => combinedText.includes(kw));
      });
    }

    setFilteredVendors(result);
  };

  useEffect(() => {
    applyFilters(vendors, search, selectedCategory, selectedRadius);
  }, [search, selectedCategory, selectedRadius, vendors]);

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
              🏪 Nearby Stores <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">{selectedRadius === 'all' ? 'All Distance' : `${selectedRadius}km Radius`}</span>
            </h1>
            <p className="text-xs text-slate-500">Discover stores & services accepting Japsan Pay</p>
          </div>
        </div>
        <button onClick={() => fetchVendors()} className="text-xs text-orange-600 bg-orange-50 hover:bg-orange-100 font-semibold px-3 py-1.5 rounded-xl border border-orange-200">
          🔄 Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search stores, keywords (e.g. Mobile, Clinic, Footwear, Shoes)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-orange-500 shadow-sm"
        />
        {search && (
          <button 
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {VENDOR_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md scale-105 ring-2 ring-orange-500'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance Filter Chips */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {RADIUS_OPTIONS.map((r) => {
            const isSelected = selectedRadius === r.value;
            return (
              <button
                key={r.value}
                onClick={() => handleRadiusSelect(r.value)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                📍 {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Status / Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800 font-bold">{filteredVendors.length}</strong> {filteredVendors.length === 1 ? 'store' : 'stores'}
          {selectedCategory !== 'all' && ` in ${VENDOR_CATEGORIES.find(c => c.id === selectedCategory)?.label}`}
          {selectedRadius !== 'all' && ` within ${selectedRadius}km`}
          {search && ` matching "${search}"`}
        </span>
        {(selectedCategory !== 'all' || selectedRadius !== 'all' || search) && (
          <button
            onClick={handleResetFilters}
            className="text-orange-600 font-bold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="font-bold text-slate-800">No stores found</h3>
          <p className="text-xs text-slate-500">
            {selectedCategory !== 'all'
              ? `No vendors registered under "${VENDOR_CATEGORIES.find(c => c.id === selectedCategory)?.label}" nearby.`
              : 'Try searching with another keyword like "Mobile", "Clinic", "Footwear", "Kirana"...'}
          </p>
          <button
            onClick={handleResetFilters}
            className="btn-primary text-xs px-4 py-2"
          >
            View All Stores
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVendors.map((v, index) => {
            const isSponsored = Boolean(v.is_sponsored_active);
            const keywordsList = v.keywords ? v.keywords.split(',').map(k => k.trim()).filter(Boolean) : [];

            return (
              <div
                key={v.id || index}
                className={`bg-white rounded-3xl p-4 shadow-sm border transition-all hover:shadow-md relative overflow-hidden ${
                  isSponsored ? 'border-amber-400 bg-gradient-to-br from-amber-50/40 via-white to-white ring-1 ring-amber-300' : 'border-slate-100'
                }`}
              >
                {/* Sponsored Badge */}
                {isSponsored && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow flex items-center gap-1">
                    <FiAward className="animate-spin-slow" size={12} /> TOP FEATURED #{index + 1}
                  </div>
                )}

                <div className="flex items-start gap-3.5">
                  {/* Photo / Logo */}
                  {v.profile_photo ? (
                    <img src={v.profile_photo} alt={v.business_name} className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shrink-0 shadow-sm">
                      🏪
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap pr-16">
                      <h3 className="font-black text-slate-800 text-base truncate">{v.business_name || v.owner_name}</h3>
                      {v.business_type && (
                        <span className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md font-bold">
                          {v.business_type}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <FiMapPin size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate">{[v.business_address, v.city, v.state].filter(Boolean).join(', ') || 'Local Store'}</span>
                    </p>

                    {/* Keywords / Tags if present */}
                    {keywordsList.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {keywordsList.slice(0, 4).map((kw, kIdx) => (
                          <span key={kIdx} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            #{kw}
                          </span>
                        ))}
                        {keywordsList.length > 4 && (
                          <span className="text-[10px] text-slate-400">+{keywordsList.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-xl flex items-center gap-1">
                        🎁 {v.cashback_percent || 10}% Cashback
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-xl">
                        📍 {Number(v.distance || 0) > 0 ? `${Number(v.distance).toFixed(1)} km away` : 'Nearby'}
                      </span>
                    </div>

                    {/* Optional Active Offer Preview */}
                    {v.latest_offer && (
                      <div className="mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-2.5 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-100 mb-0.5">
                          <span>🔥 Active Offer</span>
                          <span>Valid till {v.latest_offer.valid_until}</span>
                        </div>
                        <h4 className="text-xs font-bold">{v.latest_offer.title}</h4>
                        {v.latest_offer.description && (
                          <p className="text-[11px] text-emerald-50 line-clamp-1 mt-0.5">{v.latest_offer.description}</p>
                        )}
                      </div>
                    )}

                    {/* Visiting Card Preview if present */}
                    {v.visiting_card_photo && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Visiting Card</p>
                        <img
                          src={v.visiting_card_photo}
                          alt="Visiting Card"
                          className="w-full max-w-[220px] max-h-28 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-95"
                          onClick={() => window.open(v.visiting_card_photo, '_blank')}
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {v.phone && (
                        <a href={`tel:${v.phone}`} className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
                          <FiPhone size={12} /> Call Store
                        </a>
                      )}
                      <button
                        onClick={() => navigate('/user/scan-pay')}
                        className="ml-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                      >
                        ⚡ Pay with JC
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
