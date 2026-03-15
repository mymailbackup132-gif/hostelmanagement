import { useState, useEffect } from 'react'
import { Check, X, Clock, AlertCircle } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [rooms, setRooms] = useState([]) // Need specific beds to assign

  // Modals state
  const [approvingId, setApprovingId] = useState(null)
  const [selectedBed, setSelectedBed] = useState('')
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => { 
    fetchBookings()
    // Fetch all rooms (with their beds nested because of RoomDetailSerializer vs RoomSerializer)
    // Actually our List API returns RoomSerializer (no beds). Let's fetch the detail of each room we might need, 
    // or we can fetch a specific endpoint. Since this is admin, let's fetch all rooms, then if they hit approve, we fetch /admin/rooms/ to get the beds.
    // Wait, the easiest is to just use the API we built. AdminRoomListView has no beds, AdminRoomDetailView has beds.
  }, [filter])

  const fetchBookings = () => {
    setLoading(true)
    api.get(`/rooms/admin/bookings/?status=${filter === 'all' ? '' : filter}`)
      .then(r => setBookings(r.data.results || r.data))
      .finally(() => setLoading(false))
  }

  // To approve, we need to pick a bed. We fetch rooms, then fetch details for rooms of the requested type.
  const handleOpenApprove = async (booking) => {
    setApprovingId(booking)
    try {
      const { data } = await api.get('/rooms/admin/rooms/')
      // Filter rooms matching the requested type
      const matching = data.results || data
      const ofType = matching.filter(r => r.room_type === booking.preferred_room_type)
      
      // Fetch details to get beds
      const detailedRooms = await Promise.all(
        ofType.map(r => api.get(`/rooms/admin/rooms/${r.id}/`).then(res => res.data))
      )
      setRooms(detailedRooms)
      setSelectedBed('')
    } catch (err) {
      toast.error('Failed to load available rooms')
      setApprovingId(null)
    }
  }

  const submitApprove = async (e) => {
    e.preventDefault()
    if (!selectedBed) return toast.error('Select a specific bed')
    try {
      await api.post(`/rooms/admin/bookings/${approvingId.id}/approve/`, { bed_id: selectedBed })
      toast.success('Booking approved! QR generated and resident notified.')
      setApprovingId(null)
      fetchBookings()
    } catch (err) {
      const errData = err.response?.data
      const errMsg = errData?.detail || (errData && typeof errData === 'object' ? JSON.stringify(errData) : null) || 'Approval failed. Check server logs.'
      toast.error(errMsg)
      console.error('Approve error:', err.response?.status, errData)
    }
  }

  const submitReject = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/rooms/admin/bookings/${rejectingId.id}/reject/`, { reason: rejectReason })
      toast.success('Booking rejected. Resident emailed.')
      setRejectingId(null)
      setRejectReason('')
      fetchBookings()
    } catch (err) {
      const errData = err.response?.data
      const errMsg = errData?.detail || 'Rejection failed. Check server logs.'
      toast.error(errMsg)
      console.error('Reject error:', err.response?.status, errData)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Booking Requests</h1>
          <p style={{ color: 'var(--text-muted)' }}>Review and allocate beds to requested residents.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '0.25rem', borderRadius: 10 }}>
          {['pending', 'approved', 'rejected', 'cancelled', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? 'var(--brand)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              border: 'none', padding: '0.4rem 0.8rem', borderRadius: 6,
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize'
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading requests...</div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Resident</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Requested Type</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Move-in Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Duration</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{b.resident_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.resident_email}</div>
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize', fontWeight: 600 }}>{b.preferred_room_type}</td>
                  <td style={{ padding: '1rem' }}>{b.move_in_date}</td>
                  <td style={{ padding: '1rem' }}>{b.duration_months} mo</td>
                  <td style={{ padding: '1rem' }}>
                    {b.status === 'pending' && <span className="badge badge-warning">Pending</span>}
                    {b.status === 'approved' && <span className="badge badge-success">Approved</span>}
                    {b.status === 'rejected' && <span className="badge badge-danger">Rejected</span>}
                    {b.status === 'cancelled' && <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>Cancelled</span>}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {b.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setRejectingId(b)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }} title="Reject"><X size={14} /></button>
                        <button onClick={() => handleOpenApprove(b)} className="btn-primary" style={{ padding: '0.4rem 0.6rem', background: 'var(--success)' }} title="Approve & Allocate"><Check size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings found in this state.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve Modal */}
      {approvingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: '2rem', background: 'var(--surface)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Approve & Assign Bed</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Resident requested a <strong style={{color:'var(--text)', textTransform:'capitalize'}}>{approvingId.preferred_room_type}</strong> room.</p>
            
            <form onSubmit={submitApprove}>
              <label>Select an Available Bed</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                {rooms.map(room => {
                  const availableBeds = room.beds.filter(b => !b.is_occupied)
                  if (availableBeds.length === 0) return null
                  return (
                    <optgroup key={room.id} label={`Room ${room.room_number} (Floor ${room.floor})`} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Room {room.room_number} • ₹{room.rent_amount}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {availableBeds.map(bed => (
                          <label key={bed.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: `1px solid ${selectedBed === bed.id ? 'var(--brand)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', background: selectedBed === bed.id ? 'rgba(99,102,241,0.1)' : 'transparent' }}>
                            <input type="radio" name="bed" value={bed.id} checked={selectedBed === bed.id} onChange={(e) => setSelectedBed(e.target.value)} style={{ accentColor: 'var(--brand)' }} />
                            <span style={{ fontSize: '0.9rem' }}>Bed #{bed.bed_number}</span>
                          </label>
                        ))}
                      </div>
                    </optgroup>
                  )
                })}
                {rooms.every(r => r.beds.filter(b => !b.is_occupied).length === 0) && (
                  <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--warning)', padding: '1rem', background: 'rgba(245,158,11,0.1)', borderRadius: 8, fontSize: '0.85rem' }}>
                    <AlertCircle size={16} /> No available beds found for type '{approvingId.preferred_room_type}'.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setApprovingId(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={!selectedBed}>Confirm Allocation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem', background: 'var(--surface)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--danger)' }}>Reject Request</h2>
            <form onSubmit={submitReject}>
              <label>Reason for rejection (sent to resident)</label>
              <textarea 
                className="input" required rows={3} style={{ resize: 'vertical', marginTop: '0.5rem', marginBottom: '1.5rem' }}
                placeholder="e.g. No vacancy, invalid ID, etc."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setRejectingId(null); setRejectReason('') }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, background: 'var(--danger)' }}>Reject Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
