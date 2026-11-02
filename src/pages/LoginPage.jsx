import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { sendOtp, verifyOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [step, setStep]       = useState('select'); // select | phone | otp
  const [userType, setUserType] = useState('');
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

  const [refLocked, setRefLocked] = useState(false);
  const [showPopup, setShowPopup] = useState(true);

  useEffect(() => {
    if (timer > 0) { const t = setTimeout(() => setTimer(t => t-1), 1000); return () => clearTimeout(t); }
  }, [timer]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    const typeParam = params.get('type');
    if (ref) {
      setRefCode(ref);
      setRefLocked(true);
    }
    if (typeParam === 'vendor' || typeParam === 'user') {
      setUserType(typeParam);
      setStep('phone');
    }
  }, []);

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
      const payload = {
        phone, otp, user_type: userType, purpose: 'login',
        name, email, referral_code: refCode,
        business_name: userType === 'vendor' ? name : undefined,
        owner_name: userType === 'vendor' ? name : undefined,
        city: userType === 'vendor' ? email : undefined,
      };
      const res = await verifyOtp(payload);
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* App Download Popup */}
      {showPopup && (
        <div className="fixed bottom-6 lg:bottom-auto lg:top-6 left-0 right-0 mx-auto z-50 bg-white rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center gap-3 animate-bounce w-[92%] max-w-sm border border-orange-200">
          <img src="/JapSan.png" alt="App Icon" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm truncate">Download Japsan Pay</h3>
            <p className="text-xs text-slate-500 truncate">Best experience on mobile!</p>
          </div>
          <a href="https://play.google.com/store/apps/details?id=com.japsanpay.app&hl=en_IN" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-orange-400 to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:shadow-orange-500/50 transition-all flex-shrink-0">
            Install
          </a>
          <button onClick={() => setShowPopup(false)} className="absolute -top-2 -right-2 bg-slate-200 text-slate-600 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-slate-300">
            ✕
          </button>
        </div>
      )}
      
      <div className="flex-1 flex w-full">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 p-12 text-white">
        <img src="/JapSan.png" alt="Japsan Logo" className="w-48 h-48 mb-6 animate-float rounded-3xl shadow-lg" />
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
              <img src="/JapSan.png" alt="Japsan Logo" className="w-48 h-48 mb-2 mx-auto rounded-2xl shadow-md" />
              <h1 className="text-3xl font-black bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 bg-clip-text text-transparent">Japsan Pay</h1>
            </div>

            {step === 'select' && (
              <div className="slide-up">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
                <p className="text-slate-500 mb-4">Select how you want to log in</p>

                {/* Highly Visible Vendor Callout */}
                <div 
                  onClick={() => { setUserType('vendor'); setStep('phone'); }}
                  className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl cursor-pointer shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] border border-blue-400/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏪</span>
                    <div className="flex-1">
                      <p className="font-bold text-sm leading-tight text-yellow-300">Are you a Shop / Business Owner?</p>
                      <p className="text-xs text-blue-100 mt-0.5">Click here for Vendor Panel & Quick Rewards Setup →</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { type:'user',   label:'Customer / User',  desc:'Access your coin wallet & earn cashback',  icon:'👤', color:'from-orange-400 to-orange-600' },
                    { type:'vendor', label:'Business / Vendor', desc:'Accept payments, manage rewards & ROI',     icon:'🏪', color:'from-blue-400 to-blue-600' },
                  ].map(({type,label,desc,icon,color}) => (
                    <button key={type} onClick={() => { setUserType(type); setStep('phone'); }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-orange-300 hover:bg-orange-50 transition-all group">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
                      <div className="text-left">
                        <div className="font-semibold text-slate-800 group-hover:text-orange-700">{label}</div>
                        <div className="text-sm text-slate-500">{desc}</div>
                      </div>
                      <div className="ml-auto text-slate-300 group-hover:text-orange-400">→</div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link to="/register-vendor" className="text-orange-500 font-medium hover:text-orange-700 text-sm">New Vendor? Full Registration here →</Link>
                </div>
              </div>
            )}

            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="slide-up">
                <button type="button" onClick={() => setStep('select')} className="text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-2 text-sm">← Back</button>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {userType === 'user' ? '👤 User Login' : userType === 'vendor' ? '🏪 Vendor Login' : '⚙️ Admin Login'}
                  </h2>
                </div>

                {/* Switcher Banner if accidentally selected wrong */}
                {userType === 'user' ? (
                  <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                    <span className="text-xs text-amber-900 font-medium">🏪 Business Owner / Dukandar?</span>
                    <button type="button" onClick={() => setUserType('vendor')} className="text-xs font-bold text-blue-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-xs">
                      Switch to Vendor →
                    </button>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
                    <span className="text-xs text-blue-900 font-medium">👤 Normal Customer / User?</span>
                    <button type="button" onClick={() => setUserType('user')} className="text-xs font-bold text-orange-700 hover:underline bg-white px-2.5 py-1 rounded-lg border border-orange-200 shadow-xs">
                      Switch to User →
                    </button>
                  </div>
                )}

                <p className="text-slate-500 mb-4 text-sm">Enter your registered mobile number</p>

                {userType === 'user' && (
                  <div className="mb-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                    <p className="text-sm text-orange-700 font-medium">New user? We'll create your account automatically!</p>
                    <div className="mt-3 space-y-2">
                      <input className="input-field text-sm" placeholder="Your name (for new users)" value={name} onChange={e=>setName(e.target.value)} />
                      <input className="input-field text-sm" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
                      {refLocked && (
                        <input className="input-field text-sm bg-slate-100 text-slate-500" placeholder="Referral code" value={refCode} readOnly disabled />
                      )}
                    </div>
                  </div>
                )}

                {userType === 'vendor' && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-sm text-blue-700 font-bold">🏪 Instant Vendor Login / Auto-Registration</p>
                    <p className="text-xs text-blue-600 mt-1">Existing or new vendor? Simply enter phone number and OTP!</p>
                    <div className="mt-3 space-y-2">
                      <input className="input-field text-sm" placeholder="Business Name (for new vendor)" value={name} onChange={e=>setName(e.target.value)} />
                      <div className="flex gap-2">
                        <input className="input-field text-sm flex-1" placeholder="City (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
                        <input className="input-field text-sm flex-1" placeholder="Referral Code (optional)" value={refCode} onChange={e=>setRefCode(e.target.value)} disabled={refLocked} />
                      </div>
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
                {/* {devOtp && <p className="text-xs text-orange-500 mb-4 bg-orange-50 px-3 py-1 rounded-lg">Dev OTP: <strong>{devOtp}</strong></p>} */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">6-Digit OTP</label>
                  <input className="input-field text-center text-2xl font-bold tracking-widest" type="password" placeholder="••••••" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} required />
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
      
      {/* Footer with Play Store Link */}
      <div className="w-full py-6 flex flex-col justify-center items-center bg-slate-900/50 backdrop-blur-sm border-t border-white/5">
        <p className="text-slate-400 text-sm mb-3">Download the Japsan Pay App</p>
        <a href="https://play.google.com/store/apps/details?id=com.japsanpay.app&hl=en_IN" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-12" />
        </a>
      </div>
    </div>
  );
}
