import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sendOtp, verifyOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const [step, setStep]       = useState('phone'); // skip select
  const [userType]            = useState('admin');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer]     = useState(0);
  const [devOtp, setDevOtp]   = useState('');
  const { login }             = useAuth();
  const navigate              = useNavigate();

  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(t => t-1), 1000); return () => clearTimeout(t); }
  }, [timer]);

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!phone || phone.length < 10) return toast.error('Enter a valid phone number');
    setLoading(true);
    try {
      const res = await sendOtp({ phone, user_type: userType, purpose: step === 'phone' ? 'login' : 'login' });
      if (res.data.data?.otp_dev) setDevOtp(res.data.data.otp_dev);
      toast.success('OTP sent successfully!');
      setStep('otp');
      setTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOtp({ phone, otp, user_type: userType, purpose: 'login', name, email, referral_code: refCode });
      const { token, profile } = res.data.data;
      login(token, profile);
      toast.success('Welcome to Japsan Pay!');
      if (profile.role === 'user')   navigate('/user/dashboard');
      else if (profile.role === 'vendor') navigate('/vendor/dashboard');
      else navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-12 text-white">
        <img src="/JapSan.png" alt="Japsan Logo" className="w-24 h-24 mb-6 animate-float rounded-3xl shadow-lg" />
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 bg-clip-text text-transparent">Japsan Pay</h1>
        <p className="text-xl text-slate-300 text-center mb-8 leading-relaxed">India's smartest coin loyalty ecosystem. Earn, spend, and grow — with every transaction.</p>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {[['🏪','Vendor ROI Dashboard'],['🎁','Smart Cashback'],['👥','Referral Rewards'],['🔒','Secure Wallet']].map(([icon,label])=>(
            <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center border border-white/10">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm text-slate-300 font-medium">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Logo Mobile */}
            <div className="lg:hidden text-center mb-6">
              <img src="/JapSan.png" alt="Japsan Logo" className="w-16 h-16 mb-2 mx-auto rounded-2xl shadow-md" />
              <h1 className="text-3xl font-black bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 bg-clip-text text-transparent">Japsan Pay</h1>
            </div>



            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="slide-up">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  ⚙️ Admin Login
                </h2>
                <p className="text-slate-500 mb-6">Enter your registered mobile number</p>

                {userType === 'user' && (
                  <div className="mb-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-sm text-orange-700 font-medium">New user? We'll create your account automatically!</p>
                    <div className="mt-3 space-y-2">
                      <input className="input-field text-sm" placeholder="Your name (for new users)" value={name} onChange={e=>setName(e.target.value)} />
                      <input className="input-field text-sm" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
                      <input className="input-field text-sm" placeholder="Referral code (optional)" value={refCode} onChange={e=>setRefCode(e.target.value)} />
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-600 font-medium">+91</div>
                    <input className="input-field" type="tel" placeholder="9876543210" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} maxLength={10} required />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full text-lg" disabled={loading}>
                  {loading ? '⏳ Sending...' : '📲 Send OTP'}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="slide-up">
                <button type="button" onClick={() => setStep('phone')} className="text-slate-400 hover:text-slate-600 mb-6 flex items-center gap-2 text-sm">← Back</button>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify OTP</h2>
                <p className="text-slate-500 mb-1">OTP sent to <span className="font-semibold text-slate-700">+91-{phone}</span></p>
                {devOtp && <p className="text-xs text-orange-500 mb-4 bg-orange-50 px-3 py-1 rounded-lg">Dev OTP: <strong>{devOtp}</strong></p>}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">6-Digit OTP</label>
                  <input className="input-field text-center text-2xl font-bold tracking-widest" type="text" placeholder="••••••" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required />
                </div>
                <button type="submit" className="btn-primary w-full text-lg mb-4" disabled={loading}>
                  {loading ? '⏳ Verifying...' : '✅ Verify & Login'}
                </button>
                <div className="text-center">
                  {timer > 0
                    ? <span className="text-slate-400 text-sm">Resend OTP in {timer}s</span>
                    : <button type="button" onClick={handleSendOtp} className="text-orange-500 text-sm font-medium hover:text-orange-700">Resend OTP</button>
                  }
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
