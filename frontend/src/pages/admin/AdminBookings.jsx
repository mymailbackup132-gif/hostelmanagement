import { useState, useEffect } from 'react'
import { Card } from '../../components/ui/Card'
import { CheckCircle, XCircle, Search, Home, Clock } from 'lucide-react'
import api from '../../api'
import { toast } from 'react-hot-toast'

export default function AdminBookings() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Reject modal state
  const [rejectBookingId, setRejectBookingId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchBookings = async () => {
    try {
      const res = await api.get('/rooms/admin/bookings/')
      const payload = res.data
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.results)
        ? payload.results
        : Array.isArray(payload?.bookings)
        ? payload.bookings
        : []
      setData(list)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  // Direct approve without modal
  const handleApprove = async (bookingId) => {
    try {
      setActionLoading(true)
      await api.post(`/rooms/admin/bookings/${bookingId}/approve/`, {})
      toast.success('Booking approved! Bed auto-assigned and QR generated.')
      fetchBookings()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Approval failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (e) => {
    e.preventDefault()
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason.')
      return
    }
    
    try {
      setActionLoading(true)
      await api.post(`/rooms/admin/bookings/${rejectBookingId}/reject/`, {
        reason: rejectionReason
      })
      toast.success('Booking rejected.')
      setRejectBookingId(null)
      setRejectionReason('')
      fetchBookings()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.detail || 'Rejection failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const list = Array.isArray(data) ? data : []

  const filtered = list.filter((b) => {
    const name = (b.resident_name || '').toLowerCase()
    const email = (b.resident_email || '').toLowerCase()
    const term = searchTerm.toLowerCase()
    return name.includes(term) || email.includes(term)
  })

  const pending = filtered.filter(b => b.status === 'pending')
  const history = filtered.filter(b => b.status !== 'pending')

  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>
        Loading booking requests...
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          gap: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Booking Requests
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Approve or reject resident booking requests.</p>
        </div>
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <Clock size={16} />
          <span>
            Pending: <strong>{pending.length}</strong> · History: <strong>{history.length}</strong>
          </span>
        </div>
      </div>

      {/* Search */}
      <div
        style={{
          marginBottom: '1.5rem',
          position: 'relative',
          maxWidth: 420,
        }}
      >
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Search by resident name or email..."
          className="input"
          style={{ paddingLeft: '2.5rem' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Pending Requests */}
      <Card
        title="Pending Requests"
        description="New booking requests that require your approval."
        headerRight={
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total: <strong>{pending.length}</strong>
          </span>
        }
        style={{ marginBottom: '2rem', overflowX: 'auto' }}
      >
        <table style={{ minWidth: 880, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Resident</th>
              <th>Requested Room</th>
              <th>Move-in Date</th>
              <th>Duration</th>
              <th>Requested On</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No pending booking requests.
                </td>
              </tr>
            ) : (
              pending.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.resident_name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.resident_email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Home size={16} color="var(--brand-light)" />
                      <span style={{ fontWeight: 600 }}>Room {b.room_number || '—'}</span>
                      {(b.room_type || b.preferred_room_type) && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            background: 'rgba(255,255,255,0.06)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: 999,
                            textTransform: 'capitalize',
                          }}
                        >
                          {b.room_type || b.preferred_room_type}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{b.move_in_date}</td>
                  <td>{b.duration_months} mo</td>
                  <td>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        onClick={() => handleApprove(b.id)}
                        disabled={actionLoading}
                        className="btn-primary"
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => setRejectBookingId(b.id)}
                        disabled={actionLoading}
                        className="btn-secondary"
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.85rem',
                          color: 'var(--danger)',
                          borderColor: 'rgba(239,68,68,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* History */}
      <Card
        title="Request History"
        description="All previous booking requests and their outcomes."
        headerRight={
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total: <strong>{history.length}</strong>
          </span>
        }
        style={{ overflowX: 'auto' }}
      >
        <table style={{ minWidth: 880, width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Resident</th>
              <th>Requested Room</th>
              <th>Move-in Date</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No past requests found.
                </td>
              </tr>
            ) : (
              history.map((b) => (
                <tr key={b.id} style={{ opacity: 0.9 }}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{b.resident_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.resident_email}</div>
                  </td>
                  <td>
                    Room {b.room_number || '—'}{' '}
                    <span
                      style={{
                        textTransform: 'capitalize',
                        color: 'var(--text-muted)',
                        fontSize: '0.8rem',
                      }}
                    >
                      ({b.room_type || b.preferred_room_type || 'N/A'})
                    </span>
                  </td>
                  <td>{b.move_in_date}</td>
                  <td>
                    <span
                      style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor:
                          b.status === 'approved'
                            ? 'rgba(16,185,129,0.12)'
                            : b.status === 'rejected'
                            ? 'rgba(239,68,68,0.12)'
                            : 'rgba(234,179,8,0.12)',
                        color:
                          b.status === 'approved'
                            ? 'var(--success)'
                            : b.status === 'rejected'
                            ? 'var(--danger)'
                            : 'var(--warning)',
                      }}
                    >
                      {b.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {b.status === 'rejected' && b.rejection_reason
                      ? `Reason: ${b.rejection_reason}`
                      : b.status === 'approved' && b.qr_code
                      ? 'QR generated'
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {/* Reject Modal */}
      {rejectBookingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Reject Booking</h2>
              <button 
                onClick={() => { setRejectBookingId(null); setRejectionReason(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleReject} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Reason for rejection (sent to resident)</label>
                <textarea 
                  className="input" 
                  rows={4} 
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="E.g., Requested room is currently unavailable for maintenance..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setRejectBookingId(null); setRejectionReason(''); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger)', borderColor: 'var(--danger)' }} disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
