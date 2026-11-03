import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  sendAdminNotification,
  getAdminNotifications,
  updateAdminNotification,
  deleteAdminNotification,
  getScheduledNotifications,
  createScheduledNotifications,
  updateScheduledNotification,
  deleteScheduledNotification,
  sendNowScheduledNotification,
  cancelScheduledNotification,
  resumeScheduledNotification,
  runDueScheduledNotifications
} from '../../services/api';
import {
  FiSend,
  FiList,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiImage,
  FiUsers,
  FiClock,
  FiX,
  FiCheck,
  FiCalendar,
  FiPlus,
  FiPlay,
  FiPause,
  FiRepeat,
  FiAlertCircle,
  FiLayers,
  FiZap
} from 'react-icons/fi';
import { format, parseISO, isPast } from 'date-fns';

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'queue' | 'send' | 'history'

  // ============================================================
  // TAB 1: SCHEDULE BATCH SLOTS STATE
  // ============================================================
  const getDefaultDateTime = (daysAhead = 1, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const createEmptySlot = (index = 0) => ({
    id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    title: '',
    message: '',
    target: 'all',
    scheduled_at: getDefaultDateTime(index + 1, 10),
    repeat_type: 'none',
    repeat_until: '',
    image_url: ''
  });

  // Initialize with 1 slot by default (user can easily add 5, 10 or more)
  const [scheduleSlots, setScheduleSlots] = useState([
    createEmptySlot(0)
  ]);
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // ============================================================
  // TAB 2: SCHEDULED QUEUE STATE
  // ============================================================
  const [scheduledList, setScheduledList] = useState([]);
  const [scheduledStats, setScheduledStats] = useState({ total: 0, pending: 0, sent: 0, cancelled: 0 });
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueStatusFilter, setQueueStatusFilter] = useState('all');
  const [queueTargetFilter, setQueueTargetFilter] = useState('all');
  const [queueSearchQuery, setQueueSearchQuery] = useState('');
  const [serverTime, setServerTime] = useState('');

  // Edit Scheduled Modal
  const [editingScheduled, setEditingScheduled] = useState(null);
  const [savingScheduledEdit, setSavingScheduledEdit] = useState(false);

  // ============================================================
  // TAB 3: INSTANT BROADCAST FORM STATE
  // ============================================================
  const [form, setForm] = useState({
    target: 'all',
    title: '',
    message: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================================================
  // TAB 4: SENT HISTORY STATE
  // ============================================================
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState('all');

  // Edit Broadcast Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ id: 0, title: '', message: '', target: 'all', image_url: '' });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch when tab changes
  useEffect(() => {
    if (activeTab === 'queue') {
      fetchScheduledQueue();
    } else if (activeTab === 'history') {
      fetchNotifications();
    }
  }, [activeTab, queueStatusFilter, queueTargetFilter, targetFilter]);

  // ============================================================
  // BATCH SCHEDULER ACTIONS
  // ============================================================
  const handleAddSlot = () => {
    setScheduleSlots(prev => [...prev, createEmptySlot(prev.length)]);
  };

  const handleAddMultipleSlots = (count = 10) => {
    setScheduleSlots(prev => {
      const newSlots = [];
      const currentLength = prev.length;
      for (let i = 0; i < count; i++) {
        newSlots.push(createEmptySlot(currentLength + i));
      }
      return [...prev, ...newSlots];
    });
    toast.success(`Added ${count} notification slots!`);
  };

  const handleRemoveSlot = (index) => {
    if (scheduleSlots.length <= 1) {
      return toast.error("At least one notification slot is required.");
    }
    setScheduleSlots(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSlotChange = (index, field, value) => {
    setScheduleSlots(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAutoDistributeDates = (intervalDays = 1, startHour = 10) => {
    setScheduleSlots(prev => {
      return prev.map((slot, idx) => ({
        ...slot,
        scheduled_at: getDefaultDateTime(idx + 1, startHour)
      }));
    });
    toast.success(`Distributed dates daily starting from tomorrow!`);
  };

  const handleScheduleSingleSlot = async (index) => {
    const slot = scheduleSlots[index];
    if (!slot.title.trim() || !slot.message.trim() || !slot.scheduled_at) {
      return toast.error(`Please fill in Title, Message, and Schedule Date/Time for Slot #${index + 1}.`);
    }

    setSchedulingLoading(true);
    try {
      const payload = {
        notifications: [{
          title: slot.title.trim(),
          message: slot.message.trim(),
          target: slot.target,
          scheduled_at: slot.scheduled_at.replace('T', ' ') + (slot.scheduled_at.length === 16 ? ':00' : ''),
          repeat_type: slot.repeat_type,
          repeat_until: slot.repeat_until ? slot.repeat_until.replace('T', ' ') + (slot.repeat_until.length === 16 ? ':00' : '') : null,
          image_url: slot.image_url?.trim() || null
        }]
      };

      const res = await createScheduledNotifications(payload);
      if (res.data?.success) {
        toast.success(res.data.message || `Notification #${index + 1} scheduled successfully!`);
        if (scheduleSlots.length > 1) {
          setScheduleSlots(prev => prev.filter((_, idx) => idx !== index));
        } else {
          setScheduleSlots([createEmptySlot(0)]);
        }
        setActiveTab('queue');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to schedule notification');
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Validate slots
    const validSlots = scheduleSlots.filter(s => s.title.trim() && s.message.trim() && s.scheduled_at);
    if (validSlots.length === 0) {
      return toast.error("Please fill in Title, Message, and Schedule Date/Time for at least 1 slot.");
    }

    setSchedulingLoading(true);
    try {
      const payload = {
        notifications: validSlots.map(s => ({
          title: s.title.trim(),
          message: s.message.trim(),
          target: s.target,
          scheduled_at: s.scheduled_at.replace('T', ' ') + (s.scheduled_at.length === 16 ? ':00' : ''),
          repeat_type: s.repeat_type,
          repeat_until: s.repeat_until ? s.repeat_until.replace('T', ' ') + (s.repeat_until.length === 16 ? ':00' : '') : null,
          image_url: s.image_url.trim() || null
        }))
      };

      const res = await createScheduledNotifications(payload);
      if (res.data?.success) {
        toast.success(res.data.message || `Successfully scheduled ${validSlots.length} notification(s)!`);
        // Reset to 1 fresh slot
        setScheduleSlots([createEmptySlot(0)]);
        setActiveTab('queue');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to schedule notifications');
    } finally {
      setSchedulingLoading(false);
    }
  };

  // ============================================================
  // SCHEDULED QUEUE ACTIONS
  // ============================================================
  const fetchScheduledQueue = async () => {
    setLoadingQueue(true);
    try {
      const res = await getScheduledNotifications({
        status: queueStatusFilter,
        target: queueTargetFilter,
        search: queueSearchQuery
      });
      if (res.data?.success) {
        setScheduledList(res.data.data?.notifications || []);
        setScheduledStats(res.data.data?.stats || { total: 0, pending: 0, sent: 0, cancelled: 0 });
        setServerTime(res.data.data?.server_time || '');
      }
    } catch (err) {
      toast.error('Failed to load scheduled queue');
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSendNowScheduled = async (item) => {
    if (!window.confirm(`Send notification "${item.title}" immediately to ${item.target === 'all' ? 'all users & vendors' : item.target}?`)) return;

    try {
      const res = await sendNowScheduledNotification(item.id);
      if (res.data?.success) {
        toast.success(res.data.message || 'Notification dispatched immediately!');
        fetchScheduledQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send notification now');
    }
  };

  const handleCancelScheduled = async (item) => {
    try {
      const res = await cancelScheduledNotification(item.id);
      if (res.data?.success) {
        toast.success('Notification schedule cancelled');
        fetchScheduledQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel schedule');
    }
  };

  const handleResumeScheduled = async (item) => {
    try {
      // If time was in past, set to 1 hour from now
      let nextTime = item.scheduled_at;
      if (new Date(item.scheduled_at) <= new Date()) {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        nextTime = format(d, 'yyyy-MM-dd HH:mm:ss');
      }

      const res = await resumeScheduledNotification(item.id, nextTime);
      if (res.data?.success) {
        toast.success('Notification schedule resumed!');
        fetchScheduledQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume schedule');
    }
  };

  const handleDeleteScheduled = async (item) => {
    if (!window.confirm(`Delete scheduled notification "${item.title}"?`)) return;

    try {
      const res = await deleteScheduledNotification(item.id);
      if (res.data?.success) {
        toast.success('Scheduled notification deleted');
        fetchScheduledQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete scheduled notification');
    }
  };

  const handleRunDueNow = async () => {
    try {
      const res = await runDueScheduledNotifications();
      if (res.data?.success) {
        const count = res.data.data?.processed || 0;
        toast.success(`Check complete! Processed ${count} due notification(s).`);
        fetchScheduledQueue();
      }
    } catch (err) {
      toast.error('Failed to trigger scheduled runner');
    }
  };

  const openScheduledEditModal = (item) => {
    setEditingScheduled({
      ...item,
      scheduled_at_input: item.scheduled_at ? format(new Date(item.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
      repeat_until_input: item.repeat_until ? format(new Date(item.repeat_until), "yyyy-MM-dd'T'HH:mm") : ''
    });
  };

  const handleSaveScheduledEdit = async (e) => {
    e.preventDefault();
    if (!editingScheduled.title.trim() || !editingScheduled.message.trim() || !editingScheduled.scheduled_at_input) {
      return toast.error("Title, message and schedule time are required");
    }

    setSavingScheduledEdit(true);
    try {
      const payload = {
        id: editingScheduled.id,
        title: editingScheduled.title.trim(),
        message: editingScheduled.message.trim(),
        target: editingScheduled.target,
        scheduled_at: editingScheduled.scheduled_at_input.replace('T', ' ') + ':00',
        repeat_type: editingScheduled.repeat_type,
        repeat_until: editingScheduled.repeat_until_input ? editingScheduled.repeat_until_input.replace('T', ' ') + ':00' : null,
        image_url: editingScheduled.image_url ? editingScheduled.image_url.trim() : null
      };

      const res = await updateScheduledNotification(payload);
      if (res.data?.success) {
        toast.success('Scheduled notification updated successfully!');
        setEditingScheduled(null);
        fetchScheduledQueue();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update scheduled notification');
    } finally {
      setSavingScheduledEdit(false);
    }
  };

  // ============================================================
  // INSTANT BROADCAST ACTIONS
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return toast.error("Title and message are required");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('target', form.target);
      formData.append('title', form.title.trim());
      formData.append('message', form.message.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await sendAdminNotification(formData);
      toast.success("Notification broadcasted successfully!");
      setForm({ target: 'all', title: '', message: '' });
      setImageFile(null);
      setImagePreview(null);
      if (activeTab === 'history') fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ============================================================
  // BROADCAST HISTORY ACTIONS
  // ============================================================
  const fetchNotifications = async () => {
    setLoadingList(true);
    try {
      const res = await getAdminNotifications({ type: targetFilter, search: searchQuery });
      if (res.data?.success) {
        setNotifications(res.data.data?.notifications || []);
      }
    } catch (err) {
      toast.error('Failed to load notifications history');
    } finally {
      setLoadingList(false);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      id: item.id,
      title: item.title,
      message: item.clean_message || item.message,
      target: item.target || 'all',
      image_url: item.image_url || ''
    });
    setEditImageFile(null);
    setEditImagePreview(item.image_url ? item.image_url : null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.message.trim()) {
      return toast.error('Title and message are required');
    }

    setSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append('action', 'edit');
      formData.append('id', editForm.id);
      formData.append('title', editForm.title.trim());
      formData.append('message', editForm.message.trim());
      if (editImageFile) {
        formData.append('image', editImageFile);
      } else if (editForm.image_url) {
        formData.append('image_url', editForm.image_url);
      }

      const res = await updateAdminNotification(formData);
      if (res.data?.success) {
        toast.success('Notification updated successfully!');
        setEditingItem(null);
        fetchNotifications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update notification');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete notification "${item.title}"?`)) return;

    setDeletingId(item.id);
    try {
      const res = await deleteAdminNotification(item.id);
      if (res.data?.success) {
        toast.success('Notification deleted successfully!');
        fetchNotifications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHistory = notifications.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (n.title || '').toLowerCase().includes(q) || (n.message || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 fade-in max-w-5xl mx-auto font-sans pb-16">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            📢 Notification Center & Auto-Scheduler
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Schedule multiple future notifications at once, set repeat schedules, or send instant broadcasts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'schedule'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FiCalendar size={14} /> ⏰ Auto Schedule
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'queue'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FiList size={14} /> 📋 Scheduled Queue ({scheduledStats.pending})
          </button>

          <button
            onClick={() => setActiveTab('send')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'send'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FiSend size={14} /> 🚀 Instant Broadcast
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'history'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            <FiClock size={14} /> 📜 History ({notifications.length})
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: AUTO SCHEDULE (BATCH PLANNER - UP TO 10+ AT ONCE) */}
      {/* ============================================================ */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Quick Helper Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-5 text-white shadow-lg shadow-orange-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-white/20 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                ⚡ Batch Schedule Mode
              </span>
              <h3 className="text-lg font-black">Plan Unlimited Future Notifications</h3>
              <p className="text-xs text-orange-100 max-w-xl">
                Fill in multiple slots below to schedule up to 10 or more notifications simultaneously. The system will automatically trigger and dispatch them via Firebase push and in-app alerts at the exact chosen date and time!
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddMultipleSlots(10)}
                className="bg-white text-orange-600 px-3.5 py-2 rounded-xl text-xs font-black shadow hover:bg-orange-50 transition-all flex items-center gap-1"
                title="Add 10 empty notification slots"
              >
                <FiPlus size={14} /> + 10 Slots
              </button>
              <button
                type="button"
                onClick={() => handleAddMultipleSlots(5)}
                className="bg-white/90 text-orange-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-white transition-all flex items-center gap-1"
              >
                <FiPlus size={14} /> + 5 Slots
              </button>
              <button
                type="button"
                onClick={() => handleAutoDistributeDates(1, 10)}
                className="bg-black/20 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-black/30 transition-all flex items-center gap-1"
                title="Spread schedule dates 1 day apart automatically"
              >
                <FiClock size={14} /> 📅 Auto-Spread Daily
              </button>
            </div>
          </div>

          {/* Schedule Form */}
          <form onSubmit={handleScheduleSubmit} noValidate className="space-y-5">
            <div className="space-y-4">
              {scheduleSlots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-orange-300 transition-all space-y-4 relative"
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                        #{index + 1}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Notification Slot {index + 1}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleScheduleSingleSlot(index)}
                        disabled={schedulingLoading}
                        className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        title="Schedule this single notification"
                      >
                        <FiCalendar size={13} /> Schedule Slot #{index + 1}
                      </button>

                      {scheduleSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(index)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Remove this slot"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Slot Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Target Audience */}
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Target Audience
                      </label>
                      <select
                        className="input-field text-xs py-2.5"
                        value={slot.target}
                        onChange={e => handleSlotChange(index, 'target', e.target.value)}
                      >
                        <option value="all">🌐 All Users & Vendors</option>
                        <option value="users">👤 Users (Customers) Only</option>
                        <option value="vendors">🏪 Vendors (Store Owners) Only</option>
                      </select>
                    </div>

                    {/* Scheduled Date & Time */}
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        ⏰ Schedule Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        className="input-field text-xs py-2 font-medium"
                        value={slot.scheduled_at || ''}
                        onChange={e => {
                          const val = e.target.value;
                          handleSlotChange(index, 'scheduled_at', val);
                        }}
                      />
                    </div>

                    {/* Repeat Type */}
                    <div className="md:col-span-4">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        🔄 Auto Repeat (Frequency)
                      </label>
                      <select
                        className="input-field text-xs py-2.5"
                        value={slot.repeat_type}
                        onChange={e => handleSlotChange(index, 'repeat_type', e.target.value)}
                      >
                        <option value="none">One-time (Send Once)</option>
                        <option value="daily">🔄 Repeat Daily (Every 24h)</option>
                        <option value="weekly">📅 Repeat Weekly (Every 7 Days)</option>
                        <option value="monthly">🗓️ Repeat Monthly</option>
                      </select>
                    </div>

                    {/* Notification Title */}
                    <div className="md:col-span-12">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Notification Title *
                      </label>
                      <input
                        type="text"
                        className="input-field text-xs font-semibold"
                        placeholder={`e.g. 🎁 Special Offer Alert #${index + 1}: Claim 10% bonus coins today!`}
                        value={slot.title}
                        onChange={e => handleSlotChange(index, 'title', e.target.value)}
                      />
                    </div>

                    {/* Notification Message */}
                    <div className="md:col-span-12">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Message Content *
                      </label>
                      <textarea
                        className="input-field text-xs min-h-[70px] leading-relaxed"
                        placeholder="Write the full announcement or deal message for this scheduled slot..."
                        value={slot.message}
                        onChange={e => handleSlotChange(index, 'message', e.target.value)}
                      />
                    </div>

                    {/* Optional Image URL & Repeat Until */}
                    <div className="md:col-span-6">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Banner Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        className="input-field text-xs"
                        placeholder="e.g. /uploads/banner.jpg or https://..."
                        value={slot.image_url}
                        onChange={e => handleSlotChange(index, 'image_url', e.target.value)}
                      />
                    </div>

                    {slot.repeat_type !== 'none' && (
                      <div className="md:col-span-6">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                          Repeat Until Date (Optional)
                        </label>
                        <input
                          type="datetime-local"
                          className="input-field text-xs py-2"
                          value={slot.repeat_until || ''}
                          onChange={e => handleSlotChange(index, 'repeat_until', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Slot Footer Action */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {slot.title.trim() && slot.message.trim() ? '✓ Ready to schedule' : 'Fill Title & Message to schedule this slot'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleScheduleSingleSlot(index)}
                      disabled={schedulingLoading}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <FiCalendar size={14} /> Save Slot #{index + 1} to Queue
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddSlot}
                  className="px-4 py-2.5 rounded-xl border border-dashed border-orange-400 text-orange-600 text-xs font-bold hover:bg-orange-50 transition flex items-center gap-1.5"
                >
                  <FiPlus size={16} /> + Add Another Slot
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMultipleSlots(5)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                >
                  + 5 More
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMultipleSlots(10)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                >
                  + 10 More
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-slate-500 font-medium block">
                    Filled Slots: <strong>{scheduleSlots.filter(s => s.title.trim() && s.message.trim()).length}</strong> / {scheduleSlots.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Ready to save in queue</span>
                </div>

                <button
                  type="submit"
                  disabled={schedulingLoading}
                  className="btn-primary flex-1 sm:flex-none px-6 py-3.5 flex items-center justify-center gap-2 text-sm font-black shadow-lg shadow-orange-500/25"
                >
                  {schedulingLoading ? (
                    <>
                      <span className="animate-spin text-base">↻</span>
                      Scheduling Notifications...
                    </>
                  ) : (
                    <>
                      <FiCalendar size={16} />
                      Save & Schedule All ({scheduleSlots.filter(s => s.title.trim() && s.message.trim()).length || scheduleSlots.length}) Notifications
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: SCHEDULED QUEUE (MANAGE & MONITOR) */}
      {/* ============================================================ */}
      {activeTab === 'queue' && (
        <div className="space-y-5">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FiClock size={18} />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Pending</span>
                <h4 className="text-xl font-black text-slate-800">{scheduledStats.pending}</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FiCheck size={18} />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Sent</span>
                <h4 className="text-xl font-black text-slate-800">{scheduledStats.sent}</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <FiPause size={18} />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Cancelled</span>
                <h4 className="text-xl font-black text-slate-800">{scheduledStats.cancelled}</h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FiLayers size={18} />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Scheduled</span>
                <h4 className="text-xl font-black text-slate-800">{scheduledStats.total}</h4>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search scheduled notifications..."
                value={queueSearchQuery}
                onChange={e => setQueueSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchScheduledQueue()}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={queueStatusFilter}
                onChange={e => setQueueStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">🕒 Pending (Upcoming)</option>
                <option value="sent">✅ Sent</option>
                <option value="cancelled">❌ Cancelled / Paused</option>
              </select>

              <select
                value={queueTargetFilter}
                onChange={e => setQueueTargetFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Audiences</option>
                <option value="users">Users Only</option>
                <option value="vendors">Vendors Only</option>
              </select>

              <button
                onClick={handleRunDueNow}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title="Force execute due scheduled notifications now"
              >
                <FiZap size={14} /> Process Due
              </button>

              <button
                onClick={fetchScheduledQueue}
                className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="Refresh"
              >
                <FiRefreshCw size={14} className={loadingQueue ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* List of Scheduled Items */}
          {loadingQueue ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : scheduledList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="text-4xl">⏰</div>
              <h3 className="font-bold text-slate-800 text-base">No scheduled notifications in queue</h3>
              <p className="text-xs text-slate-500">You haven't scheduled any upcoming notifications or none match your filter.</p>
              <button
                onClick={() => setActiveTab('schedule')}
                className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1"
              >
                <FiPlus size={14} /> Schedule Notifications Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledList.map((item) => {
                const isItemPast = item.scheduled_at ? isPast(parseISO(item.scheduled_at)) : false;
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${item.status === 'pending'
                              ? isItemPast
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-blue-100 text-blue-800'
                              : item.status === 'sent'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                            {item.status === 'pending' ? (isItemPast ? '⚠️ Due / In Queue' : '🕒 Pending') : item.status === 'sent' ? '✅ Sent' : '❌ Cancelled'}
                          </span>

                          {/* Target Audience Badge */}
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${item.target === 'all' ? 'bg-indigo-100 text-indigo-800' :
                              item.target === 'users' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                            {item.target === 'all' ? '🌐 All Users & Vendors' : item.target === 'users' ? '👤 Users' : '🏪 Vendors'}
                          </span>

                          {/* Repeat Badge */}
                          {item.repeat_type !== 'none' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                              <FiRepeat size={10} /> Repeat: {item.repeat_type.toUpperCase()}
                            </span>
                          )}

                          {/* Scheduled Date Time */}
                          <span className="text-slate-500 text-xs flex items-center gap-1 font-semibold">
                            <FiClock size={12} className="text-orange-500" />
                            Scheduled: {item.scheduled_at ? format(new Date(item.scheduled_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                          </span>
                        </div>

                        <h3 className="font-black text-slate-800 text-base">{item.title}</h3>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleSendNowScheduled(item)}
                            className="px-3 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-xs transition flex items-center gap-1"
                            title="Dispatch immediately ahead of schedule"
                          >
                            <FiPlay size={12} /> Send Now
                          </button>
                        )}

                        {item.status === 'pending' ? (
                          <button
                            onClick={() => handleCancelScheduled(item)}
                            className="p-2 text-slate-600 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl transition"
                            title="Pause / Cancel"
                          >
                            <FiPause size={14} />
                          </button>
                        ) : item.status === 'cancelled' ? (
                          <button
                            onClick={() => handleResumeScheduled(item)}
                            className="p-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl transition"
                            title="Resume to Pending"
                          >
                            <FiPlay size={14} />
                          </button>
                        ) : null}

                        <button
                          onClick={() => openScheduledEditModal(item)}
                          className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition"
                          title="Edit Scheduled Notification"
                        >
                          <FiEdit2 size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteScheduled(item)}
                          className="p-2 text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl transition"
                          title="Delete from Queue"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {item.message}
                    </p>

                    {item.image_url && (
                      <div className="pt-1">
                        <img
                          src={item.image_url.startsWith('http') ? item.image_url : (item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`)}
                          alt="Notification banner"
                          className="max-h-32 rounded-xl border border-slate-200 object-cover shadow-xs"
                        />
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Created: {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                      </span>
                      {item.sent_at && (
                        <span className="text-emerald-600 font-semibold">
                          Last Dispatched: {format(new Date(item.sent_at), 'dd MMM yyyy, hh:mm a')} (Total: {item.total_sent_count || 1})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: INSTANT BROADCAST (SEND IMMEDIATELY) */}
      {/* ============================================================ */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Target Audience</label>
              <select
                className="input-field"
                value={form.target}
                onChange={e => setForm({ ...form, target: e.target.value })}
              >
                <option value="all">🌐 All Users & Vendors</option>
                <option value="users">👤 Users (Customers) Only</option>
                <option value="vendors">🏪 Vendors (Store Owners) Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Notification Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. 🔥 Weekend Special: Get 20% Extra Cashback!"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Message Body *</label>
              <textarea
                className="input-field min-h-[120px]"
                placeholder="Write your announcement or offer details here..."
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Banner Image (Optional)</label>
              <p className="text-xs text-slate-400 mb-2">Recommended: 16:9 ratio. Supported: JPG, PNG, WEBP (Max 2MB)</p>
              <input
                type="file"
                accept="image/*"
                className="input-field text-xs"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img src={imagePreview} alt="Preview" className="max-h-40 rounded-2xl border border-slate-200 shadow-sm object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow hover:bg-rose-600"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-orange-500/20"
            >
              {loading ? <span className="animate-spin text-lg">↻</span> : <FiSend size={16} />}
              {loading ? 'Broadcasting Notification...' : '🚀 Send Broadcast Notification Now'}
            </button>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SENT NOTIFICATIONS HISTORY */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search notification title or message..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={targetFilter}
                onChange={e => setTargetFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                <option value="all">All Targets</option>
                <option value="user">Users Only</option>
                <option value="vendor">Vendors Only</option>
              </select>

              <button
                onClick={fetchNotifications}
                className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="Refresh"
              >
                <FiRefreshCw size={14} className={loadingList ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* List of Sent Notifications */}
          {loadingList ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="text-4xl">📭</div>
              <h3 className="font-bold text-slate-800 text-base">No notifications found</h3>
              <p className="text-xs text-slate-500">You haven't sent any notifications matching the current criteria.</p>
              <button
                onClick={() => setActiveTab('send')}
                className="btn-primary text-xs px-4 py-2"
              >
                Send Your First Notification
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${item.target === 'all' ? 'bg-indigo-100 text-indigo-800' :
                            item.target === 'users' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                          {item.target === 'all' ? '🌐 All Users & Vendors' : item.target === 'users' ? '👤 Users' : '🏪 Vendors'}
                        </span>
                        <span className="text-slate-400 text-xs flex items-center gap-1">
                          <FiClock size={12} />
                          {item.created_at ? format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a') : 'N/A'}
                        </span>
                      </div>
                      <h3 className="font-black text-slate-800 text-base">{item.title}</h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-all"
                        title="Edit Notification"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="p-2 text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl transition-all disabled:opacity-50"
                        title="Delete Notification"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {item.clean_message || item.message}
                  </p>

                  {item.image_url && (
                    <div className="pt-2">
                      <img
                        src={item.image_url.startsWith('http') ? item.image_url : (item.image_url.startsWith('/') ? item.image_url : `/${item.image_url}`)}
                        alt="Notification Media"
                        className="max-h-36 rounded-xl border border-slate-200 object-cover shadow-xs"
                      />
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FiUsers size={12} /> Recipients: <strong className="text-slate-700">{item.total_recipients || 1}</strong>
                    </span>
                    <span>
                      Read: <strong className="text-emerald-600">{item.read_count || 0}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT SCHEDULED NOTIFICATION */}
      {/* ============================================================ */}
      {editingScheduled && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-800">⏰ Edit Scheduled Notification</h3>
                <p className="text-xs text-slate-500">Update schedule date/time, content or recurrence rule</p>
              </div>
              <button
                onClick={() => setEditingScheduled(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveScheduledEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  className="input-field text-xs"
                  value={editingScheduled.target}
                  onChange={e => setEditingScheduled({ ...editingScheduled, target: e.target.value })}
                >
                  <option value="all">🌐 All Users & Vendors</option>
                  <option value="users">👤 Users Only</option>
                  <option value="vendors">🏪 Vendors Only</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scheduled Date & Time *</label>
                  <input
                    type="datetime-local"
                    className="input-field text-xs py-2"
                    value={editingScheduled.scheduled_at_input}
                    onChange={e => setEditingScheduled({ ...editingScheduled, scheduled_at_input: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Repeat Frequency</label>
                  <select
                    className="input-field text-xs py-2"
                    value={editingScheduled.repeat_type}
                    onChange={e => setEditingScheduled({ ...editingScheduled, repeat_type: e.target.value })}
                  >
                    <option value="none">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={editingScheduled.title}
                  onChange={e => setEditingScheduled({ ...editingScheduled, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  className="input-field min-h-[100px] text-sm"
                  value={editingScheduled.message}
                  onChange={e => setEditingScheduled({ ...editingScheduled, message: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image URL (Optional)</label>
                <input
                  type="text"
                  className="input-field text-xs"
                  value={editingScheduled.image_url || ''}
                  onChange={e => setEditingScheduled({ ...editingScheduled, image_url: e.target.value })}
                  placeholder="https://... or /uploads/..."
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingScheduled(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingScheduledEdit}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  {savingScheduledEdit ? 'Saving...' : 'Update Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT BROADCAST NOTIFICATION */}
      {/* ============================================================ */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-800">✏️ Edit Broadcast Notification</h3>
                <p className="text-xs text-slate-500">Update title, message content or banner image</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  className="input-field text-sm"
                  value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  className="input-field min-h-[120px] text-sm"
                  value={editForm.message}
                  onChange={e => setEditForm({ ...editForm, message: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Update Banner Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="input-field text-xs"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      setEditImageFile(file);
                      setEditImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {editImagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={editImagePreview} alt="Preview" className="max-h-32 rounded-xl border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => { setEditImageFile(null); setEditImagePreview(null); setEditForm({ ...editForm, image_url: '' }); }}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow hover:bg-rose-600"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary flex-1 flex items-center justify-center gap-1.5"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save & Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
