import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import './index.css'

// Shared Layout
import AppLayout from './components/AppLayout'

// Public Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TOTPVerifyPage from './pages/TOTPVerifyPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotificationPage from './pages/shared/Notifications'

// Resident Pages
import ResidentDashboard from './pages/resident/ResidentDashboard'
import ResidentRooms from './pages/resident/ResidentRooms'
import ResidentProfile from './pages/resident/ResidentProfile'
import ResidentPayments from './pages/resident/ResidentPayments'
import ResidentComplaints from './pages/resident/ResidentComplaints'
import CompleteProfilePage from './pages/resident/CompleteProfilePage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRooms from './pages/admin/AdminRooms'
import AdminBookings from './pages/admin/AdminBookings'
import AdminGate from './pages/admin/AdminGate'
import AdminPayments from './pages/admin/AdminPayments'
import AdminComplaints from './pages/admin/AdminComplaints'
import AdminUsers from './pages/admin/AdminUsers'
import AdminAnalytics from './pages/admin/AdminAnalytics'

// Protected route wrapper
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/resident'} replace />
  
  // Wrap all authenticated routes in the AppLayout (sidebar + topbar)
  return <AppLayout>{children}</AppLayout>
}

// Unused Stub removed

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/resident'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/resident" replace /> : <RegisterPage />} />
      <Route path="/totp-verify" element={<TOTPVerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />

      {/* Resident Routes */}
      <Route path="/resident" element={<ProtectedRoute role="resident"><ResidentDashboard /></ProtectedRoute>} />
      <Route path="/resident/rooms" element={<ProtectedRoute role="resident"><ResidentRooms /></ProtectedRoute>} />
      <Route path="/resident/payments" element={<ProtectedRoute role="resident"><ResidentPayments /></ProtectedRoute>} />
      <Route path="/resident/complaints" element={<ProtectedRoute role="resident"><ResidentComplaints /></ProtectedRoute>} />
      <Route path="/resident/profile" element={<ProtectedRoute role="resident"><ResidentProfile /></ProtectedRoute>} />
      <Route path="/resident/complete-profile" element={<ProtectedRoute role="resident"><CompleteProfilePage /></ProtectedRoute>} />
      <Route path="/resident/notifications" element={<ProtectedRoute role="resident"><NotificationPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute role="admin"><AdminRooms /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute role="admin"><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute role="admin"><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute role="admin"><AdminComplaints /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/gate" element={<ProtectedRoute role="admin"><AdminGate /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><NotificationPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
