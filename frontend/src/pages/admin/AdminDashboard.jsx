import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { Users, BedDouble, FileText, IndianRupee, Bell, AlertTriangle, BarChart3 } from 'lucide-react'
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
    api.get('/auth/admin/stats/')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
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
        <StatCard icon={<BedDouble size={22} />} label="Available Beds" value={stats.available_beds} color="var(--success)" />
        <StatCard icon={<Bell size={22} />} label="Pending Bookings" value={stats.pending_bookings} color={stats.pending_bookings > 0 ? 'var(--warning)' : 'var(--text-muted)'} />
        <StatCard icon={<AlertTriangle size={22} />} label="Unresolved Complaints" value={stats.unresolved_complaints} color={stats.unresolved_complaints > 0 ? 'var(--danger)' : 'var(--text-muted)'} />
        <StatCard icon={<IndianRupee size={22} />} label="Revenue (Monthly)" value={`₹${stats.revenue?.toLocaleString()}`} color="var(--brand)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Link to="/admin/bookings" className="btn-secondary" style={{ justifyContent: 'flex-start' }}><FileText size={16} /> Review Booking Requests</Link>
            <Link to="/admin/payments" className="btn-secondary" style={{ justifyContent: 'flex-start' }}><IndianRupee size={16} /> Verify Rent Payments</Link>
            <Link to="/admin/rooms" className="btn-secondary" style={{ justifyContent: 'flex-start' }}><BedDouble size={16} /> Add / Manage Rooms</Link>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.02))', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--brand-light)' }}>Analytics & Reports</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              View detailed room occupancy, monthly revenue trends, and complaint statistics.
            </p>
          </div>
          <Link to="/admin/analytics" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             View Full Analytics <BarChart3 size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
