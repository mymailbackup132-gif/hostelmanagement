import { useState, useEffect } from 'react'
import { Users, Search, MoreVertical, Ban, KeyRound, RefreshCw, X, User, Phone, MapPin, AlertCircle, ShieldCheck, ShieldOff, Eye, Bell } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

function ResidentDetailModal({ userId, onClose }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/auth/admin/users/${userId}/`)
      .then(res => setUser(res.data))
      .catch(() => toast.error('Failed to load resident details'))
      .finally(() => setLoading(false))
  }, [userId])

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', flexShrink: 0, marginRight: '1rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '0.88rem', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 520, padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
          </div>
        ) : user ? (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', marginBottom: '1.75rem' }}>
              {user.profile_photo ? (
                <img src={user.profile_photo} alt="Profile" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--brand)', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={28} color="#fff" />
                </div>
              )}
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{user.full_name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>{user.email}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  {user.is_active
                    ? <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>Active</span>
                    : <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>Deactivated</span>
                  }
                  {user.is_2fa_setup
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: 'var(--success)', fontWeight: 600 }}><ShieldCheck size={11} /> 2FA On</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: 'var(--warning)', fontWeight: 600 }}><ShieldOff size={11} /> 2FA Pending</span>
                  }
                </div>
              </div>
            </div>

            {/* Personal */}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={11} /> Personal Details
            </div>
            <InfoRow label="Phone" value={user.phone} />
            <InfoRow label="Address" value={user.residential_address} />
            <InfoRow label="Member Since" value={user.date_joined ? new Date(user.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />

            {/* Emergency Contact */}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={11} /> Emergency Contact
            </div>
            <InfoRow label="Name" value={user.emergency_contact_name} />
            <InfoRow label="Phone" value={user.emergency_contact_phone} />

            {/* Parent Contact */}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Phone size={11} /> Parent Contact
            </div>
            <InfoRow label="Name" value={user.parent_contact_name} />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Phone</span>
              <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{user.parent_contact_phone || '—'}</span>
            </div>

            {/* ID Proof */}
            {user.id_proof && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={11} /> ID Proof
                </div>
                <a href={user.id_proof} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <Eye size={14} /> View ID Document
                </a>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>User not found.</div>
        )}
      </div>
    </div>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionMenu, setActionMenu] = useState(null)
  const [detailUserId, setDetailUserId] = useState(null)
  const [remindingId, setRemindingId] = useState(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/admin/users/?role=resident')
      setUsers(res.data.results || res.data)
    } catch {
      toast.error('Failed to load residents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    const handleNextClick = () => setActionMenu(null)
    if (actionMenu) document.addEventListener('click', handleNextClick)
    return () => document.removeEventListener('click', handleNextClick)
  }, [actionMenu])

  const handleAction = async (e, userId, action) => {
    e.stopPropagation()
    setActionMenu(null)

    try {
      if (action === 'deactivate') {
        const confirm = window.confirm('Are you sure you want to deactivate this user? Their Gate QR will be revoked immediately.')
        if (!confirm) return
        await api.post(`/auth/admin/deactivate/${userId}/`)
        toast.success('User deactivated')
        fetchUsers()
      } else if (action === 'reset_2fa') {
        const confirm = window.confirm('Reset 2FA for this user? They will need to scan a new QR code upon next login.')
        if (!confirm) return
        await api.post(`/auth/admin/reset-2fa/${userId}/`)
        toast.success('2FA reset successful')
        fetchUsers()
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Action failed')
    }
  }

  const handleSendReminder = async (e, userId) => {
    e.stopPropagation()
    setRemindingId(userId)
    try {
      await api.post(`/payments/admin/remind/${userId}/`)
      toast.success('Reminder sent successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send reminder')
    } finally {
      setRemindingId(null)
    }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
    </div>
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1040, margin: '0 auto' }}>
      {detailUserId && <ResidentDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Users size={22} color="var(--brand)" /> Resident Directory
        </h1>
        <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 2.5rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: '1rem 0' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No residents found.</div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Resident', 'Phone', 'Status', '2FA Status', 'Details', 'Reminder', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', position: 'relative' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', flexShrink: 0 }}>
                          {u.full_name?.[0]?.toUpperCase()}
                        </div>
                        {u.full_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginLeft: '2.25rem' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {u.is_active
                        ? <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Active</span>
                        : <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Deactivated</span>
                      }
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {u.is_2fa_setup
                        ? <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 500 }}><KeyRound size={14} /> Enabled</span>
                        : <span style={{ color: 'var(--warning)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 500 }}><KeyRound size={14} /> Pending</span>
                      }
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDetailUserId(u.id) }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, color: 'var(--brand)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <button
                        onClick={(e) => handleSendReminder(e, u.id)}
                        disabled={remindingId === u.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 6, color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600, cursor: remindingId === u.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: remindingId === u.id ? 0.6 : 1 }}
                      >
                        <Bell size={13} /> {remindingId === u.id ? 'Sending…' : 'Remind'}
                      </button>
                    </td>
                    <td style={{ padding: '1rem 1.25rem', position: 'relative' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === u.id ? null : u.id) }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem', borderRadius: 4 }}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {actionMenu === u.id && (
                        <div style={{
                          position: 'absolute', right: '1.25rem', top: '2.5rem', zIndex: 10,
                          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', minWidth: 160, padding: '0.3rem'
                        }}>
                          <button
                            onClick={(e) => handleAction(e, u.id, 'reset_2fa')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', borderRadius: 4 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <KeyRound size={14} /> Reset 2FA
                          </button>
                          {u.is_active && (
                            <button
                              onClick={(e) => handleAction(e, u.id, 'deactivate')}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.75rem', fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', textAlign: 'left', borderRadius: 4 }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                              <Ban size={14} /> Deactivate User
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
