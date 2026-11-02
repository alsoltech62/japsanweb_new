import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { getVendorProfile, updateVendorProfile, uploadFile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function VendorProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { logout, updateUser }= useAuth();
  const navigate              = useNavigate();
  const cardInputRef = useRef(null);
  const profileInputRef = useRef(null);

  useEffect(() => {
    getVendorProfile().then(r => {
      setProfile(r.data.data);
      setForm({
        business_name: r.data.data.business_name || '',
        owner_name: r.data.data.owner_name || '',
        business_type: r.data.data.business_type || '',
        keywords: r.data.data.keywords || '',
        email: r.data.data.email || '',
        city: r.data.data.city || '',
        business_address: r.data.data.business_address || '',
        whatsapp_number: r.data.data.whatsapp_number || '',
        instagram_url: r.data.data.instagram_url || '',
        google_review_url: r.data.data.google_review_url || '',
        bank_account_number: r.data.data.bank_account_number || '',
        bank_ifsc: r.data.data.bank_ifsc || '',
        bank_name: r.data.data.bank_name || '',
        visiting_card_photo: r.data.data.visiting_card_photo || ''
      });
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      await updateVendorProfile(form);
      setProfile(p => ({ ...p, ...form }));
      updateUser(form);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  }

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await uploadFile(fd);
      if (res.data.success) {
        setForm(f => ({ ...f, [fieldName]: res.data.data.url }));
        toast.success('Photo uploaded!');
      } else {
        toast.error(res.data.message || 'Upload failed');
      }
    } catch (err) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-16 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  return (
    <div className="p-4 space-y-4 fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2 className="text-xl font-bold text-slate-800">🏪 Vendor Profile</h2>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center shadow-sm">
        {!editing && (
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 overflow-hidden bg-slate-100 border-2 border-slate-200">
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>🏪</span>
            )}
          </div>
        )}
        {editing ? (
          <div className="space-y-3 text-left">
            <div className="flex flex-col items-center mb-4">
              <label className="text-sm font-medium text-slate-700 mb-2">Store Logo / Profile Photo</label>
              <div className="relative cursor-pointer" onClick={() => profileInputRef.current?.click()}>
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  {form.profile_photo || profile?.profile_photo ? (
                    <img src={form.profile_photo || profile?.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🏪</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-1.5 shadow-sm">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={profileInputRef} onChange={e => handleFileUpload(e, 'profile_photo')} />
            </div>

            <div><label className="text-sm font-medium text-slate-700">Business Name</label>
              <input className="input-field mt-1" value={form.business_name} onChange={e=>setForm(f=>({...f,business_name:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Owner Name</label>
              <input className="input-field mt-1" value={form.owner_name} onChange={e=>setForm(f=>({...f,owner_name:e.target.value}))} /></div>
            <div>
              <label className="text-sm font-medium text-slate-700">Business Category</label>
              <select 
                className="input-field mt-1"
                value={form.business_type} 
                onChange={e=>setForm(f=>({...f,business_type:e.target.value}))}
              >
                <option value="">Select Category</option>
                <option value="Electronics & Mobile">📱 Electronics & Mobile (Phones, Laptops, Gadgets)</option>
                <option value="Medical & Clinic">💊 Medical & Clinic (Hospital, Pharmacy, Chemist)</option>
                <option value="Footwear & Shoes">👟 Footwear & Shoes (Slippers, Sandals, Boots)</option>
                <option value="Fashion & Clothes">👗 Fashion & Clothes (Garments, Sarees, Boutique)</option>
                <option value="Grocery & Kirana">🛒 Grocery & Kirana (Ration, Daily Needs, Spices)</option>
                <option value="Restaurant & Cafe">🍽️ Restaurant & Cafe (Food, Sweets, Bakery)</option>
                <option value="Salon & Beauty">💇 Salon & Beauty (Parlour, Spa, Cosmetics)</option>
                <option value="Automobile & Garage">🚗 Automobile & Garage (Bike, Car, Mechanic)</option>
                <option value="Books & Stationery">📚 Books & Stationery (Printing, Xerox, School)</option>
                <option value="Hardware & Sanitary">🔨 Hardware & Sanitary (Paint, Tools, Tiles)</option>
                <option value="Jewellery & Watches">💎 Jewellery & Watches (Gold, Silver, Gifts)</option>
                <option value="General Retail / Other">🏪 General Retail / Other Services</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                <span>Search Keywords (comma separated)</span>
                <span className="text-xs text-slate-400 font-normal">Helps users find your shop</span>
              </label>
              <input 
                className="input-field mt-1" 
                placeholder="e.g. mobile repair, iphone, charger, headphones, second hand phone" 
                value={form.keywords} 
                onChange={e=>setForm(f=>({...f,keywords:e.target.value}))} 
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tip: Enter items and services you offer (e.g. "Hospital, Dental Clinic, OPD" or "Shoes, Slippers, Boots")
              </p>
            </div>
            <div><label className="text-sm font-medium text-slate-700">Email</label>
              <input className="input-field mt-1" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">WhatsApp Number</label>
              <input className="input-field mt-1" value={form.whatsapp_number} onChange={e=>setForm(f=>({...f,whatsapp_number:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">City</label>
              <input className="input-field mt-1" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Business Address</label>
              <input className="input-field mt-1" value={form.business_address} onChange={e=>setForm(f=>({...f,business_address:e.target.value}))} /></div>
            
            <hr className="my-2" />
            <h4 className="font-bold text-sm text-slate-700">Social & Review Links</h4>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <span>📸</span> Instagram Page Link
              </label>
              <input 
                className="input-field mt-1" 
                placeholder="https://instagram.com/yourpage" 
                value={form.instagram_url} 
                onChange={e=>setForm(f=>({...f,instagram_url:e.target.value}))} 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <span>⭐</span> Google Maps / Reviews Link
              </label>
              <input 
                className="input-field mt-1" 
                placeholder="https://g.page/r/your-business/review" 
                value={form.google_review_url} 
                onChange={e=>setForm(f=>({...f,google_review_url:e.target.value}))} 
              />
            </div>

            <hr className="my-2" />
            <div>
              <label className="text-sm font-medium text-slate-700">Visiting Card Photo</label>
              <div className="mt-1 flex items-center gap-3">
                {form.visiting_card_photo && (
                  <img src={form.visiting_card_photo} alt="Visiting Card" className="w-16 h-12 object-cover rounded shadow-sm border border-slate-200" />
                )}
                <button type="button" onClick={() => cardInputRef.current?.click()} className="btn-secondary text-sm" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Card'}
                </button>
                <input type="file" accept="image/*" className="hidden" ref={cardInputRef} onChange={e => handleFileUpload(e, 'visiting_card_photo')} />
              </div>
            </div>

            <hr className="my-2" />
            <h4 className="font-bold text-sm text-slate-700">Bank Details</h4>
            <div><label className="text-sm font-medium text-slate-700">Bank Name</label>
              <input className="input-field mt-1" value={form.bank_name} onChange={e=>setForm(f=>({...f,bank_name:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Account Number</label>
              <input className="input-field mt-1" value={form.bank_account_number} onChange={e=>setForm(f=>({...f,bank_account_number:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">IFSC Code</label>
              <input className="input-field mt-1" value={form.bank_ifsc} onChange={e=>setForm(f=>({...f,bank_ifsc:e.target.value}))} /></div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="btn-primary flex-1">Save</button>
              <button onClick={()=>setEditing(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-slate-800">{profile?.business_name}</h3>
            <p className="text-slate-400 text-sm mt-1">📞 {profile?.phone}</p>
            <div className="bg-orange-50 border border-orange-100 rounded-xl py-1 px-3 mt-2 inline-flex items-center gap-2 mx-auto">
              <span className="text-orange-500 font-bold text-sm">QR</span>
              <span className="text-orange-700 font-bold text-sm">{profile?.phone}@japsan</span>
              <button onClick={() => {navigator.clipboard.writeText(`${profile?.phone}@japsan`); toast.success('UPI ID Copied!');}} className="text-orange-500 hover:text-orange-700" title="Copy UPI ID">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
            {profile?.business_type && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <span>🏷️</span> {profile.business_type}
              </div>
            )}
            {profile?.email && <p className="text-slate-400 text-sm mt-2">{profile?.email}</p>}
            <p className="text-slate-500 text-sm mt-1">📍 {profile?.business_address ? `${profile.business_address}, ${profile.city}` : profile?.city}</p>

            {profile?.keywords && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5 max-w-md mx-auto">
                {profile.keywords.split(',').map((kw, i) => kw.trim() && (
                  <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    #{kw.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Social Links Badges */}
            <div className="flex items-center justify-center gap-3 mt-3">
              {profile?.instagram_url && (
                <a
                  href={profile.instagram_url.startsWith('http') ? profile.instagram_url : `https://${profile.instagram_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200 hover:bg-pink-100 transition-all"
                >
                  <span>📸</span> Instagram Page
                </a>
              )}
              {profile?.google_review_url && (
                <a
                  href={profile.google_review_url.startsWith('http') ? profile.google_review_url : `https://${profile.google_review_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all"
                >
                  <span>⭐</span> Google Reviews
                </a>
              )}
            </div>

            {profile?.visiting_card_photo && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-1">Visiting Card</p>
                <img src={profile.visiting_card_photo} alt="Visiting Card" className="w-full max-w-[200px] mx-auto rounded shadow-sm border border-slate-100" />
              </div>
            )}
            <span className={`badge mt-2 inline-flex ${profile?.kyc_status==='approved'?'badge-success':profile?.kyc_status==='pending'?'badge-warning':'badge-info'}`}>
              KYC: {profile?.kyc_status}
            </span>
            <button onClick={()=>setEditing(true)} className="btn-secondary mt-4 w-full border-blue-200 text-blue-600 hover:bg-blue-50">Edit Profile</button>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm mt-4">
        <div className="p-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-800">Support & Information</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            {icon: 'ℹ️', label: 'About Us', text: 'Japsan Pay Ecosystem connects users and vendors through a dynamic rewards and payment system.'},
            {icon: '🎧', label: 'Support & Help', text: 'Contact us at support@japsanpay.com or call +91 98765 43210. Available 24/7.'},
            {icon: '❓', label: 'FAQs / Q&A', text: 'Q: How to withdraw? A: Use the withdraw section to transfer coins to your bank account.\nQ: When do referral coins unlock? A: When referred users make their first transaction.'},
            {icon: '🔒', label: 'Privacy Policy', text: 'Your data is secured and only used for KYC and transactions.'}
          ].map((item, idx) => (
            <details key={idx} className="group p-4 bg-white [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span className="font-medium text-slate-700">{item.label}</span>
                </div>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-500 pl-8 leading-relaxed whitespace-pre-wrap">{item.text}</p>
            </details>
          ))}
        </div>
      </div>

      <a 
        href="https://wa.me/919033733550" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full py-3 bg-green-50 text-green-700 rounded-2xl font-bold border border-green-200 hover:bg-green-100 transition-all shadow-sm flex items-center justify-center gap-2 mt-4"
      >
        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zM223.9 413.2c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 334.1l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.2-186.6 184.2zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-2.1-3.6 2.1-3.6 7.5-14.4 2.7-5.4 1.4-10.2-.0-12.8-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"></path></svg>
        WhatsApp Support
      </a>

      <button onClick={()=>{logout();navigate('/login', { replace: true });}}
        className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-200 hover:bg-red-100 transition-all shadow-sm flex items-center justify-center gap-2 mt-4">
        🚪 Logout
      </button>
    </div>
  );
}
