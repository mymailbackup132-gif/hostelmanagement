import { useState, useEffect } from 'react'
import { QrCode, Download, Building2, BedDouble, Calendar, ShieldCheck, ShieldOff, User } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function ResidentProfile() {
  const [profile, setProfile] = useState(null)
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, allocRes] = await Promise.allSettled([
        api.get('/auth/profile/'),
        api.get('/rooms/allocation/')
      ])
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data)
      if (allocRes.status === 'fulfilled') setAllocation(allocRes.value.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    if (!allocation?.qr_code) return toast.error('No QR code available')
    const a = document.createElement('a')
    a.href = allocation.qr_code
    a.download = `hostel-qr-${allocation.qr_token}.png`
    a.click()
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading profile...</div>

  const qrActive = allocation?.qr_status === 'active'

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Profile & QR Code</h1>
        <p style={{ color: 'var(--text-muted)' }}>Your identity card and gate access QR code.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

        {/* Profile Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
            {profile?.profile_photo ? (
              <img
                src={profile.profile_photo}
                alt="Profile"
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--brand)' }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <User size={32} color="#fff" />
              </div>
            )}
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{profile?.full_name || '—'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profile?.email}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                marginTop: '0.4rem', background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100,
                padding: '0.2rem 0.7rem', fontSize: '0.75rem', color: 'var(--brand-light)', fontWeight: 600
              }}>
                Resident
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phone</span>
              <span style={{ fontWeight: 600 }}>{profile?.phone || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Emergency Contact</span>
              <span style={{ fontWeight: 600 }}>{profile?.emergency_contact_name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Address</span>
              <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{profile?.residential_address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Room & QR Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {allocation ? (
            <>
              {/* Room Info */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Current Allocation</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { icon: Building2, label: 'Room', val: allocation.room_number },
                    { icon: BedDouble, label: 'Bed #', val: allocation.bed_number },
                    { icon: Building2, label: 'Floor', val: allocation.floor },
                    { icon: Calendar, label: 'Move-in', val: allocation.start_date },
                  ].map(({ icon: Icon, label, val }) => (
                    <div key={label} style={{
                      background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                      padding: '0.75rem 1rem', border: '1px solid var(--border)'
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Status Banner */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1.5rem',
                background: qrActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${qrActive ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}>
                {qrActive
                  ? <ShieldCheck size={18} color="var(--success)" />
                  : <ShieldOff size={18} color="var(--danger)" />
                }
                <span style={{ fontWeight: 600, color: qrActive ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
                  {qrActive ? 'Gate Access: Active' : 'Gate Access: Deactivated'}
                </span>
              </div>

              {/* QR Code */}
              {allocation.qr_code ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block', padding: '1rem',
                    background: '#fff', borderRadius: 16, marginBottom: '1rem',
                    boxShadow: qrActive ? '0 0 30px rgba(99,102,241,0.25)' : 'none',
                    opacity: qrActive ? 1 : 0.4,
                    filter: qrActive ? '' : 'grayscale(1)',
                  }}>
                    <img src={allocation.qr_code} alt="Gate QR Code" style={{ width: 180, height: 180 }} />
                  </div>
                  <div>
                    <button className="btn-primary" onClick={downloadQR} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Download size={16} /> Download QR
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                    Show this QR at the gate for entry
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  <QrCode size={48} opacity={0.3} style={{ margin: '0 auto 1rem' }} />
                  <p>QR code is being generated...</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              <BedDouble size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>No Room Allocated Yet</h3>
              <p style={{ fontSize: '0.9rem' }}>Book a room from the Rooms page and wait for admin approval to receive your QR code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
