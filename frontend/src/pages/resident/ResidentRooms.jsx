import { useState, useEffect } from 'react'
import { CheckCircle, Clock, XCircle, ChevronRight, BedDouble, Info } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function ResidentRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingForm, setBookingForm] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Status checks to prevent multiple bookings
  const [existingBooking, setExistingBooking] = useState(null)
  const [hasAllocation, setHasAllocation] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rmRes, bkRes, alRes] = await Promise.allSettled([
        api.get('/rooms/'),
        api.get('/rooms/bookings/my/'),
        api.get('/rooms/allocation/')
      ])

      if (rmRes.status === 'fulfilled') setRooms(rmRes.value.data.results || rmRes.value.data)
      
      // Always reset first to avoid stale state persisting across re-fetches
      setExistingBooking(null)
      setHasAllocation(false)

      if (bkRes.status === 'fulfilled') {
        const bks = bkRes.value.data.results || bkRes.value.data
        const active = bks.find(b => b.status === 'pending' || b.status === 'approved')
        setExistingBooking(active || null)
      }

      if (alRes.status === 'fulfilled' && alRes.value.data) {
        setHasAllocation(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleBook = (room) => {
    if (hasAllocation) return toast.error('You already have an active room allocation.')
    if (existingBooking) return toast.error('You already have an active booking request.')
    // Support both raw room objects (room_type) and aggregated room-type objects (type)
    const roomType = room.room_type || room.type
    setBookingForm({ preferred_room_type: roomType, move_in_date: '', duration_months: 1 })
  }

  const submitBooking = async (e) => {
    e.preventDefault()
    setSubmitLoading(true)
    try {
      const payload = {
        ...bookingForm,
        duration_months: parseInt(bookingForm.duration_months, 10)
      }
      await api.post('/rooms/bookings/', payload)
      toast.success('Booking request submitted! Waiting for admin approval.')
      setBookingForm(null)
      fetchData() // refresh to show the pending booking
    } catch (err) {
      // Surface the actual backend validation error
      const errData = err.response?.data
      let errMsg = 'Failed to submit booking.'
      if (errData) {
        if (typeof errData === 'string') errMsg = errData
        else if (errData.detail) errMsg = errData.detail
        else {
          // DRF field errors: { field: ['msg'] }
          const firstKey = Object.keys(errData)[0]
          errMsg = `${firstKey}: ${Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey]}`
        }
      }
      toast.error(errMsg)
      console.error('Booking error:', err.response?.status, errData)
    } finally {
      setSubmitLoading(false)
    }
  }

  const cancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking request?')) return
    try {
      await api.post(`/rooms/bookings/${id}/cancel/`)
      toast.success('Booking cancelled.')
      setExistingBooking(null)
      fetchData()
    } catch (err) {
      toast.error('Failed to cancel')
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading rooms...</div>

  // Group rooms by type for aggregated display to resident
  const roomTypes = {}
  rooms.forEach(r => {
    if (!roomTypes[r.room_type]) {
      roomTypes[r.room_type] = {
        type: r.room_type,
        rent: r.rent_amount,
        totalBedsStr: r.total_beds,
        available: 0,
        photos: r.photos_list || []
      }
    }
    roomTypes[r.room_type].available += r.available_beds
  })

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Browse Rooms</h1>
        <p style={{ color: 'var(--text-muted)' }}>Find and request your ideal accommodation.</p>
      </div>

      {/* Show active booking state if any */}
      {existingBooking && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="var(--warning)" /> Pending Booking Request
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                You requested a <strong>{existingBooking.preferred_room_type}</strong> room starting on {existingBooking.move_in_date}. 
                Waiting for admin approval.
              </p>
            </div>
            {existingBooking.status === 'pending' && (
              <button 
                onClick={() => cancelBooking(existingBooking.id)}
                className="btn-secondary" 
                style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
              >
                Cancel Request
              </button>
            )}
          </div>
        </div>
      )}

      {hasAllocation && !existingBooking && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--success)', display: 'flex', itemsCenter: 'center', gap: '1rem' }}>
          <CheckCircle size={24} color="var(--success)" />
          <div>
            <div style={{ fontWeight: 600 }}>Room Allocated</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>You already have an active room allocation. </div>
          </div>
        </div>
      )}

      {/* Room Types Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {Object.values(roomTypes).map(rt => {
          const isAvailable = rt.available > 0
          return (
            <div key={rt.type} className="card" style={{ overflow: 'hidden', opacity: isAvailable ? 1 : 0.7 }}>
              {rt.photos.length > 0 ? (
                <img src={rt.photos[0].image} alt={rt.type} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: 160, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <BedDouble size={48} opacity={0.2} />
                </div>
              )}
              
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', textTransform: 'capitalize' }}>{rt.type} Room</div>
                    <div style={{ color: isAvailable ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>
                      {isAvailable ? `${rt.available} beds available` : 'Fully Occupied'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-light)' }}>₹{rt.rent}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/month</div>
                  </div>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={14} color="var(--brand-light)"/> Geyser attached</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={14} color="var(--brand-light)"/> Private bathroom</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={14} color="var(--brand-light)"/> Wi-Fi inclusive</li>
                </ul>

                <button 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '0.7rem' }}
                  disabled={!isAvailable || existingBooking || hasAllocation}
                  onClick={() => handleBook(rt)}
                >
                  {!isAvailable ? 'Not Available' : existingBooking ? 'Request Pending' : hasAllocation ? 'Already Allocated' : 'Request Bed'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Booking Modal */}
      {bookingForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Book Room</h2>
              <button onClick={() => setBookingForm(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={20} /></button>
            </div>

            <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <Info size={18} color="var(--brand-light)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                You are requesting a <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{bookingForm.preferred_room_type}</strong> room. The admin will assign you a specific room and bed number upon approval.
              </div>
            </div>

            <form onSubmit={submitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Expected Move-in Date</label>
                <input 
                  type="date" className="input" required
                  min={new Date().toISOString().split('T')[0]} // restrict past dates
                  value={bookingForm.move_in_date}
                  onChange={e => setBookingForm({ ...bookingForm, move_in_date: e.target.value })}
                />
              </div>
              
              <div>
                <label>Duration (Months)</label>
                <input 
                  type="number" className="input" required min={1} max={12}
                  value={bookingForm.duration_months}
                  onChange={e => setBookingForm({ ...bookingForm, duration_months: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setBookingForm(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitLoading}>
                  {submitLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
