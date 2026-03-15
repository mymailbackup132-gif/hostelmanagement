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

// Resident Pages
import ResidentDashboard from './pages/resident/ResidentDashboard'
import ResidentRooms from './pages/resident/ResidentRooms'
import ResidentProfile from './pages/resident/ResidentProfile'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRooms from './pages/admin/AdminRooms'
import AdminBookings from './pages/admin/AdminBookings'
import AdminGate from './pages/admin/AdminGate'

// Protected route wrapper
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/resident'} replace />
  
  // Wrap all authenticated routes in the AppLayout (sidebar + topbar)
  return <AppLayout>{children}</AppLayout>
}

// Placeholder for unbuilt pages
const Stub = ({ title, phase }) => (
  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>
    <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{title}</h2>
    <p>Coming up in Phase {phase}.</p>
  </div>
)

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/resident'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/resident" replace /> : <RegisterPage />} />
      <Route path="/totp-verify" element={<TOTPVerifyPage />} />

      {/* Resident Routes */}
      <Route path="/resident" element={<ProtectedRoute role="resident"><ResidentDashboard /></ProtectedRoute>} />
      <Route path="/resident/rooms" element={<ProtectedRoute role="resident"><ResidentRooms /></ProtectedRoute>} />
      <Route path="/resident/payments" element={<ProtectedRoute role="resident"><Stub title="My Payments" phase="4" /></ProtectedRoute>} />
      <Route path="/resident/complaints" element={<ProtectedRoute role="resident"><Stub title="My Complaints" phase="5" /></ProtectedRoute>} />
      <Route path="/resident/profile" element={<ProtectedRoute role="resident"><ResidentProfile /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute role="admin"><AdminRooms /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute role="admin"><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute role="admin"><Stub title="Payment Validation" phase="4" /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute role="admin"><Stub title="Complaint Management" phase="5" /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="admin"><Stub title="Resident Directory" phase="6" /></ProtectedRoute>} />
      <Route path="/admin/gate" element={<ProtectedRoute role="admin"><AdminGate /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute role="admin"><Stub title="Data & Analytics" phase="6" /></ProtectedRoute>} />

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
