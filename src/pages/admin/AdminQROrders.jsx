import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminQROrders, updateAdminQROrder, deleteAdminQROrder } from '../../services/api';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiSearch, FiPrinter, FiX, FiExternalLink } from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { label: 'Pending', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  processing: { label: 'Processing', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  shipped: { label: 'Shipped', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'Delivered', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
  rejected: { label: 'Rejected', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export default function AdminQROrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'edit' | 'print_qr', order: ... }
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const limit = 20;

  function load() {
    setLoading(true);
    getAdminQROrders({ search, status, page, limit })
      .then((r) => {
        if (r.data?.success) {
          setOrders(r.data.data?.orders || []);
          setTotal(r.data.data?.total || 0);
          setStatusCounts(r.data.data?.status_counts || {});
        }
      })
      .catch(() => toast.error('Failed to load QR orders'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [search, status, page]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!modal?.order?.id) return;

    setSubmitting(true);
    try {
      const res = await updateAdminQROrder({
        id: modal.order.id,
        status: form.status,
        tracking_courier: form.tracking_courier,
        tracking_number: form.tracking_number,
        admin_notes: form.admin_notes,
        refund_coins: form.refund_coins || false,
      });

      if (res.data?.success) {
        toast.success('QR Order updated successfully');
        setModal(null);
        setForm({});
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, orderRef) => {
    if (!window.confirm(`Are you sure you want to delete order #${orderRef}?`)) return;
    try {
      const res = await deleteAdminQROrder(id);
      if (res.data?.success) {
        toast.success('Order deleted');
        load();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const handlePrintQR = () => {
    window.print();
  };

  async function downloadExcel() {
    try {
      const toastId = toast.loading('Generating Excel...');
      const r = await getAdminQROrders({ search, status, page: 1, limit: 100000 });
      const allOrders = r.data.data?.orders || [];
      toast.dismiss(toastId);
      if (!allOrders.length) return toast.error('No QR orders found to download');

      const headers = ['Order Ref', 'Business Name', 'Recipient Name', 'Phone', 'Address', 'Landmark', 'City', 'State', 'Pincode', 'Package', 'Coins Charged', 'Status', 'Courier', 'Tracking No', 'Ordered At'];
      const rows = allOrders.map((o) => [
        `"${o.order_ref}"`,
        `"${(o.business_name || '').replace(/"/g, '""')}"`,
        `"${(o.recipient_name || '').replace(/"/g, '""')}"`,
        `"${(o.phone || '').replace(/"/g, '""')}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.landmark || '').replace(/"/g, '""')}"`,
        `"${(o.city || '').replace(/"/g, '""')}"`,
        `"${(o.state || '').replace(/"/g, '""')}"`,
        `"${o.pincode}"`,
        `"${(o.package_items || '').replace(/"/g, '""')}"`,
        o.coins_charged || 50,
        `"${o.status}"`,
        `"${(o.tracking_courier || '').replace(/"/g, '""')}"`,
        `"${(o.tracking_number || '').replace(/"/g, '""')}"`,
        `"${o.created_at || ''}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `QR_Orders_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${allOrders.length} orders successfully!`);
    } catch (e) {
      toast.dismiss();
      toast.error('Failed to download Excel');
    }
  }

  return (
    <div className="space-y-5 fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>📦</span> Physical QR Orders
          </h1>
          <p className="text-sm text-slate-500">
            Manage vendor physical QR kit requests (2 Waterproof Stickers + 1 Table Standee)
          </p>
        </div>
        <button onClick={downloadExcel} className="btn-primary flex items-center gap-2 self-start shadow-md">
          <span>📥</span> Export to Excel
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'all', label: 'All Orders', count: statusCounts.all || 0, color: 'text-slate-900', bg: 'bg-white border-slate-200' },
          { key: 'pending', label: 'Pending', count: statusCounts.pending || 0, color: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-200' },
          { key: 'processing', label: 'Processing', count: statusCounts.processing || 0, color: 'text-blue-600', bg: 'bg-blue-50/50 border-blue-200' },
          { key: 'shipped', label: 'Shipped', count: statusCounts.shipped || 0, color: 'text-purple-600', bg: 'bg-purple-50/50 border-purple-200' },
          { key: 'delivered', label: 'Delivered', count: statusCounts.delivered || 0, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-200' },
          { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled || 0, color: 'text-rose-600', bg: 'bg-rose-50/50 border-rose-200' },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => { setStatus(m.key); setPage(1); }}
            className={`p-3.5 rounded-2xl border text-left transition-all ${m.bg} ${
              status === m.key ? 'ring-2 ring-orange-500 shadow-sm font-bold' : 'hover:shadow'
            }`}
          >
            <p className="text-xs font-semibold text-slate-500">{m.label}</p>
            <p className={`text-2xl font-black ${m.color}`}>{m.count}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-10"
            placeholder="Search by Order ID, Business, Phone, City, PIN or Tracking No..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-field sm:w-48"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-200 rounded-2xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            📦
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Physical QR Orders Found</h3>
          <p className="text-slate-500 text-sm mt-1">Vendor QR orders will appear here once placed.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  {['Order Info', 'Vendor & Shop', 'Delivery Address', 'Coins Paid', 'Tracking Info', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const statusObj = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={o.id} className="border-t border-slate-50 hover:bg-slate-50/80 transition-colors">
                      {/* Order Info */}
                      <td className="px-4 py-3">
                        <p className="font-mono font-bold text-slate-900 text-xs">#{o.order_ref}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {o.created_at ? format(new Date(o.created_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                        </p>
                        <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {o.package_items}
                        </span>
                      </td>

                      {/* Vendor */}
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800">{o.business_name}</p>
                        <p className="text-xs text-slate-500">{o.recipient_name}</p>
                        <p className="text-xs font-mono text-slate-600 mt-0.5">{o.phone}</p>
                        {o.alternate_phone && (
                          <p className="text-[10px] text-slate-400">Alt: {o.alternate_phone}</p>
                        )}
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{o.address}</p>
                        {o.landmark && <p className="text-[11px] text-slate-400">Near: {o.landmark}</p>}
                        <p className="text-xs font-bold text-slate-900 mt-1">
                          {o.city}, {o.state} - <span className="text-orange-600 font-mono">{o.pincode}</span>
                        </p>
                      </td>

                      {/* Coins Paid */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl text-xs">
                          🪙 {Number(o.coins_charged || 50).toFixed(0)} JC
                        </span>
                      </td>

                      {/* Tracking */}
                      <td className="px-4 py-3">
                        {o.tracking_number ? (
                          <div>
                            <p className="text-xs font-bold text-purple-700">{o.tracking_courier || 'Courier'}</p>
                            <p className="font-mono text-xs text-slate-800 select-all">{o.tracking_number}</p>
                            {o.shipped_at && (
                              <p className="text-[10px] text-slate-400">
                                Dispatched: {format(new Date(o.shipped_at), 'dd MMM yyyy')}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not Dispatched</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusObj.badge}`}>
                          {statusObj.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setForm({
                                status: o.status,
                                tracking_courier: o.tracking_courier || '',
                                tracking_number: o.tracking_number || '',
                                admin_notes: o.admin_notes || '',
                                refund_coins: false,
                              });
                              setModal({ type: 'edit', order: o });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold transition-all"
                          >
                            Update
                          </button>

                          <button
                            onClick={() => setModal({ type: 'print_qr', order: o })}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all flex items-center gap-1"
                            title="Preview and print vendor Standee QR"
                          >
                            <FiPrinter size={13} /> Print QR
                          </button>

                          <a
                            href={`https://wa.me/${o.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-all"
                            title="Chat on WhatsApp"
                          >
                            💬
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Update Order Modal */}
      {modal?.type === 'edit' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-800">Update QR Order</h3>
                <p className="text-xs text-slate-500 font-mono">Order #{modal.order.order_ref}</p>
              </div>
              <button
                onClick={() => { setModal(null); setForm({}); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Order Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input-field font-semibold"
                >
                  <option value="pending">⏳ Pending (Order Received)</option>
                  <option value="processing">⚙️ Processing (Printing Standee & Stickers)</option>
                  <option value="shipped">🚚 Shipped / Dispatched (Sent with Tracking)</option>
                  <option value="delivered">🎉 Delivered (Successfully Arrived at Shop)</option>
                  <option value="cancelled">❌ Cancelled</option>
                  <option value="rejected">🚫 Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Courier Partner / Delivery Guy</label>
                <input
                  type="text"
                  placeholder="e.g. DTDC, Delhivery, BlueDart, SpeedPost, Hand Delivery"
                  value={form.tracking_courier}
                  onChange={(e) => setForm({ ...form, tracking_courier: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking Number / AWB / Slip No.</label>
                <input
                  type="text"
                  placeholder="e.g. D123456789IN"
                  value={form.tracking_number}
                  onChange={(e) => setForm({ ...form, tracking_number: e.target.value })}
                  className="input-field font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Vendor will receive SMS/WhatsApp notification with this tracking ID.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Notes / Remarks (Optional)</label>
                <textarea
                  placeholder="Internal notes or reason for cancellation..."
                  value={form.admin_notes}
                  onChange={(e) => setForm({ ...form, admin_notes: e.target.value })}
                  className="input-field h-20 resize-none text-xs"
                />
              </div>

              {(form.status === 'cancelled' || form.status === 'rejected') && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="refund_coins"
                    checked={form.refund_coins}
                    onChange={(e) => setForm({ ...form, refund_coins: e.target.checked })}
                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="refund_coins" className="text-xs font-bold text-rose-800 cursor-pointer">
                    Refund {modal.order.coins_charged || 50} coins back to vendor wallet
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModal(null); setForm({}); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Vendor QR Modal */}
      {modal?.type === 'print_qr' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-800">Printable QR Standee Preview</h3>
                <p className="text-xs text-slate-500">Ready to print for {modal.order.business_name}</p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Standee Mockup Template */}
            <div id="printable-standee" className="bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white text-center shadow-lg border-4 border-amber-300 relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 mb-2">
                <img src="/JapSan.png" alt="Logo" className="w-8 h-8 rounded-lg bg-white p-0.5" />
                <span className="font-black text-xl tracking-wider">JAPSAN PAY</span>
              </div>
              <p className="text-xs font-semibold text-amber-100 uppercase tracking-widest mb-4">Official Merchant QR</p>

              <div className="bg-white rounded-2xl p-4 inline-block shadow-xl border-4 border-slate-900 mx-auto">
                <QRCodeSVG
                  value={modal.order.qr_data || JSON.stringify({ vendor_id: modal.order.vendor_id, type: 'japsan_vendor_qr' })}
                  size={190}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="mt-4 bg-slate-900/40 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                <h4 className="font-black text-lg text-white">{modal.order.business_name}</h4>
                <p className="text-xs text-amber-200 font-mono mt-0.5">{modal.order.phone}@japsan</p>
                <p className="text-[11px] text-amber-100 mt-1 font-medium">Scan with JapSan Pay & Earn Instant Cashback Coins</p>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={handlePrintQR}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <FiPrinter size={16} /> Print Standee Design
              </button>
              <button
                onClick={() => setModal(null)}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
