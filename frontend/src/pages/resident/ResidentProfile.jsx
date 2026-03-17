import { useState, useEffect } from 'react'
import { QrCode, Download, Building2, BedDouble, Calendar, ShieldCheck, ShieldOff, User, Phone, MapPin, AlertCircle, Lock, Eye, EyeOff, X, Copy, Edit, Upload } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

const PHONE_RE = /^\+?[\d\s\-]{7,20}$/

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.25rem' }}>{msg}</p>
}

function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const setField = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.current_password) e.current_password = 'Current password is required.'
    if (!form.new_password) e.new_password = 'New password is required.'
    else if (form.new_password.length < 8) e.new_password = 'Password must be at least 8 characters.'
    else if (!/[A-Z]/.test(form.new_password)) e.new_password = 'Must contain at least one uppercase letter.'
    else if (!/[0-9]/.test(form.new_password)) e.new_password = 'Must contain at least one number.'
    if (!form.confirm_password) e.confirm_password = 'Please confirm the new password.'
    else if (form.new_password !== form.confirm_password) e.confirm_password = 'Passwords do not match.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await api.post('/auth/change-password/', {
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast.success('Password changed successfully')
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Current password is incorrect.') {
        setErrors(e => ({ ...e, current_password: detail }))
      } else {
        toast.error(detail || 'Failed to change password')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '0.65rem 2.5rem 0.65rem 0.85rem',
    borderRadius: 8, border: '1px solid var(--border)',
    background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem',
    boxSizing: 'border-box',
  }

  const FIELD_KEYS = { current: 'current_password', new: 'new_password', confirm: 'confirm_password' }

  const Field = ({ label, field }) => {
    const key = FIELD_KEYS[field]
    return (
      <div style={{ marginBottom: '0.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 500 }}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            type={show[field] ? 'text' : 'password'}
            value={form[key]}
            onChange={e => setField(key, e.target.value)}
            style={{ ...inputStyle, borderColor: errors[key] ? '#f87171' : undefined }}
          />
          <button
            type="button"
            onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            {show[field] ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <FieldError msg={errors[key]} />
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <Lock size={20} color="var(--brand)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Change Password</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Current Password" field="current" />
          <Field label="New Password" field="new" />
          <Field label="Confirm New Password" field="confirm" />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditProfileModal({ profile, onClose, onUpdate }) {
  const [form, setFormState] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    residential_address: profile?.residential_address || '',
    emergency_contact_name: profile?.emergency_contact_name || '',
    emergency_contact_phone: profile?.emergency_contact_phone || '',
    parent_contact_name: profile?.parent_contact_name || '',
    parent_contact_phone: profile?.parent_contact_phone || '',
  })
  const [files, setFiles] = useState({ profile_photo: null, id_proof: null })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const setField = (field, val) => {
    setFormState(f => ({ ...f, [field]: val }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Full name is required.'
    else if (form.full_name.trim().length < 2) e.full_name = 'Full name must be at least 2 characters.'
    else if (!/^[a-zA-Z\s'\-]+$/.test(form.full_name.trim())) e.full_name = 'Name may only contain letters, spaces, hyphens, and apostrophes.'

    if (!form.phone.trim()) e.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid phone number.'

    if (form.emergency_contact_phone.trim() && !PHONE_RE.test(form.emergency_contact_phone.trim()))
      e.emergency_contact_phone = 'Enter a valid phone number.'
    if (form.parent_contact_phone.trim() && !PHONE_RE.test(form.parent_contact_phone.trim()))
      e.parent_contact_phone = 'Enter a valid phone number.'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const formData = new FormData()
      Object.keys(form).forEach(key => {
        formData.append(key, form[key])
      })
      if (files.profile_photo) formData.append('profile_photo', files.profile_photo)
      if (files.id_proof) formData.append('id_proof', files.id_proof)

      await api.patch('/auth/profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('Profile updated successfully')
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const Input = ({ label, field, type = 'text', rows }) => (
    <div style={{ marginBottom: '0.75rem' }}>
      <label>{label}</label>
      {rows ? (
        <textarea
          className="input"
          rows={rows}
          value={form[field]}
          onChange={e => setField(field, e.target.value)}
          style={{ minHeight: 80, resize: 'vertical', borderColor: errors[field] ? '#f87171' : undefined }}
        />
      ) : (
        <input
          type={type}
          className="input"
          value={form[field]}
          onChange={e => setField(field, e.target.value)}
          style={{ borderColor: errors[field] ? '#f87171' : undefined }}
        />
      )}
      <FieldError msg={errors[field]} />
    </div>
  )

  const FileInput = ({ label, field, icon: Icon }) => (
    <div style={{ marginBottom: '1rem' }}>
      <label>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="file"
          id={field}
          accept="image/*"
          onChange={e => setFiles(f => ({ ...f, [field]: e.target.files[0] }))}
          style={{ display: 'none' }}
        />
        <label htmlFor={field} style={{ 
          display: 'flex', alignItems: 'center', gap: '0.75rem', 
          padding: '0.75rem 1rem', background: 'var(--surface-3)', 
          border: '1px dashed var(--border)', borderRadius: 10, 
          cursor: 'pointer', margin: 0, color: files[field] ? 'var(--brand-light)' : 'var(--text-muted)'
        }}>
          <Icon size={18} />
          <span style={{ fontSize: '0.9rem' }}>{files[field] ? files[field].name : `Choose new ${label.toLowerCase()}...`}</span>
          <Upload size={16} style={{ marginLeft: 'auto' }} />
        </label>
      </div>
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: 650, maxHeight: '90vh', overflowY: 'auto', position: 'relative', padding: '2rem' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          <Edit size={24} color="var(--brand)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Edit Profile Details</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Basic Info</div>
              <Input label="Full Name" field="full_name" />
              <Input label="Phone Number" field="phone" />
              <Input label="Residential Address" field="residential_address" rows={3} />
              
              <div style={{ fontSize: '0.7rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.5rem 0 1.25rem' }}>Documents</div>
              <FileInput label="Profile Photo" field="profile_photo" icon={User} />
              <FileInput label="ID Proof" field="id_proof" icon={MapPin} />
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Emergency Contact</div>
              <Input label="Name" field="emergency_contact_name" />
              <Input label="Phone" field="emergency_contact_phone" />

              <div style={{ fontSize: '0.7rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.5rem 0 1.25rem' }}>Parent Contact</div>
              <Input label="Name" field="parent_contact_name" />
              <Input label="Phone" field="parent_contact_phone" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ResidentProfile() {
  const [profile, setProfile] = useState(null)
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => { fetchData() }, [])

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

  const InfoRow = ({ label, value }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flexShrink: 0, marginRight: '1rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '0.9rem', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  )

  return (
    <div>
      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {showEditModal && <EditProfileModal profile={profile} onClose={() => setShowEditModal(false)} onUpdate={fetchData} />}

      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Profile & QR Code</h1>
          <p style={{ color: 'var(--text-muted)' }}>Your identity card and gate access QR code.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowEditModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Edit size={15} /> Edit Profile
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowPasswordModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Lock size={15} /> Change Password
          </button>
        </div>
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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

          {/* Personal Details */}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={12} /> Personal Details
          </div>
          <InfoRow label="Phone" value={profile?.phone} />
          <InfoRow label="Address" value={profile?.residential_address} />
          <InfoRow label="Member Since" value={profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null} />

          {/* Emergency Contact */}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.25rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertCircle size={12} /> Emergency Contact
          </div>
          <InfoRow label="Name" value={profile?.emergency_contact_name} />
          <InfoRow label="Phone" value={profile?.emergency_contact_phone} />

          {/* Parent Contact */}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.25rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Phone size={12} /> Parent Contact
          </div>
          <InfoRow label="Name" value={profile?.parent_contact_name} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.65rem 0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Phone</span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{profile?.parent_contact_phone || '—'}</span>
          </div>

          {/* ID Proof */}
          {profile?.id_proof && (
            <>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1.25rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={12} /> ID Proof
              </div>
              <a href={profile.id_proof} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                View ID Document
              </a>
            </>
          )}
        </div>

        {/* Room & QR Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {allocation ? (
            <>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Current Allocation</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { icon: Building2, label: 'Room', val: allocation.room_number },
                  { icon: BedDouble, label: 'Bed #', val: allocation.bed_number },
                  { icon: Building2, label: 'Floor', val: allocation.floor },
                  { icon: Calendar, label: 'Move-in', val: allocation.start_date },
                ].map(({ label, val }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: 10,
                    padding: '0.75rem 1rem', border: '1px solid var(--border)'
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{val}</div>
                  </div>
                ))}
              </div>

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
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Manual Access Token</div>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.75rem', borderRadius: 8,
                        border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.85rem'
                      }}>
                        <span style={{ color: qrActive ? 'var(--text)' : 'var(--text-muted)' }}>{allocation.qr_token}</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(allocation.qr_token)
                            toast.success('Token copied to clipboard')
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--brand-light)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'transform 0.1s' }}
                          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                          title="Copy Token"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                      <button className="btn-primary" onClick={downloadQR} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <Download size={16} /> Download QR
                      </button>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                      Show this QR or provide the manual token at the gate for entry
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
