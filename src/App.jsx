import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterVendorPage from './pages/RegisterVendorPage';

// User
import UserLayout from './components/user/UserLayout';
import UserDashboard from './pages/user/UserDashboard';
import UserWallet from './pages/user/UserWallet';
import UserBuyCoins from './pages/user/UserBuyCoins';
import UserReferral from './pages/user/UserReferral';
import UserNotifications from './pages/user/UserNotifications';
import UserProfile from './pages/user/UserProfile';
import UserScanAndPay from './pages/user/UserScanAndPay';
import UserNearbyVendors from './pages/user/UserNearbyVendors';
import UserOffers from './pages/user/UserOffers';
import UserNetwork from './pages/user/UserNetwork';
import UserSIP from './pages/user/UserSIP';
import UserFDRD from './pages/user/UserFDRD';
import UserSpinWin from './pages/user/UserSpinWin';

// Vendor
import VendorLayout from './components/vendor/VendorLayout';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorAdvertising from './pages/vendor/VendorAdvertising';
import VendorROI from './pages/vendor/VendorROI';
import VendorPayment from './pages/vendor/VendorPayment';
import VendorQRCode from './pages/vendor/VendorQRCode';
import VendorWallet from './pages/vendor/VendorWallet';
import VendorWithdraw from './pages/vendor/VendorWithdraw';
import VendorReferral from './pages/vendor/VendorReferral';
import VendorRewardSettings from './pages/vendor/VendorRewardSettings';
import VendorOfferManagement from './pages/vendor/VendorOfferManagement';
import VendorCampaigns from './pages/vendor/VendorCampaigns';
import VendorProfile from './pages/vendor/VendorProfile';
import VendorNotifications from './pages/vendor/VendorNotifications';
import VendorBuyCoins from './pages/vendor/VendorBuyCoins';

// Admin
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVendors from './pages/admin/AdminVendors';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminPackages from './pages/admin/AdminPackages';
import AdminBanners from './pages/admin/AdminBanners';
import AdminQROrders from './pages/admin/AdminQROrders';
import AdminInvestments from './pages/admin/AdminInvestments';
import AdminSpinRewards from './pages/admin/AdminSpinRewards';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) return <Navigate to="/login" replace />;
  return children;
}

function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'user') return <Navigate to="/user/dashboard" replace />;
  if (user?.role === 'vendor') return <Navigate to="/vendor/dashboard" replace />;
  if (user?.role === 'admin' || user?.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif' } }} />
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/register-vendor" element={<RegisterVendorPage />} />

          {/* USER ROUTES */}
          <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="wallet" element={<UserWallet />} />
            <Route path="buy-coins" element={<UserBuyCoins />} />
            <Route path="sip" element={<UserSIP />} />
            <Route path="fd-rd" element={<UserFDRD />} />
            <Route path="referral" element={<UserReferral />} />
            <Route path="notifications" element={<UserNotifications />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="scan-pay" element={<UserScanAndPay />} />
            <Route path="nearby" element={<UserNearbyVendors />} />
            <Route path="offers" element={<UserOffers />} />
            <Route path="network" element={<UserNetwork />} />
            <Route path="spin-win" element={<UserSpinWin />} />
          </Route>

          {/* VENDOR ROUTES */}
          <Route path="/vendor" element={<ProtectedRoute allowedRoles={['vendor']}><VendorLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="advertising" element={<VendorAdvertising />} />
            <Route path="roi" element={<VendorROI />} />
            <Route path="payment" element={<VendorPayment />} />
            <Route path="qr" element={<VendorQRCode />} />
            <Route path="wallet" element={<VendorWallet />} />
            <Route path="withdraw" element={<VendorWithdraw />} />
            <Route path="referral" element={<VendorReferral />} />
            <Route path="notifications" element={<VendorNotifications />} />
            <Route path="reward-settings" element={<VendorRewardSettings />} />
            <Route path="offers" element={<VendorOfferManagement />} />
            <Route path="campaigns" element={<VendorCampaigns />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="buy-coins" element={<VendorBuyCoins />} />
          </Route>

          {/* ADMIN ROUTES */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="investments" element={<AdminInvestments />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="qr-orders" element={<AdminQROrders />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="spin-rewards" element={<AdminSpinRewards />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
