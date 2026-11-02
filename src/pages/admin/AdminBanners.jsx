import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEye, FiCheck, FiX, FiUploadCloud, FiUsers, FiShoppingBag, FiGlobe } from 'react-icons/fi';
import api from '../../services/api';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'user', 'vendor'
  const [form, setForm] = useState({
    title: '',
    target_url: '',
    target_type: 'user',
    display_order: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/banners.php');
      if (res.data?.success) {
        setBanners(res.data.data?.banners || []);
      }
    } catch (err) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        return toast.error('Banner size must be under 5MB');
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      return toast.error('Please select a banner image');
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('target_url', form.target_url);
      formData.append('target_type', form.target_type);
      formData.append('display_order', form.display_order);
      formData.append('image', imageFile);

      const res = await api.post('/admin/banners.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        toast.success('Banner added successfully!');
        setShowModal(false);
        setForm({ title: '', target_url: '', target_type: activeTab === 'vendor' ? 'vendor' : 'user', display_order: 0 });
        setImageFile(null);
        setImagePreview(null);
        fetchBanners();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await api.put('/admin/banners.php', {
        id: banner.id,
        is_active: banner.is_active == 1 ? 0 : 1
      });
      if (res.data?.success) {
        toast.success(`Banner ${banner.is_active == 1 ? 'deactivated' : 'activated'}`);
        fetchBanners();
      }
    } catch (err) {
      toast.error('Failed to update banner status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await api.delete(`/admin/banners.php?id=${id}`);
      if (res.data?.success) {
        toast.success('Banner deleted');
        setBanners(banners.filter(b => b.id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete banner');
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://japsanpay.com/backend${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const filteredBanners = banners.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'user') return b.target_type === 'user' || b.target_type === 'all' || !b.target_type;
    if (activeTab === 'vendor') return b.target_type === 'vendor' || b.target_type === 'all';
    return true;
  });

  const getTargetBadge = (targetType) => {
    if (targetType === 'vendor') {
      return (
        <span className="bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <FiShoppingBag size={12} /> Vendor App & Web
        </span>
      );
    } else if (targetType === 'all') {
      return (
        <span className="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
          <FiGlobe size={12} /> All (User & Vendor)
        </span>
      );
    }
    return (
      <span className="bg-orange-100 text-orange-800 border border-orange-200 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
        <FiUsers size={12} /> User App & Web
      </span>
    );
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Banner Management</h2>
          <p className="text-sm text-slate-500">Add, organize, and separate promotional banners for Users and Vendors</p>
        </div>
        <button
          onClick={() => {
            setForm({
              title: '',
              target_url: '',
              target_type: activeTab === 'vendor' ? 'vendor' : 'user',
              display_order: 0
            });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2 self-start shadow-md"
        >
          <FiPlus size={18} /> Add New Banner
        </button>
      </div>

      {/* Target Audience Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <span>🌐 All Banners</span>
          <span className="bg-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded-full font-medium">{banners.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'user'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
            }`}
        >
          <span>👥 User Banners</span>
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium">
            {banners.filter(b => b.target_type === 'user' || !b.target_type || b.target_type === 'all').length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('vendor')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'vendor'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'
            }`}
        >
          <span>🏪 Vendor Banners</span>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
            {banners.filter(b => b.target_type === 'vendor' || b.target_type === 'all').length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin text-3xl text-orange-500">↻</div>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🖼️
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Banners in this section</h3>
          <p className="text-slate-500 text-sm mt-1 mb-6">
            {activeTab === 'vendor' ? 'Upload promotional and announcement banners specifically for Vendors.' : 'Upload promotional banners for users.'}
          </p>
          <button
            onClick={() => {
              setForm({
                title: '',
                target_url: '',
                target_type: activeTab === 'vendor' ? 'vendor' : 'user',
                display_order: 0
              });
              setShowModal(true);
            }}
            className="btn-primary"
          >
            Upload Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanners.map((banner) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                  <img
                    src={formatImageUrl(banner.image_url)}
                    alt={banner.title || 'Banner'}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/600x300?text=Banner+Image'; }}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${banner.is_active == 1
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-white'
                        }`}
                    >
                      {banner.is_active == 1 ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {getTargetBadge(banner.target_type)}
                    <span className="text-xs text-slate-400 font-medium">Order: #{banner.display_order}</span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-base">
                    {banner.title || 'Untitled Banner'}
                  </h4>
                  {banner.target_url && (
                    <p className="text-xs text-blue-600 truncate">
                      🔗 {banner.target_url}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-50 flex items-center justify-between gap-2 mt-2">
                <button
                  onClick={() => handleToggleActive(banner)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${banner.is_active == 1
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  {banner.is_active == 1 ? <FiX size={14} /> : <FiCheck size={14} />}
                  {banner.is_active == 1 ? 'Deactivate' : 'Activate'}
                </button>

                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-all"
                  title="Delete Banner"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-800">Add New Banner</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Portal / Audience *</label>
                <select
                  value={form.target_type}
                  onChange={(e) => setForm({ ...form, target_type: e.target.value })}
                  className="input-field font-medium"
                >
                  <option value="user">👥 User Portal Only (App & Web)</option>
                  <option value="vendor">🏪 Vendor Portal Only (App & Web)</option>
                  <option value="all">🌐 Both Portals (User & Vendor)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Select whether this banner will appear to Users, Vendors, or both.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Banner Image *</label>
                <p className="text-xs text-slate-500 mb-2">Recommended: 16:9 or 2:1 ratio (e.g. 1200x600). Max 5MB.</p>
                <div className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl p-4 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    required
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div className="py-6 space-y-2">
                      <FiUploadCloud size={32} className="mx-auto text-orange-500" />
                      <p className="text-sm font-semibold text-slate-700">Click to upload banner image</p>
                      <p className="text-xs text-slate-400">PNG, JPG, WebP supported</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Banner Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Festive Cashback 20% Offer or Vendor Growth Tips"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Link / URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. /vendor/roi or /user/offers or https://japsanpay.com"
                  value={form.target_url}
                  onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Display Order</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                  className="input-field"
                />
                <p className="text-xs text-slate-400 mt-1">Lower numbers appear first (0, 1, 2...)</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Uploading...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
