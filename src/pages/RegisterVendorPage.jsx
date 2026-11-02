import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerVendor, sendOtp, verifyOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STEPS = ['OTP Verify', 'Business Info', 'Bank & KYC'];

export default function RegisterVendorPage() {
  const [step, setStep]     = useState(0);
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [timer, setTimer]   = useState(0);
  const [form, setForm]     = useState({
    business_name:'', owner_name:'', email:'', business_type:'', business_address:'',
    city:'', state:'', pincode:'', gst_number:'', pan_number:'',
    bank_account_number:'', bank_ifsc:'', bank_name:'', whatsapp_number:'', referral_code: '', cashback_percent: 10,
    lat: '', lng: ''
  });
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSendOtp() {
    if (!phone || phone.length < 10) return toast.error('Enter 10-digit phone');
    setLoading(true);
    try {
      const res = await sendOtp({ phone, user_type: 'vendor', purpose: 'register' });
      if (res.data.data?.otp_dev) setDevOtp(res.data.data.otp_dev);
      toast.success('OTP sent!'); setTimer(60);
      const t = setInterval(() => setTimer(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; }), 1000);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  }

  async function handleVerifyOtp() {
    if (!otp || otp.length < 6) return toast.error('Enter OTP');
    setLoading(true);
    try {
      const res = await verifyOtp({ phone, otp, user_type: 'vendor', purpose: 'register' });
      if (res.data.success) {
        setStep(1);
        toast.success('Phone verified!');
      } else { toast.error('Already registered vendor — try logging in'); }
    } catch (err) {
      // If vendor already registered, they can still fill in details
      setStep(1); toast('Proceeding with registration...');
    }
    setLoading(false);
  }

  async function handleSubmit() {
    const required = ['business_name','owner_name','city','state'];
    for (const f of required) { if (!form[f]) return toast.error(`${f.replace(/_/g,' ')} is required`); }
    if (!form.lat || !form.lng) {
      toast.error('Location is missing. Trying to fetch location...');
      getLocation();
      return;
    }
    setLoading(true);
    try {
      await registerVendor({ ...form, phone });
      toast.success('Vendor registered! KYC under review.');
      navigate('/login');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    setLoading(false);
  }

  function getLocation() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast('Fetching your location...', { icon: '📍' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('lat', pos.coords.latitude);
        set('lng', pos.coords.longitude);
        toast.success('Location captured!');
      },
      (err) => {
        toast.error('Please allow location access to continue');
      }
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <img src="/JapSan.png" alt="Japsan Logo" className="w-16 h-16 mb-3 mx-auto rounded-2xl shadow-md" />
          <h1 className="text-3xl font-black text-slate-800">Register as Vendor</h1>
          <p className="text-slate-500 mt-2">Join Japsan Pay and grow your business</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all ${i === step ? 'bg-orange-500 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {i < step ? '✓' : i+1} {s}
              </div>
              {i < STEPS.length-1 && <div className={`h-px flex-1 ${i < step ? 'bg-green-500' : 'bg-slate-200'}`}/>}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
          {step === 0 && (
            <div className="space-y-4 slide-up">
              <h2 className="text-lg font-bold text-slate-800">Verify Phone Number</h2>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Phone</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-600 font-medium">+91</div>
                  <input className="input-field" type="tel" placeholder="9876543210" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} maxLength={10}/>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">OTP</label>
                  {timer > 0 ? <span className="text-xs text-slate-400">Resend in {timer}s</span>
                    : <button onClick={handleSendOtp} className="text-orange-500 text-sm font-medium" disabled={loading}>Send OTP</button>}
                </div>
                <input className="input-field text-center text-xl tracking-widest font-bold" placeholder="••••••" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}/>
                {devOtp && <p className="text-xs text-orange-500 mt-1 text-center">Dev OTP: <strong>{devOtp}</strong></p>}
              </div>
              <button onClick={handleVerifyOtp} disabled={loading||!otp} className="btn-primary w-full">{loading?'⏳ Verifying...':'Verify & Continue →'}</button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 slide-up">
              <h2 className="text-lg font-bold text-slate-800">Business Information</h2>
              {[
                ['business_name','Business Name *','text'],['owner_name','Owner Name *','text'],['email','Email','email'],
                ['business_type','Business Type','text'],['business_address','Address','text'],
                ['city','City *','text'],['state','State *','text'],['pincode','Pincode','text'],
                ['whatsapp_number','WhatsApp Number','text'],['referral_code','Referral Code (optional)','text'],
              ].map(([k,l,t]) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{l}</label>
                  <input className="input-field" type={t} placeholder={l} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Cashback % (1–20)</label>
                <input className="input-field" type="number" min={1} max={20} value={form.cashback_percent} onChange={e=>set('cashback_percent',e.target.value)}/>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-orange-800">Store Location (GPS)</span>
                  <button onClick={getLocation} className="text-xs bg-orange-500 text-white px-2 py-1 rounded-md">Get Location</button>
                </div>
                {form.lat ? (
                  <p className="text-xs text-orange-700">✓ Captured: {form.lat}, {form.lng}</p>
                ) : (
                  <p className="text-xs text-orange-600">Location is required so customers can find you nearby.</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-primary flex-1">Next →</button>
                <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Back</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 slide-up">
              <h2 className="text-lg font-bold text-slate-800">Bank & Tax Details</h2>
              <p className="text-sm text-slate-500">Required for withdrawal processing</p>
              {[
                ['gst_number','GST Number','text'],['pan_number','PAN Number','text'],
                ['bank_account_number','Bank Account Number','text'],['bank_ifsc','IFSC Code','text'],['bank_name','Bank Name','text'],
              ].map(([k,l,t]) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{l}</label>
                  <input className="input-field" type={t} placeholder={l} value={form[k]} onChange={e=>set(k,e.target.value)}/>
                </div>
              ))}
              <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                📋 KYC documents will be reviewed within 24-48 hours after registration
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">{loading?'⏳ Registering...':'🏪 Register Vendor'}</button>
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-slate-500 text-sm">Already registered? <Link to="/login" className="text-orange-500 font-medium">Login here</Link></p>
      </div>
    </div>
  );
}
