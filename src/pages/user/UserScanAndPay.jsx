import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { scanVendorQR, userPayVendor, userTransfer, getWallet, createRazorpayOrder } from '../../services/api';
import { FiCamera, FiCheckCircle, FiX, FiImage } from 'react-icons/fi';
import { QrReader } from 'react-qr-reader';
import jsQR from 'jsqr';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';

export default function UserScanAndPay() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('scan');
  const [vendorId, setVendorId] = useState('');
  const [vendorDetails, setVendorDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  
  const [billAmount, setBillAmount] = useState('');
  const [coinsToUse, setCoinsToUse] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [pin, setPin] = useState('');
  
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && (!user.name || !user.city)) {
      toast.error('Please complete your profile (Name, City) to make payments');
      navigate('/user/profile');
    }
  }, [user, navigate]);

  const downloadQR = (formatType = 'png') => {
    const svg = document.querySelector('#user-qr svg');
    if (!svg) return toast.error('QR code not found');

    if (formatType === 'svg') {
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `japsan-user-qr-${user?.phone || 'code'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('QR Code (SVG) downloaded!');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 700;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#EA580C';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JapSan Pay', canvas.width / 2, 55);

      ctx.fillStyle = '#64748B';
      ctx.font = '16px sans-serif';
      ctx.fillText('Scan to Pay / Transfer Coins', canvas.width / 2, 85);

      ctx.drawImage(img, 100, 110, 400, 400);

      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(user?.name || 'JapSan User', canvas.width / 2, 560);

      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`${user?.phone || ''}@japsan`, canvas.width / 2, 600);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px sans-serif';
      ctx.fillText('Secure Instant QR Payments', canvas.width / 2, 640);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `japsan-user-qr-${user?.phone || 'code'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URLObj.revokeObjectURL(blobURL);
      toast.success('QR Code downloaded successfully!');
    };
    img.src = blobURL;
  };

  const handleScan = async (scannedText) => {
    let query = scannedText || vendorId;
    if (!query) return toast.error('Enter Vendor/User ID to simulate scan');
    
    try {
      const parsed = JSON.parse(query);
      if (parsed.vendor_id) query = parsed.vendor_id;
      else if (parsed.user_id) query = parsed.user_id;
    } catch (e) {
      // Fallback: extract ID using regex if it's malformed/truncated JSON
      const vendorMatch = query.match(/"vendor_id"\s*:\s*"?(\d+)"?/);
      if (vendorMatch) {
        query = vendorMatch[1];
      } else {
        const userMatch = query.match(/"user_id"\s*:\s*"?(\d+)"?/);
        if (userMatch) {
          query = userMatch[1];
        }
      }
    }

    setLoading(true);
    try {
      const res = await scanVendorQR(query);
      if (res.data.success) {
        if (res.data.data.vendor) {
          setVendorDetails(res.data.data.vendor);
          setUserDetails(null);
        } else if (res.data.data.user) {
          setUserDetails(res.data.data.user);
          setVendorDetails(null);
        }
        const wRes = await getWallet();
        setWallet(wRes.data.data.wallet);
      } else {
        toast.error(res.data.message || 'Not found');
      }
    } catch (err) {
      toast.error('Invalid QR or User/Vendor not found');
    } finally {
      setLoading(false);
    }
  };

  const handleQRResult = async (result, error) => {
    if (result) {
      setShowScanner(false);
      setVendorId(result?.text || result);
      handleScan(result?.text || result);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          handleQRResult({ text: code.data });
        } else {
          toast.error('No QR code found in the image.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePayVendor = async () => {
    if (!billAmount || isNaN(billAmount)) return toast.error('Enter valid bill amount');
    if (pin.length < 4) return toast.error('Enter 4-digit PIN');

    const amt = Number(billAmount);
    const coins = Number(coinsToUse || 0);
    const discount = coins * 0.70;
    const cashToPay = Math.max(0, amt - discount);

    setLoading(true);

    try {
      if (cashToPay > 0) {
        if (!window.Razorpay) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load payment gateway'));
            document.body.appendChild(script);
          });
        }

        // Require online payment for the remaining cash via Razorpay
        const orderRes = await createRazorpayOrder({ 
          amount_inr: cashToPay,
          vendor_id: vendorDetails.id,
          bill_amount: amt,
          coins_to_use: coins,
          pin: pin
        });
        const { order_id, amount, key_id } = orderRes.data.data;
        const user = JSON.parse(localStorage.getItem('japsan_user') || '{}');

        const options = {
          key: key_id || import.meta.env.VITE_RAZORPAY_KEY || 'rzp_live_TN8KciymYkApmH',
          amount: amount,
          currency: "INR",
          name: vendorDetails.business_name || vendorDetails.owner_name || "Japsan Vendor",
          description: `Payment of ₹${cashToPay}`,
          order_id: order_id,
          prefill: {
            contact: user.phone || '',
            email: user.email || 'customer@japsanpay.com',
            name: user.name || 'Customer'
          },
          handler: async function (response) {
            try {
              const payload = {
                vendor_id: vendorDetails.id,
                bill_amount: amt,
                coins_to_use: coins,
                payment_method: 'online',
                pin: pin,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              };
              const res = await userPayVendor(payload);
              if (res.data.success) {
                toast.success('Payment successful!');
                navigate('/user/dashboard');
              } else {
                toast.error(res.data.message || 'Payment failed');
              }
            } catch (err) {
              toast.error(err.response?.data?.message || 'Payment processing failed');
            }
          },
          theme: { color: "#f97316" }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error(response.error.description || 'Payment failed');
        });
        rzp.open();
        setLoading(false);
      } else {
        // Fully paid with coins
        const payload = {
          vendor_id: vendorDetails.id,
          bill_amount: amt,
          coins_to_use: coins,
          payment_method: 'online',
          pin: pin
        };
        const res = await userPayVendor(payload);
        if (res.data.success) {
          toast.success('Payment successful!');
          navigate('/user/dashboard');
        } else {
          toast.error(res.data.message || 'Payment failed');
        }
        setLoading(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
      if (err.response?.data?.data?.profile_incomplete) {
        navigate('/user/profile');
      }
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || isNaN(transferAmount)) return toast.error('Enter valid amount');
    if (pin.length < 4) return toast.error('Enter 4-digit PIN');
    setLoading(true);
    try {
      const payload = {
        receiver_id: userDetails.id,
        amount: Number(transferAmount),
        pin: pin
      };
      const res = await userTransfer(payload);
      if (res.data.success) {
        toast.success('Transfer successful!');
        navigate('/user/dashboard');
      } else {
        toast.error(res.data.message || 'Transfer failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Transfer processing failed';
      toast.error(msg);
      if (err.response?.data?.data?.profile_incomplete) {
        navigate('/user/profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const qrValue = JSON.stringify({ user_id: user?.id, type: 'japsan_user_qr' });

  return (
    <div className="p-4 space-y-4 fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full">
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2 className="text-xl font-bold text-slate-800">Scan & Pay</h2>
      </div>

      <div className="flex bg-slate-200 p-1 rounded-xl">
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'scan' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          onClick={() => setActiveTab('scan')}
        >
          Scan QR
        </button>
        <button
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'my_qr' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          onClick={() => setActiveTab('my_qr')}
        >
          My QR
        </button>
      </div>
      
      {activeTab === 'my_qr' && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4 text-center" id="user-qr">
          <p className="text-slate-500 text-sm">Show or download this QR to receive coins & payments</p>
          <div className="inline-block p-4 bg-white rounded-2xl border-4 border-orange-500 shadow-lg">
            <QRCodeSVG value={qrValue} size={200} level="H" includeMargin={true} />
          </div>
          <div className="mt-2 w-full max-w-xs space-y-2">
            <p className="font-bold text-slate-800 text-lg">{user?.name}</p>
            <p className="text-slate-500 text-sm">{user?.phone}</p>
            <div className="bg-orange-50 border border-orange-100 rounded-xl py-1.5 px-3 inline-flex items-center gap-2">
              <span className="text-orange-700 font-bold text-sm">{user?.phone}@japsan</span>
              <button onClick={() => {navigator.clipboard.writeText(`${user?.phone}@japsan`); toast.success('UPI ID Copied!');}} className="text-orange-500 hover:text-orange-700" title="Copy UPI ID">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </button>
            </div>

            {/* QR Download Buttons */}
            <div className="pt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadQR('png')}
                className="btn-primary py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>📥</span> Download PNG
              </button>
              <button
                onClick={() => downloadQR('svg')}
                className="btn-secondary py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>🖼️</span> Download SVG
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scan' && !vendorDetails && !userDetails && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center space-y-4">
          
          {showScanner ? (
            <div className="w-full max-w-sm relative">
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute top-2 right-2 z-10 bg-white p-2 rounded-full shadow-md text-red-500"
              >
                <FiX />
              </button>
              <div className="rounded-xl overflow-hidden border-2 border-orange-500">
                <QrReader
                  onResult={handleQRResult}
                  constraints={{ facingMode: 'environment' }}
                  className="w-full"
                />
              </div>
              <p className="text-center mt-2 text-sm text-slate-500">Point camera at Vendor/User QR</p>
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <div 
                  className="w-20 h-20 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500 cursor-pointer hover:bg-orange-200 transition"
                  onClick={() => setShowScanner(true)}
                >
                  <FiCamera size={32} />
                </div>
                
                <label className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500 cursor-pointer hover:bg-blue-200 transition relative">
                  <FiImage size={32} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
              </div>
              <p className="text-slate-500 text-sm text-center">Tap camera to scan or image icon to upload QR, or enter ID below</p>
            </>
          )}

          {!showScanner && (
            <>
              <input
                type="text"
                placeholder="Enter Vendor/User ID or Phone"
                className="input-field text-center w-full max-w-xs"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              />
              <button onClick={() => handleScan()} disabled={loading} className="btn-primary w-full max-w-xs">
                {loading ? 'Scanning...' : 'Proceed'}
              </button>
            </>
          )}
        </div>
      )}

      {/* VENDOR PAYMENT UI */}
      {vendorDetails && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center gap-3 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-12 bg-blue-50"></div>
            {vendorDetails.profile_photo ? (
              <img src={vendorDetails.profile_photo} alt="Logo" className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm z-10" />
            ) : (
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl border-4 border-white shadow-sm z-10">
                🏪
              </div>
            )}
            <div className="z-10">
              <p className="font-bold text-slate-800 text-lg">{vendorDetails.business_name || vendorDetails.owner_name}</p>
              <p className="text-xs text-slate-500 font-medium">{vendorDetails.city || 'Local Shop'}</p>
              {vendorDetails.address && (
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">{vendorDetails.address}</p>
              )}

              {/* Instagram & Google Review Links */}
              {(vendorDetails.instagram_url || vendorDetails.google_review_url) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  {vendorDetails.instagram_url && (
                    <a
                      href={vendorDetails.instagram_url.startsWith('http') ? vendorDetails.instagram_url : `https://${vendorDetails.instagram_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 shadow-sm hover:opacity-90 transition"
                    >
                      <span>📸</span>
                      <span>Instagram</span>
                    </a>
                  )}
                  {vendorDetails.google_review_url && (
                    <a
                      href={vendorDetails.google_review_url.startsWith('http') ? vendorDetails.google_review_url : `https://${vendorDetails.google_review_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 bg-amber-50 border border-amber-200 shadow-sm hover:bg-amber-100 transition"
                    >
                      <span>⭐</span>
                      <span>Write Review</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Bill Amount (₹)</label>
              <input
                type="number"
                className="input-field w-full text-lg mt-1"
                placeholder="0.00"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-end">
                <label className="text-xs font-semibold text-slate-500 uppercase">Use Coins (Max: {wallet?.coin_balance || 0})</label>
                <span className="text-xs text-orange-500 font-medium cursor-pointer" onClick={() => setCoinsToUse(wallet?.coin_balance || 0)}>Max</span>
              </div>
              <input
                type="number"
                className="input-field w-full mt-1"
                placeholder="0"
                value={coinsToUse}
                onChange={(e) => setCoinsToUse(e.target.value)}
                max={wallet?.coin_balance || 0}
              />
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill Amount:</span>
                <span className="font-medium">₹{Number(billAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coin Discount:</span>
                <span className="font-medium text-green-600">-₹{(Number(coinsToUse || 0) * 0.70).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-800">To Pay:</span>
                <span className="text-slate-800">₹{Math.max(0, Number(billAmount || 0) - (Number(coinsToUse || 0) * 0.70)).toFixed(2)}</span>
              </div>
            </div>

            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase text-center block w-full mb-2">Enter 4-Digit PIN</label>
              <div className="flex gap-4 justify-center mt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${pin.length > i ? 'bg-slate-800 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    {pin.length > i && <div className="w-3 h-3 bg-white rounded-full"></div>}
                  </div>
                ))}
              </div>
              <input
                type="number"
                className="absolute inset-0 top-6 opacity-0 cursor-text w-full h-[calc(100%-24px)]"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>

            <button onClick={handlePayVendor} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiCheckCircle />
              {loading ? 'Processing...' : 'Confirm Payment'}
            </button>
            <button onClick={() => setVendorDetails(null)} className="btn-secondary w-full mt-2 text-slate-500 bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* USER TRANSFER UI */}
      {userDetails && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <p className="font-bold text-slate-800">{userDetails.name}</p>
              <p className="text-xs text-slate-500">{userDetails.phone} • {userDetails.city}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="bg-orange-50 rounded-xl p-3 flex justify-between items-center text-sm">
              <span className="text-orange-700">Available Balance:</span>
              <span className="font-bold text-orange-700">{wallet?.coin_balance || 0} 🪙</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Amount to Transfer (Coins)</label>
              <input
                type="number"
                className="input-field w-full text-lg mt-1"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase text-center block w-full mb-2">Enter 4-Digit PIN</label>
              <div className="flex gap-4 justify-center mt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all ${pin.length > i ? 'bg-slate-800 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    {pin.length > i && <div className="w-3 h-3 bg-white rounded-full"></div>}
                  </div>
                ))}
              </div>
              <input
                type="number"
                className="absolute inset-0 top-6 opacity-0 cursor-text w-full h-[calc(100%-24px)]"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>

            <button onClick={handleTransfer} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              <FiCheckCircle />
              {loading ? 'Processing...' : 'Send Coins'}
            </button>
            <button onClick={() => setUserDetails(null)} className="btn-secondary w-full mt-2 text-slate-500 bg-slate-100">
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
