import React, { useState, useEffect } from 'react';
import { getVendorOffers, createVendorOffer, updateVendorOffer, deleteVendorOffer } from '../../services/api';
import toast from 'react-hot-toast';

export default function VendorOfferManagement() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [newOffer, setNewOffer] = useState({ title: '', description: '', type: 'Festival Offer', valid_until: '', status: 'active' });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = () => {
    setLoading(true);
    getVendorOffers()
      .then(res => setOffers(res.data.data || []))
      .catch(() => toast.error('Failed to load offers'))
      .finally(() => setLoading(false));
  };

  const handleSave = async () => {
    if (!newOffer.title || !newOffer.valid_until) return toast.error('Fill required fields');
    try {
      if (editingOffer) {
        await updateVendorOffer({ ...newOffer, id: editingOffer.id });
        toast.success('Offer updated!');
      } else {
        await createVendorOffer(newOffer);
        toast.success('Offer created!');
      }
      closeModal();
      fetchOffers();
    } catch (err) {
      toast.error('Failed to save offer');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await deleteVendorOffer(id);
      toast.success('Offer deleted!');
      fetchOffers();
    } catch (err) {
      toast.error('Failed to delete offer');
    }
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    // Convert YYYY-MM-DD HH:mm:ss to YYYY-MM-DD for date input
    const validUntil = offer.valid_until ? offer.valid_until.split(' ')[0] : '';
    setNewOffer({
      title: offer.title,
      description: offer.description || '',
      type: offer.type,
      valid_until: validUntil,
      status: offer.status
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOffer(null);
    setNewOffer({ title: '', description: '', type: 'Festival Offer', valid_until: '', status: 'active' });
  };

  return (
    <div className="p-4 space-y-4 fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">My Offers</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4 text-sm">+ New Offer</button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl" />)}</div>
      ) : offers.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">No active offers. Create one to attract customers!</div>
      ) : (
        <div className="space-y-3">
          {offers.map(o => (
            <div key={o.id} className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-400 opacity-20 rounded-full blur-xl"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-yellow-800 pr-16">{o.title}</h3>
                  <p className="text-xs text-yellow-700 font-medium mb-2">{o.type}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(o)} className="text-blue-500 hover:text-blue-700 bg-white p-1.5 rounded-full shadow-sm"><svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
                  <button onClick={() => handleDelete(o.id)} className="text-red-500 hover:text-red-700 bg-white p-1.5 rounded-full shadow-sm"><svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                </div>
              </div>

              <p className="text-sm text-yellow-900 mb-2 mt-1">{o.description}</p>
              
              <div className="flex items-center gap-2">
                <span className="badge badge-warning text-[10px]">Valid till: {new Date(o.valid_until).toLocaleDateString()}</span>
                <span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-danger'} text-[10px]`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl space-y-4 slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg text-slate-800">{editingOffer ? 'Edit Offer' : 'Create Offer'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500">Offer Type</label>
              <select className="input-field w-full mt-1" value={newOffer.type} onChange={e => setNewOffer({...newOffer, type: e.target.value})}>
                <option>Cashback Offer</option>
                <option>Festival Offer</option>
                <option>Happy Hour Offer</option>
                <option>Bonus Coin Offer</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-slate-500">Title</label>
              <input type="text" className="input-field w-full mt-1" placeholder="e.g. Diwali Dhamaka" value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Description</label>
              <textarea className="input-field w-full mt-1 h-20" placeholder="e.g. Get double coins on purchases above ₹1000" value={newOffer.description} onChange={e => setNewOffer({...newOffer, description: e.target.value})}></textarea>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500">Valid Until</label>
              <input type="date" className="input-field w-full mt-1" value={newOffer.valid_until} onChange={e => setNewOffer({...newOffer, valid_until: e.target.value})} />
            </div>

            {editingOffer && (
              <div>
                <label className="text-xs font-semibold text-slate-500">Status</label>
                <select className="input-field w-full mt-1" value={newOffer.status} onChange={e => setNewOffer({...newOffer, status: e.target.value})}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            <button onClick={handleSave} className="btn-primary w-full">{editingOffer ? 'Update Offer' : 'Create Offer'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
