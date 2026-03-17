import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Building2, LayoutDashboard, BedDouble, CreditCard,
  MessageSquare, QrCode, Bell, LogOut, Check,
  Users, BarChart3, Menu, X, ScanLine, RefreshCw
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import api from '../api'

const residentLinks = [
  { to: '/resident', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/resident/rooms', label: 'Browse Rooms', icon: <BedDouble size={18} /> },
  { to: '/resident/payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { to: '/resident/complaints', label: 'Complaints', icon: <MessageSquare size={18} /> },
  { to: '/resident/profile', label: 'My Profile & QR', icon: <QrCode size={18} /> },
]

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/rooms', label: 'Room Management', icon: <BedDouble size={18} /> },
  { to: '/admin/bookings', label: 'Bookings', icon: <Building2 size={18} /> },
  { to: '/admin/payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { to: '/admin/complaints', label: 'Complaints', icon: <MessageSquare size={18} /> },
  { to: '/admin/users', label: 'Residents', icon: <Users size={18} /> },
  { to: '/admin/gate', label: 'Gate Scanner', icon: <ScanLine size={18} /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
]

function NotificationPanel({ onClose }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications/')
      setNotifications(res.data.results || res.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifs() }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all/')
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 55,
        }}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(380px, 100vw)',
          background: 'var(--surface-2)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          zIndex: 60,
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          animation: 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={18} color="var(--brand-light)" />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Notifications</span>
            {unreadCount > 0 && (
              <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>{unreadCount}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, color: 'var(--brand-light)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
              >
                <Check size={12} /> All read
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6, display: 'flex' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Bell size={32} style={{ opacity: 0.2, display: 'block', margin: '0 auto 0.75rem' }} />
              No notifications yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--brand)',
                    background: n.is_read ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.07)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: '0 0 0.3rem',
                      color: n.is_read ? 'var(--text-muted)' : 'var(--text)',
                      fontWeight: n.is_read ? 400 : 500,
                      lineHeight: 1.5,
                      fontSize: '0.85rem',
                      wordBreak: 'break-word',
                    }}>
                      {n.message}
                    </p>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                      style={{ background: 'none', border: 'none', color: 'var(--brand-light)', cursor: 'pointer', padding: '0.15rem', flexShrink: 0, display: 'flex' }}
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const links = user?.role === 'admin' ? adminLinks : residentLinks

  // Close sidebar on route change (mobile nav)
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  useEffect(() => {
    api.get('/notifications/')
      .then(r => setUnread(r.data.results?.filter(n => !n.is_read).length || 0))
      .catch(() => {})
  }, [notifOpen]) // re-fetch unread count when panel closes

  const handleLogout = () => { logout(); navigate('/') }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Building2 size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>HostelMS</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role} Portal</div>
        </div>
        {/* Close button on mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="mobile-only"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', borderRadius: 6 }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
        {links.map(({ to, label, icon, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 0.9rem', borderRadius: 10,
            textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem',
            transition: 'all 0.15s',
            background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
            color: isActive ? 'var(--brand-light)' : 'var(--text-muted)',
            borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
          })}>
            {icon} {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.65rem', padding: '0.5rem 0.75rem' }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>

      {/* ── Mobile overlay backdrop ────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 40, backdropFilter: 'blur(2px)',
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* ── Desktop Sidebar (always visible ≥768px) ───── */}
      <aside className="sidebar-desktop" style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar (slide-in drawer) ──────────── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: 260,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        zIndex: 50,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }} className="sidebar-mobile">
        <SidebarContent />
      </aside>

      {/* ── Notification panel ─────────────────────────── */}
      {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}

      {/* ── Main content area ─────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface)', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(15,15,35,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
        }}>
          {/* Hamburger — only on mobile */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none', border: 'none', color: 'var(--text)',
              cursor: 'pointer', padding: '0.35rem', borderRadius: 8,
              display: 'none', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Menu size={22} />
          </button>

          {/* Page title / brand on mobile top bar */}
          <div className="topbar-brand" style={{ display: 'none', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1rem' }}>
            <Building2 size={18} color="var(--brand-light)" /> HostelMS
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              style={{ position: 'relative', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '0.25rem', borderRadius: 8 }}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unread > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--danger)', borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{unread}</span>
              )}
            </button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: 'clamp(1rem, 4vw, 2rem)' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
