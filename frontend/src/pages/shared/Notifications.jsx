import { useState, useEffect } from 'react'
import { Bell, Check, RefreshCw } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications/')
      setNotifications(res.data.results || res.data)
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifs() }, [])

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`)
      setNotifications(ns => ns.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {
      toast.error('Failed to mark read')
    }
  }

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all/')
      setNotifications(ns => ns.map(n => ({ ...n, is_read: true })))
      toast.success('All marked as read')
    } catch {
      toast.error('Failed to mark all read')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
    </div>
  )

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div style={{ padding: '1.5rem', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Bell size={24} color="var(--brand)" /> 
          Notifications {unreadCount > 0 && <span className="badge badge-danger">{unreadCount} New</span>}
        </h1>
        {unreadCount > 0 && (
          <button className="btn btn-primary" onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
            <Check size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Bell size={32} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
          No notifications yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(n => (
            <div 
              key={n.id} 
              className="card"
              style={{
                padding: '1rem 1.25rem',
                borderLeft: n.is_read ? '4px solid transparent' : '4px solid var(--brand)',
                backgroundColor: n.is_read ? 'var(--surface)' : 'rgba(99,102,241,0.05)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
                transition: 'all 0.2s',
              }}
            >
              <div>
                <p style={{ margin: '0 0 0.4rem', color: n.is_read ? 'var(--text-muted)' : 'var(--text)', fontWeight: n.is_read ? 400 : 500, lineHeight: 1.5, fontSize: '0.95rem' }}>
                  {n.message}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </div>
              {!n.is_read && (
                <button 
                  onClick={() => markRead(n.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', padding: '0.2rem', flexShrink: 0 }}
                  title="Mark as read"
                >
                  <Check size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
