import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { Users, BedDouble, FileText, IndianRupee, Bell, AlertTriangle } from 'lucide-react'
import api from '../../api'

function StatCard({ icon, label, value, color = 'var(--brand-light)' }) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ width: 48, height: 48, background: `${color}18`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value ?? '—'}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ residents: 0, pendingBookings: 0, availableBeds: 0, pendingComplaints: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In Phase 6 we'll build a real /admin/dashboard/ API.
    // For now, let's fetch individual counts if possible, or just mock skeleton.
    Promise.allSettled([
      api.get('/accounts/admin/users/'),
      api.get('/rooms/admin/bookings/?status=pending'),
      api.get('/rooms/admin/rooms/'),
    ]).then(([usr, bk, rm]) => {
      let rCount = 0, bkCount = 0, bedCount = 0
      if (usr.status === 'fulfilled') rCount = (usr.value.data.results || usr.value.data).filter(u => u.role === 'resident').length
      if (bk.status === 'fulfilled') bkCount = (bk.value.data.results || bk.value.data).length
      if (rm.status === 'fulfilled') {
        const rooms = rm.value.data.results || rm.value.data
        rooms.forEach(r => { bedCount += r.available_beds })
      }
      setStats({ residents: rCount, pendingBookings: bkCount, availableBeds: bedCount, pendingComplaints: 0 })
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Here's what's happening in your hostel today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <StatCard icon={<Users size={22} />} label="Total Residents" value={stats.residents} />
        <StatCard icon={<BedDouble size={22} />} label="Available Beds" value={stats.availableBeds} color="var(--success)" />
        <StatCard icon={<Bell size={22} />} label="Pending Bookings" value={stats.pendingBookings} color={stats.pendingBookings > 0 ? 'var(--warning)' : 'var(--text-muted)'} />
        <StatCard icon={<AlertTriangle size={22} />} label="Unresolved Complaints" value="—" color="var(--danger)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/admin/bookings" className="btn-secondary" style={{ justifyContent: 'flex-start' }}><FileText size={16} /> Review Booking Requests</Link>
            <Link to="/admin/payments" className="btn-secondary" style={{ justifyContent: 'flex-start' }}><IndianRupee size={16} /> Verify Rent Payments</Link>
            <Link to="/admin/rooms" className="btn-secondary" style={{ justifyContent: 'flex-start' }}><BedDouble size={16} /> Add / Manage Rooms</Link>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02))' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--brand-light)' }}>Phase 6 Preview</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Full analytics, occupancy rate charts, and revenue line graphs will be built out in Phase 6. For now, monitor core operational metrics above.
          </p>
        </div>
      </div>
    </div>
  )
}
