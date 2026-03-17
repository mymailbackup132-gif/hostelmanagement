import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { BedDouble, CreditCard, MessageSquare, QrCode, Bell, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import api from '../../api'

function StatCard({ icon, label, value, color = 'var(--brand-light)', sub }) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ width: 48, height: 48, background: `${color}18`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value ?? '—'}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</div>
        {sub && <div style={{ color, fontSize: '0.75rem', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function ResidentDashboard() {
  const { user } = useAuth()
  const [allocation, setAllocation] = useState(null)
  const [payments, setPayments] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.get('/rooms/allocation/'),
      api.get('/payments/my/'),
      api.get('/rooms/bookings/my/'),
    ]).then(([al, pay, book]) => {
      if (al.status === 'fulfilled') setAllocation(al.value.data)
      if (pay.status === 'fulfilled') setPayments(pay.value.data.results || pay.value.data)
      if (book.status === 'fulfilled') setBookings(book.value.data.results || book.value.data)
      setLoading(false)
    })
  }, [])

  const pendingPayment = payments.find(p => p.status === 'pending' || p.status === 'overdue')
  const latestBooking = bookings[0]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Hello, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's an overview of your stay.</p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <StatCard icon={<BedDouble size={22} />} label="Your Room" value={allocation ? `Room ${allocation.room_number}` : 'Not Allocated'} sub={allocation ? `Floor ${allocation.floor}, Bed ${allocation.bed_number}` : null} />
            <StatCard icon={<QrCode size={22} />} label="Gate QR Status" value={allocation ? (allocation.qr_status === 'active' ? 'Active' : 'Deactivated') : 'N/A'} color={allocation?.qr_status === 'active' ? 'var(--success)' : 'var(--danger)'} />
            <StatCard icon={<CreditCard size={22} />} label="Next Payment" value={pendingPayment ? `₹${pendingPayment.amount}` : 'Up to Date'} color={pendingPayment?.status === 'overdue' ? 'var(--danger)' : 'var(--success)'} sub={pendingPayment ? `Due: ${pendingPayment.due_date}` : null} />
            <StatCard icon={<MessageSquare size={22} />} label="Bookings" value={bookings.length} color="var(--warning)" sub={latestBooking ? latestBooking.status : null} />
          </div>

          {/* Booking status */}
          {latestBooking && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Latest Booking</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Requested Room</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {latestBooking.room_number ? `Room ${latestBooking.room_number}` : ''} 
                    {latestBooking.room_type || latestBooking.preferred_room_type ? ` (${latestBooking.room_type || latestBooking.preferred_room_type})` : ''}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Move-in Date</div>
                  <div style={{ fontWeight: 600 }}>{latestBooking.move_in_date}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Duration</div>
                  <div style={{ fontWeight: 600 }}>{latestBooking.duration_months} Months</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Requested On</div>
                  <div style={{ fontWeight: 600 }}>{new Date(latestBooking.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  {latestBooking.status === 'pending' && <span className="badge badge-warning"><Clock size={11} style={{ marginRight: 4 }} />Pending Approval</span>}
                  {latestBooking.status === 'approved' && <span className="badge badge-success"><CheckCircle size={11} style={{ marginRight: 4 }} />Approved</span>}
                  {latestBooking.status === 'rejected' && <span className="badge badge-danger"><XCircle size={11} style={{ marginRight: 4 }} />Rejected</span>}
                </div>
              </div>
              {latestBooking.rejection_reason && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8, fontSize: '0.85rem', color: '#ef4444' }}>
                  Reason: {latestBooking.rejection_reason}
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {!allocation && <Link to="/resident/rooms" className="btn-primary" style={{ fontSize: '0.875rem' }}>Browse Rooms <ChevronRight size={15} /></Link>}
              <Link to="/resident/payments" className="btn-secondary" style={{ fontSize: '0.875rem' }}>View Payments</Link>
              <Link to="/resident/complaints" className="btn-secondary" style={{ fontSize: '0.875rem' }}>Raise a Complaint</Link>
              {allocation && <Link to="/resident/profile" className="btn-secondary" style={{ fontSize: '0.875rem' }}>Download QR Code</Link>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
