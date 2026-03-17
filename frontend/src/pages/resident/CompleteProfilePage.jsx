import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Phone, MapPin, Upload, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/
const MAX_FILE_BYTES = 1 * 1024 * 1024 // 1 MB

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{msg}</p>
}

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [form, setForm] = useState({
    full_name: '', phone: '', residential_address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    parent_contact_name: '', parent_contact_phone: '',
  })
  const [files, setFiles] = useState({ profile_photo: null, id_proof: null })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    api.get('/auth/profile/')
      .then(res => {
        const p = res.data
        if (p.profile_complete) {
          navigate('/resident', { replace: true })
          return
        }
        setForm({
          full_name: p.full_name || '',
          phone: p.phone || '',
          residential_address: p.residential_address || '',
          emergency_contact_name: p.emergency_contact_name || '',
          emergency_contact_phone: p.emergency_contact_phone || '',
          parent_contact_name: p.parent_contact_name || '',
          parent_contact_phone: p.parent_contact_phone || '',
        })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setProfileLoading(false))
  }, [navigate])

  const setField = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const setFile = (key, file) => {
    if (file && file.size > MAX_FILE_BYTES) {
      setErrors(e => ({ ...e, [key]: 'File must be 1 MB or less.' }))
      return
    }
    setFiles(f => ({ ...f, [key]: file }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e = {}
    const name = form.full_name.trim()
    if (!name) e.full_name = 'Full name is required.'
    else if (name.length > 30) e.full_name = 'Full name must be 30 characters or fewer.'

    if (!form.phone.trim()) e.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit mobile number.'

    if (!form.residential_address.trim()) e.residential_address = 'Residential address is required.'
    else if (form.residential_address.trim().length < 10) e.residential_address = 'Please enter a complete address.'

    if (!files.profile_photo) e.profile_photo = 'Profile photo is required to complete your profile.'
    if (!files.id_proof) e.id_proof = 'Government ID proof is required to complete your profile.'

    if (form.emergency_contact_phone.trim() && !PHONE_RE.test(form.emergency_contact_phone.trim()))
      e.emergency_contact_phone = 'Enter a valid 10-digit mobile number.'
    if (form.parent_contact_phone.trim() && !PHONE_RE.test(form.parent_contact_phone.trim()))
      e.parent_contact_phone = 'Enter a valid 10-digit mobile number.'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (files.profile_photo) fd.append('profile_photo', files.profile_photo)
      if (files.id_proof) fd.append('id_proof', files.id_proof)
      await api.post('/auth/complete-profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Profile completed! You can now book a room.', { position: 'top-center' })
      navigate('/resident/rooms')
    } catch (err) {
      const errData = err.response?.data
      if (errData && typeof errData === 'object') {
        const mapped = {}
        Object.entries(errData).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
        toast.error('Please fix the errors below.', { position: 'top-center' })
      } else {
        toast.error('Failed to save profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const FileUpload = ({ label, field, accept = 'image/*' }) => (
    <div>
      <label>{label} <span style={{ color: '#f87171', fontSize: '0.78rem' }}>* required</span></label>
      <label style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: files[field] ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px dashed ${errors[field] ? '#f87171' : files[field] ? '#22c55e' : 'var(--border)'}`,
        borderRadius: 10, cursor: 'pointer',
        color: files[field] ? '#22c55e' : 'var(--text-muted)', fontSize: '0.88rem',
        transition: 'all 0.2s',
      }}>
        {files[field] ? <CheckCircle size={16} /> : <Upload size={16} />}
        <span style={{ flex: 1 }}>
          {files[field] ? files[field].name : `Upload ${label}`}
        </span>
        {files[field] && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {(files[field].size / 1024).toFixed(0)} KB
          </span>
        )}
        <input type="file" accept={accept} style={{ display: 'none' }}
          onChange={e => setFile(field, e.target.files[0])} />
      </label>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Max size: 1 MB</p>
      <FieldError msg={errors[field]} />
    </div>
  )

  if (profileLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Banner */}
      <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <AlertCircle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '0.25rem' }}>Profile Incomplete</div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
            You need to upload a <strong>profile photo</strong> and <strong>government ID proof</strong> before you can book a room. Please complete your profile below.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem' }}>Complete Your Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Fill in the details below. Fields marked <span style={{ color: '#f87171' }}>*</span> are required.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label>Full Name <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(max 30)</span></label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: '2.5rem', borderColor: errors.full_name ? '#f87171' : undefined }}
                  type="text" placeholder="Your full name" maxLength={30}
                  value={form.full_name} onChange={e => setField('full_name', e.target.value)} />
              </div>
              <FieldError msg={errors.full_name} />
            </div>

            <div>
              <label>Phone <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(10 digits)</span></label>
              <div style={{ position: 'relative' }}>
                <Phone size={14} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: '2.5rem', borderColor: errors.phone ? '#f87171' : undefined }}
                  type="tel" placeholder="9876543210" maxLength={13}
                  value={form.phone} onChange={e => setField('phone', e.target.value.replace(/[^\d+\s-]/g, ''))} />
              </div>
              <FieldError msg={errors.phone} />
            </div>
          </div>

          <div>
            <label>Residential Address <span style={{ color: '#f87171', fontSize: '0.78rem' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <MapPin size={14} style={{ position: 'absolute', left: '0.85rem', top: '0.85rem', color: 'var(--text-muted)' }} />
              <textarea className="input" rows={3} placeholder="Your home address"
                style={{ paddingLeft: '2.5rem', resize: 'vertical', borderColor: errors.residential_address ? '#f87171' : undefined }}
                value={form.residential_address} onChange={e => setField('residential_address', e.target.value)} />
            </div>
            <FieldError msg={errors.residential_address} />
          </div>

          {/* Documents */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Documents (required to book)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <FileUpload label="Profile Photo" field="profile_photo" accept="image/*" />
              <FileUpload label="Government ID Proof" field="id_proof" accept="image/*,.pdf" />
            </div>
          </div>

          {/* Parent Contact */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Parent Contact</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Name <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(max 30)</span></label>
                <input className="input" placeholder="Parent name" maxLength={30}
                  value={form.parent_contact_name} onChange={e => setField('parent_contact_name', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Phone</label>
                <input className="input" placeholder="9876543210" maxLength={13}
                  style={{ borderColor: errors.parent_contact_phone ? '#f87171' : undefined }}
                  value={form.parent_contact_phone} onChange={e => setField('parent_contact_phone', e.target.value.replace(/[^\d+\s-]/g, ''))} />
                <FieldError msg={errors.parent_contact_phone} />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>Emergency Contact</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Name <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(max 30)</span></label>
                <input className="input" placeholder="Emergency contact name" maxLength={30}
                  value={form.emergency_contact_name} onChange={e => setField('emergency_contact_name', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem' }}>Phone</label>
                <input className="input" placeholder="9876543210" maxLength={13}
                  style={{ borderColor: errors.emergency_contact_phone ? '#f87171' : undefined }}
                  value={form.emergency_contact_phone} onChange={e => setField('emergency_contact_phone', e.target.value.replace(/[^\d+\s-]/g, ''))} />
                <FieldError msg={errors.emergency_contact_phone} />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Saving Profile...' : <><span>Save & Complete Profile</span><ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  )
}
