import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/packages.php').then(r => {
      setPackages(r.data.data || []);
    }).catch(() => toast.error('Failed to load packages')).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (modal === 'add') {
        await api.post('/admin/packages.php', form);
        toast.success('Package added');
      } else if (modal === 'edit') {
        await api.put('/admin/packages.php', { ...form, id: form.id });
        toast.success('Package updated');
      }
      setModal(null);
      setForm({});
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this package?')) return;
    try {
      await api.delete(`/admin/packages.php?id=${id}`);
      toast.success('Package deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">📦 Coin Packages</h1>
        <button onClick={() => { setForm({ is_active: 1, is_popular: 0 }); setModal('add'); }} className="btn-primary">
          + Add Package
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(p => (
            <div key={p.id} className={`bg-white rounded-2xl p-5 border relative ${p.is_popular ? 'border-orange-400 shadow-md' : 'border-slate-100 shadow-sm'}`}>
              {p.is_popular == 1 && <span className="absolute -top-3 right-4 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">Popular</span>}
              {!p.is_active && <span className="absolute -top-3 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">Inactive</span>}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{p.label}</h3>
                  <div className="text-2xl font-black text-orange-500 mt-1">{p.coins} <span className="text-sm font-medium text-slate-500">Coins</span></div>
                </div>
                <div className="text-xl font-bold text-green-600">₹{p.price_inr}</div>
              </div>
              
              {p.bonus > 0 && (
                <div className="bg-orange-50 text-orange-700 text-sm font-medium p-2 rounded-lg mb-4 text-center">
                  +{p.bonus} Bonus Coins
                </div>
              )}
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                <button onClick={() => { setForm(p); setModal('edit'); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-sm font-medium transition-colors">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-xl text-sm font-medium transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {packages.length === 0 && <p className="text-slate-500 col-span-full">No packages found. Create one.</p>}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm slide-up">
            <h3 className="font-bold text-xl mb-4">{modal === 'add' ? 'Add Package' : 'Edit Package'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Label (e.g. Starter)</label>
                <input type="text" required className="input-field mt-1" value={form.label || ''} onChange={e => setForm({...form, label: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Coins</label>
                  <input type="number" required min="1" className="input-field mt-1" value={form.coins || ''} onChange={e => setForm({...form, coins: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700">Price (INR)</label>
                  <input type="number" required min="1" step="0.01" className="input-field mt-1" value={form.price_inr || ''} onChange={e => setForm({...form, price_inr: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Bonus Coins (Optional)</label>
                <input type="number" min="0" className="input-field mt-1" value={form.bonus || ''} onChange={e => setForm({...form, bonus: e.target.value})} />
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_popular == 1} onChange={e => setForm({...form, is_popular: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300" />
                  <span className="text-sm font-medium text-slate-700">Is Popular?</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active == 1} onChange={e => setForm({...form, is_active: e.target.checked ? 1 : 0})} className="w-4 h-4 rounded text-green-500 focus:ring-green-500 border-gray-300" />
                  <span className="text-sm font-medium text-slate-700">Is Active?</span>
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Save</button>
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
