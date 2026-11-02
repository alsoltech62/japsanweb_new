import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/japsan pay-ecosystem/backend/api';
// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
// const BASE_URL =
//   import.meta.env.VITE_API_URL ||
//   'https://japsoncoin.foodpulse.in/backend/api';
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://japsanpay.com/backend/api';
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('japsan_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('japsan_token');
      localStorage.removeItem('japsan_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────
export const sendOtp = (data) => api.post('/auth/send_otp.php', data);
export const verifyOtp = (data) => api.post('/auth/verify_otp.php', data);
export const registerVendor = (data) => api.post('/auth/register_vendor.php', data);

// ── USER ──────────────────────────────────────────────────────
export const getProfile = () => api.get('/users/profile.php');
export const updateProfile = (data) => api.put('/users/profile.php', data);
export const uploadFile = (data) => api.post('/upload.php', data, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getNearbyVendors = (params) => api.get('/users/nearby_vendors.php', { params });
export const getUserOffers = (params) => api.get('/users/offers.php', { params });
export const scanVendorQR = (vendorId) => api.get(`/qr/scan.php?vendor_id=${vendorId}`);
export const userPayVendor = (data) => api.post('/transactions/user_pay.php', data);
export const userTransfer = (data) => api.post('/transactions/user_transfer.php', data);
export const getNetwork = () => api.get('/users/network.php');

// ── WALLET ────────────────────────────────────────────────────
export const getWallet = () => api.get('/wallet/get_wallet.php');

// ── TRANSACTIONS ──────────────────────────────────────────────
export const createRazorpayOrder = (data) => api.post('/transactions/create_order.php', data);
export const processPayment = (data) => api.post('/transactions/process_payment.php', data);
export const buyCoins = (data) => api.post('/transactions/buy_coins.php', data);
export const getTransactions = (params) => api.get('/transactions/history.php', { params });

// ── VENDOR ────────────────────────────────────────────────────
export const getVendorProfile = () => api.get('/vendors/profile.php');
export const updateVendorProfile = (data) => api.put('/vendors/profile.php', data);
export const getROIDashboard = (params) => api.get('/vendors/roi_dashboard.php', { params });
export const getVendorQR = () => api.get('/qr/generate.php');
export const requestWithdraw = (data) => api.post('/vendors/withdraw.php', data);
export const getWithdrawals = () => api.get('/vendors/withdraw.php');
export const getRewardSettings = () => api.get('/vendors/reward_settings.php');
export const updateRewardSettings = (data) => api.put('/vendors/reward_settings.php', data);
export const getVendorOffers = () => api.get('/vendors/offers.php');
export const createVendorOffer = (data) => api.post('/vendors/offers.php', data);
export const updateVendorOffer = (data) => api.put('/vendors/offers.php', data);
export const deleteVendorOffer = (id) => api.delete(`/vendors/offers.php?id=${id}`);
export const sendVendorCampaign = (data) => api.post('/vendors/campaigns.php', data);
export const getNearbyCustomers = (params) => api.get('/vendors/nearby_customers.php', { params });
export const getVendorAdStatus = () => api.get('/vendors/advertising.php');
export const buyVendorAd = (data) => api.post('/vendors/advertising.php', data);

// ── REFERRAL ──────────────────────────────────────────────────
export const getReferrals = () => api.get('/referral/get_referrals.php');

// ── NOTIFICATIONS ─────────────────────────────────────────────
export const getNotifications = (params) => api.get('/notifications/list.php', { params });
export const markNotifRead = (data) => api.put('/notifications/list.php', data);
export const getAdminNotifications = (params) => api.get('/admin/send_notification.php', { params });
export const sendAdminNotification = (formData) => api.post('/admin/send_notification.php', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateAdminNotification = (formData) => api.post('/admin/send_notification.php', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const deleteAdminNotification = (id) => api.delete(`/admin/send_notification.php?id=${id}`, {
  data: { id }
});

// ── SCHEDULED NOTIFICATIONS ───────────────────────────────────
export const getScheduledNotifications = (params) => api.get('/admin/scheduled_notifications.php', { params });
export const createScheduledNotifications = (data, isFormData = false) => api.post('/admin/scheduled_notifications.php', data, isFormData ? {
  headers: { 'Content-Type': 'multipart/form-data' }
} : {});
export const updateScheduledNotification = (data, isFormData = false) => api.post('/admin/scheduled_notifications.php', isFormData ? data : { ...data, action: 'edit' }, isFormData ? {
  headers: { 'Content-Type': 'multipart/form-data' }
} : {});
export const deleteScheduledNotification = (id) => api.post('/admin/scheduled_notifications.php', { action: 'delete', id });
export const sendNowScheduledNotification = (id) => api.post('/admin/scheduled_notifications.php', { action: 'send_now', id });
export const cancelScheduledNotification = (id) => api.post('/admin/scheduled_notifications.php', { action: 'cancel', id });
export const resumeScheduledNotification = (id, scheduled_at) => api.post('/admin/scheduled_notifications.php', { action: 'resume', id, scheduled_at });
export const runDueScheduledNotifications = () => api.post('/admin/scheduled_notifications.php', { action: 'run_due' });



// ── ADMIN ─────────────────────────────────────────────────────
export const getAdminDashboard = (params) => api.get('/admin/dashboard.php', { params });
export const getSettings = () => api.get('/admin/settings.php');
export const updateSettings = (data) => api.put('/admin/settings.php', data);
export const getAdminUsers = (params) => api.get('/admin/users.php', { params });
export const adminUserAction = (data) => api.put('/admin/users.php', data);
export const getAdminVendors = (params) => api.get('/admin/vendors.php', { params });
export const adminVendorAction = (data) => api.put('/admin/vendors.php', data);
export const getAdminWithdrawals = (params) => api.get('/admin/withdrawals.php', { params });
export const adminWithdrawAction = (data) => api.put('/admin/withdrawals.php', data);

// ── PHYSICAL QR ORDERS ─────────────────────────────────────────
export const getVendorQROrderInfo = () => api.get('/vendors/qr_order.php');
export const orderPhysicalQR = (data) => api.post('/vendors/qr_order.php', data);
export const getAdminQROrders = (params) => api.get('/admin/qr_orders.php', { params });
export const updateAdminQROrder = (data) => api.put('/admin/qr_orders.php', data);
export const deleteAdminQROrder = (id) => api.delete(`/admin/qr_orders.php?id=${id}`);

// ── BANNERS ───────────────────────────────────────────────────
export const getActiveBanners = (target = 'user') => api.get('/banners/list.php', { params: { target } });
export const getAdminBanners = (params) => api.get('/admin/banners.php', { params });
export const createAdminBanner = (formData) => api.post('/admin/banners.php', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateAdminBanner = (data) => api.put('/admin/banners.php', data);
export const deleteAdminBanner = (id) => api.delete('/admin/banners.php', { data: { id } });

// ── INVESTMENTS (SIP, FD, RD) ──────────────────────────────────
export const getInvestmentPlans = (params) => api.get('/investments/plans.php', { params });
export const createAdminInvestmentPlan = (data) => api.post('/investments/plans.php', data);
export const updateAdminInvestmentPlan = (data) => api.put('/investments/plans.php', data);
export const deleteAdminInvestmentPlan = (id) => api.delete(`/investments/plans.php?id=${id}`);

export const createInvestmentOrder = (data) => api.post('/investments/create_order.php', data);
export const createSipSubscription = (data) => api.post('/investments/create_subscription.php', data);
export const startInvestment = (data) => api.post('/investments/invest.php', data);
export const getMyInvestments = (params) => api.get('/investments/my_investments.php', { params });
export const payInvestmentInstallment = (data) => api.post('/investments/pay_installment.php', data);
export const withdrawInvestment = (data) => api.post('/investments/withdraw.php', data);
export const getAdminInvestments = (params) => api.get('/investments/admin_investments.php', { params });
export const updateAdminInvestment = (data) => api.put('/investments/admin_investments.php', data);
export const getInvestmentSettings = () => api.get('/investments/settings.php');
export const updateInvestmentSettings = (data) => api.put('/investments/settings.php', data);

// ── DAILY LOGIN REWARDS ────────────────────────────────────────
export const getDailyRewardStatus = () => api.get('/rewards/daily_status.php');
export const claimDailyReward = () => api.post('/rewards/daily_claim.php');

// ── SPIN & WIN ────────────────────────────────────────────────
export const getSpinWheelData = () => api.get('/spin/get_wheel.php');
export const executeSpin = () => api.post('/spin/spin.php');
export const getActiveSpinReward = () => api.get('/spin/active_deposit_reward.php');
export const getSpinHistory = (params) => api.get('/spin/history.php', { params });
export const getAdminSpinData = (params) => api.get('/admin/spin_management.php', { params });
export const saveAdminSpinReward = (data) => api.post('/admin/spin_management.php', data);
export const deleteAdminSpinReward = (id) => api.delete(`/admin/spin_management.php?id=${id}`);

export default api;

