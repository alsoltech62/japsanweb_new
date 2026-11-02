import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { getVendorQR, getVendorQROrderInfo, orderPhysicalQR } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiPackage, FiTruck, FiCheck, FiX, FiAlertCircle, FiShoppingBag, FiInfo } from 'react-icons/fi';

export default function VendorQRCode() {
  const [data, setData]               = useState(null);
  const [qrOrderInfo, setQrOrderInfo] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderForm, setOrderForm]     = useState({
    recipient_name: '',
    business_name: '',
    phone: '',
    alternate_phone: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([
      getVendorQR().then(r => setData(r.data?.data)),
      getVendorQROrderInfo().then(r => {
        if (r.data?.success) {
          setQrOrderInfo(r.data.data);
          const defs = r.data.data.vendor_defaults || {};
          setOrderForm(prev => ({
            ...prev,
            recipient_name: prev.recipient_name || defs.recipient_name || user?.name || '',
            business_name: prev.business_name || defs.business_name || user?.business_name || '',
            phone: prev.phone || defs.phone || user?.phone || '',
            address: prev.address || defs.address || '',
            city: prev.city || defs.city || '',
            state: prev.state || defs.state || '',
            pincode: prev.pincode || defs.pincode || '',
          }));
        }
      })
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  function openWhatsApp() {
    const number = data?.vendor?.whatsapp || data?.vendor?.phone;
    if (!number) return;
    window.open(`https://wa.me/${number.replace(/\D/g,'')}`, '_blank');
  }

  function downloadQR(formatType = 'png') {
    const svg = document.querySelector('#vendor-qr svg');
    if (!svg) return toast.error('QR code not found');

    const businessName = data?.vendor?.business_name || user?.name || 'Vendor Store';
    const upiId = `${data?.vendor?.phone || user?.phone || ''}@japsan`;

    if (formatType === 'svg') {
      const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `japsan-vendor-${data?.vendor?.phone || 'qr'}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Digital QR (SVG) downloaded!');
      return;
    }

    // High quality PNG download with store branding
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 650;
      canvas.height = 780;
      
      // Card background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top Banner Gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#EA580C');
      gradient.addColorStop(1, '#F59E0B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, 90);

      // Header Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('JapSan Pay Verified Vendor', canvas.width / 2, 42);

      ctx.fillStyle = '#FEF3C7';
      ctx.font = '15px sans-serif';
      ctx.fillText('Scan & Pay using JapSan Coins / UPI', canvas.width / 2, 72);

      // QR Code
      ctx.drawImage(img, 125, 120, 400, 400);

      // Store Details
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(businessName, canvas.width / 2, 570);

      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(upiId, canvas.width / 2, 610);

      // Cashback pill
      ctx.fillStyle = '#FFF7ED';
      ctx.fillRect(100, 640, 450, 45);
      ctx.strokeStyle = '#FDBA74';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(100, 640, 450, 45);

      ctx.fillStyle = '#C2410C';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`Instant ${data?.vendor?.cashback_pct || 10}% Cashback on Every Purchase!`, canvas.width / 2, 668);

      // Footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px sans-serif';
      ctx.fillText('Accepted Here • Powered by JapSan Pay', canvas.width / 2, 730);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `japsan-vendor-qr-${data?.vendor?.phone || 'store'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URLObj.revokeObjectURL(blobURL);
      toast.success('Digital QR downloaded successfully!');
    };
    img.src = blobURL;
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const price = qrOrderInfo?.coin_price || 50;
    const balance = qrOrderInfo?.coin_balance || 0;

    if (balance < price) {
      return toast.error(`Insufficient coins! Required: ${price} JC, Available: ${balance} JC`);
    }

    if (!orderForm.recipient_name || !orderForm.business_name || !orderForm.phone || !orderForm.address || !orderForm.city || !orderForm.state || !orderForm.pincode) {
      return toast.error('Please fill in all required address fields');
    }

    if (orderForm.pincode.replace(/\D/g, '').length !== 6) {
      return toast.error('Please enter a valid 6-digit PIN code');
    }

    setSubmittingOrder(true);
    try {
      const res = await orderPhysicalQR(orderForm);
      if (res.data?.success) {
        toast.success(res.data.message || 'QR Kit order placed successfully!');
        setShowOrderModal(false);
        loadData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place QR order');
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (loading) return <div className="p-6 space-y-4">{[1,2,3].map(i=><div key={i} className="h-40 bg-slate-200 rounded-2xl animate-pulse"/>)}</div>;

  const qrValue = data?.qr_data || JSON.stringify({ vendor_id: user?.id, type: 'japsan_vendor_qr' });
  const coinPrice = qrOrderInfo?.coin_price || 50;
  const packageItems = qrOrderInfo?.package_items || '2 Waterproof Stickers + 1 Acrylic Standee';
  const vendorBalance = qrOrderInfo?.coin_balance ?? (user?.coin_balance || 0);
  const previousOrders = qrOrderInfo?.orders || [];

  return (
    <div className="p-4 space-y-5 fade-in font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">📱 My QR Code</h2>
          <p className="text-slate-500 text-xs">Digital QR for customer payments & Physical QR Kit orders</p>
        </div>
      </div>

      {/* Physical QR Order Hero Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-xl"></div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
              🚀 Physical Delivery
            </span>
            <span className="bg-slate-900/40 text-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              Only {coinPrice} JC
            </span>
          </div>

          <div>
            <h3 className="text-lg font-black leading-tight">Order Official QR Kit for Your Shop</h3>
            <p className="text-xs text-amber-100 mt-1">
              Includes <span className="font-bold underline">{packageItems}</span> with your shop name & UPI ID printed. Delivered directly to your address!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => setShowOrderModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold shadow transition-all active:scale-95 flex items-center gap-1.5"
            >
              <FiPackage size={14} /> Order QR Kit Now ({coinPrice} JC)
            </button>
            <span className="text-[11px] text-amber-100 font-medium">
              Your Balance: <strong className="text-white">{vendorBalance} JC</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Digital QR Card */}
      <div className="bg-white rounded-3xl p-6 border border-orange-100 shadow text-center" id="vendor-qr">
        <div className="inline-block p-4 bg-white rounded-2xl border-4 border-orange-500 shadow-lg">
          <QRCodeSVG value={qrValue} size={200} level="H" includeMargin={true} />
        </div>
        <div className="mt-4">
          <p className="font-bold text-slate-800 text-lg">{data?.vendor?.business_name || user?.name}</p>
          <p className="text-slate-500 text-sm">{data?.vendor?.phone}</p>
          <div className="bg-orange-50 border border-orange-100 rounded-xl py-1 px-3 mt-1 inline-flex items-center gap-2">
            <p className="text-orange-700 font-bold text-sm">{data?.vendor?.phone || user?.phone}@japsan</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${data?.vendor?.phone || user?.phone}@japsan`);
                toast.success('UPI ID Copied!');
              }}
              className="text-orange-500 hover:text-orange-700"
              title="Copy UPI ID"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            </button>
          </div>
          <div className="mt-2"><p className="badge badge-orange">Japsan Pay Verified Vendor</p></div>
        </div>
        <div className="mt-3 bg-orange-50 rounded-xl p-3">
          <p className="text-sm text-orange-700 font-medium">Cashback: {data?.vendor?.cashback_pct || 10}% coins on every customer purchase</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-around">
        <div className="text-center">
          <p className="text-2xl font-black text-orange-500">{data?.scan_count || 0}</p>
          <p className="text-xs text-slate-500 font-medium">Total Scans</p>
        </div>
        <div className="w-px bg-slate-100"/>
        <div className="text-center">
          <p className="text-2xl font-black text-blue-500">{data?.vendor?.cashback_pct || 10}%</p>
          <p className="text-xs text-slate-500 font-medium">Cashback Rate</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => downloadQR('png')} className="btn-primary flex items-center justify-center gap-2 py-3">
          📥 Download PNG
        </button>
        <button onClick={() => downloadQR('svg')} className="btn-secondary flex items-center justify-center gap-2 py-3">
          🖼️ Download SVG
        </button>
        <button onClick={openWhatsApp} className="flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 font-semibold hover:bg-green-600 transition-all shadow-sm">
          💬 WhatsApp
        </button>
      </div>

      {/* Previous Physical QR Orders */}
      {previousOrders.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <span>📦</span> My Physical QR Orders
          </h3>
          <div className="space-y-2.5">
            {previousOrders.map(ord => (
              <div key={ord.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-800">#{ord.order_ref}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                    ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                    ord.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                    ord.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    ord.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ord.status}
                  </span>
                </div>
                <p className="text-slate-600">{ord.package_items} • <strong className="text-orange-600">{ord.coins_charged} JC</strong></p>
                <p className="text-slate-500 text-[11px] truncate">📍 {ord.address}, {ord.city} - {ord.pincode}</p>
                {ord.tracking_number && (
                  <p className="text-purple-700 font-medium text-[11px]">
                    🚚 Courier: {ord.tracking_courier || 'Standard'} (AWB: {ord.tracking_number})
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  Ordered on {ord.created_at ? format(new Date(ord.created_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <p className="font-semibold text-slate-700 text-sm mb-2">How it works:</p>
        <ol className="space-y-2 text-sm text-slate-600">
          <li className="flex gap-2"><span className="font-bold text-orange-500">1.</span> Order Standee & Stickers for your billing counter</li>
          <li className="flex gap-2"><span className="font-bold text-orange-500">2.</span> Customer scans the QR code at your shop</li>
          <li className="flex gap-2"><span className="font-bold text-orange-500">3.</span> Customer uses JapSan coins for instant discounts</li>
          <li className="flex gap-2"><span className="font-bold text-orange-500">4.</span> You get instant coin reimbursement & loyal customers!</li>
        </ol>
      </div>

      {/* Order Physical QR Kit Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-800">Order Physical QR Kit</h3>
                <p className="text-xs text-orange-600 font-semibold">{packageItems}</p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Price & Balance Indicator */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-800 font-medium">Order Price</p>
                <p className="text-lg font-black text-amber-900">{coinPrice} JC</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Your Coin Balance</p>
                <p className={`text-base font-bold ${vendorBalance >= coinPrice ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {vendorBalance} JC
                </p>
              </div>
            </div>

            {vendorBalance < coinPrice && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
                <span>You need {coinPrice - vendorBalance} more coins.</span>
                <button
                  type="button"
                  onClick={() => { setShowOrderModal(false); navigate('/vendor/buy-coins'); }}
                  className="bg-rose-600 text-white font-bold px-3 py-1 rounded-lg"
                >
                  Buy Coins
                </button>
              </div>
            )}

            <form onSubmit={handlePlaceOrder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Business / Shop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ghosh General Store"
                  className="input-field"
                  value={orderForm.business_name}
                  onChange={e => setOrderForm({ ...orderForm, business_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Recipient Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Koushik Ghosh"
                  className="input-field"
                  value={orderForm.recipient_name}
                  onChange={e => setOrderForm({ ...orderForm, recipient_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Mobile *</label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    className="input-field font-mono text-xs"
                    value={orderForm.phone}
                    onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alternate Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional"
                    className="input-field font-mono text-xs"
                    value={orderForm.alternate_phone}
                    onChange={e => setOrderForm({ ...orderForm, alternate_phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shop Delivery Address *</label>
                <textarea
                  placeholder="Shop No., Building Name, Street / Market..."
                  className="input-field h-20 resize-none text-xs"
                  value={orderForm.address}
                  onChange={e => setOrderForm({ ...orderForm, address: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near City Bank ATM"
                  className="input-field text-xs"
                  value={orderForm.landmark}
                  onChange={e => setOrderForm({ ...orderForm, landmark: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    placeholder="City"
                    className="input-field text-xs"
                    value={orderForm.city}
                    onChange={e => setOrderForm({ ...orderForm, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <input
                    type="text"
                    placeholder="State"
                    className="input-field text-xs"
                    value={orderForm.state}
                    onChange={e => setOrderForm({ ...orderForm, state: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digits"
                    className="input-field font-mono text-xs"
                    value={orderForm.pincode}
                    onChange={e => setOrderForm({ ...orderForm, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder || vendorBalance < coinPrice}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submittingOrder ? 'Placing Order...' : `Pay ${coinPrice} Coins & Order`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
