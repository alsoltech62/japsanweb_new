import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getProfile, updateProfile, uploadFile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { logout, updateUser }= useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    getProfile().then(r => { setProfile(r.data.data); setForm({ name: r.data.data.name, email: r.data.data.email||'', city: r.data.data.city||'', area: r.data.data.area||'', dob: r.data.data.dob||'', profile_photo: r.data.data.profile_photo||'', kyc_document: r.data.data.kyc_document||'' }); })
      .catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    try {
      await updateProfile(form);
      setProfile(p => ({ ...p, ...form }));
      updateUser(form);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  }

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadFile(formData);
      if (res.data.success) {
        setForm(f => ({ ...f, [field]: res.data.data.url }));
        toast.success('File uploaded successfully');
      } else {
        toast.error('File upload failed');
      }
    } catch (err) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-16 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  return (
    <div className="p-4 space-y-4 fade-in">
      <h2 className="text-xl font-bold text-slate-800">👤 My Profile</h2>

      {/* Avatar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 text-center">
        {profile?.profile_photo ? (
          <img src={profile.profile_photo} alt="Profile" className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-orange-100" />
        ) : (
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">👤</div>
        )}
        {editing ? (
          <div className="space-y-3 text-left">
            <div><label className="text-sm font-medium text-slate-700">Profile Photo</label>
              <input type="file" className="input-field mt-1 w-full text-sm" accept="image/*" onChange={e=>handleFileUpload(e, 'profile_photo')} />
              {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
              {form.profile_photo && <p className="text-xs text-green-500 mt-1 truncate">File selected: {form.profile_photo.split('/').pop()}</p>}
            </div>
            <div><label className="text-sm font-medium text-slate-700">Name</label>
              <input className="input-field mt-1" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Email</label>
              <input className="input-field mt-1" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">City</label>
              <input className="input-field mt-1" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address</label>
              <input className="input-field mt-1" value={form.area} onChange={e=>setForm(f=>({...f,area:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Date of Birth</label>
              <input className="input-field mt-1" type="date" value={form.dob} onChange={e=>setForm(f=>({...f,dob:e.target.value}))} /></div>
            <div><label className="text-sm font-medium text-slate-700">KYC Document (Aadhar/PAN)</label>
              <input type="file" className="input-field mt-1 w-full text-sm" accept="image/*,.pdf" onChange={e=>handleFileUpload(e, 'kyc_document')} />
              {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
              {form.kyc_document && <p className="text-xs text-green-500 mt-1 truncate">File selected: {form.kyc_document.split('/').pop()}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} className="btn-primary flex-1">Save</button>
              <button onClick={()=>setEditing(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold text-slate-800">{profile?.name}</h3>
            <p className="text-slate-500">{profile?.phone}</p>
            <div className="bg-orange-50 border border-orange-100 rounded-xl py-1 px-3 mt-2 inline-flex items-center gap-2 mx-auto">
              <span className="text-orange-500 font-bold text-sm">QR</span>
              <span className="text-orange-700 font-bold text-sm">{profile?.phone}@japsan</span>
              <button onClick={() => {navigator.clipboard.writeText(`${profile?.phone}@japsan`); toast.success('UPI ID Copied!');}} className="text-orange-500 hover:text-orange-700" title="Copy UPI ID">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>
            {profile?.email && <p className="text-slate-400 text-sm mt-2">{profile?.email}</p>}
            {(profile?.city || profile?.area) && <p className="text-slate-500 text-sm mt-1">📍 {profile?.area ? profile.area + ', ' : ''}{profile?.city}</p>}
            {profile?.dob && <p className="text-slate-500 text-sm">🎂 {profile?.dob}</p>}
            <span className={`badge mt-2 inline-flex ${profile?.kyc_status==='approved'?'badge-success':profile?.kyc_status==='pending'?'badge-warning':'badge-info'}`}>
              KYC: {profile?.kyc_status}
            </span>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={()=>setEditing(true)} className="btn-secondary w-full text-xs py-2.5">✏️ Edit Profile</button>
              <button onClick={()=>navigate('/user/scan-pay')} className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-1">📱 My QR Code</button>
            </div>
          </>
        )}
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100">
        <p className="text-sm text-slate-500 mb-1">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <p className="text-xl font-black text-orange-500 tracking-widest">{profile?.referral_code}</p>
          <button onClick={()=>{navigator.clipboard.writeText(profile?.referral_code||'');toast.success('Copied!');}} className="text-orange-500 text-sm font-medium">Copy</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {label:'Total Earned',   value:`${Number(profile?.total_coins_earned||0).toLocaleString()} 🪙`},
          {label:'Total Redeemed', value:`${Number(profile?.total_coins_redeemed||0).toLocaleString()} 🪙`},
          {label:'Referral Invites',value:profile?.referral_stats?.total_referrals||0},
          {label:'Referral Coins', value:`${Number(profile?.referral_stats?.total_earned||0).toLocaleString()} 🪙`},
        ].map(({label,value}) => (
          <div key={label} className="stat-card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-800">Support & Information</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {[
            {icon: 'ℹ️', label: 'About Us', text: 'Japsan Pay Ecosystem connects users and vendors through a dynamic rewards and payment system.'},
            {icon: '🎧', label: 'Support & Help', text: 'Contact us at support@japsanpay.com or call +91 98765 43210. Available 24/7.'},
            {icon: '❓', label: 'FAQs / Q&A', text: 'Q: How to earn? A: Scan & pay, refer friends. Q: How to withdraw? A: Only vendors can withdraw to bank. Users can use coins to buy.'},
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
        className="w-full py-3.5 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-200 hover:bg-red-100 transition-all mt-4 flex items-center justify-center gap-2">
        🚪 Logout
      </button>
    </div>
  );
}
