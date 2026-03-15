import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, Upload, ArrowRight } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const STEPS = ['Personal Info', 'Contact & ID', 'Password']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    parent_contact_name: '', parent_contact_phone: '',
    residential_address: '',
    profile_photo: null, id_proof: null,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step < 2) { setStep(s => s + 1); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      await api.post('/auth/register/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      const errData = err.response?.data
      const msg = errData ? Object.values(errData).flat().join(', ') : 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const FileInput = ({ label, field, accept = 'image/*' }) => (
    <div>
      <label>{label}</label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px dashed var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        <Upload size={16} />
        {form[field] ? form[field].name : `Upload ${label}`}
        <input type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => set(field, e.target.files[0])} />
      </label>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div className="card" style={{ width: '100%', maxWidth: 500, padding: '2.5rem', position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
            <Building2 size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join HostelMS — {STEPS[step]}</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--brand)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {step === 0 && <>
            <div>
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-name" className="input" style={{ paddingLeft: '2.75rem' }} type="text" placeholder="Enter your Name" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} required />
              </div>
            </div>
            <div>
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-email" className="input" style={{ paddingLeft: '2.75rem' }} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} required />
              </div>
            </div>
            <div>
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-phone" className="input" style={{ paddingLeft: '2.75rem' }} type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set('phone', e.target.value)} required />
              </div>
            </div>
            <div>
              <label>Residential Address</label>
              <textarea id="reg-address" className="input" placeholder="Your current home address" rows={3} style={{ resize: 'vertical' }} value={form.residential_address} onChange={(e) => set('residential_address', e.target.value)} />
            </div>
          </>}

          {step === 1 && <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><label>Emergency Contact Name</label><input className="input" placeholder="Name" value={form.emergency_contact_name} onChange={(e) => set('emergency_contact_name', e.target.value)} required /></div>
              <div><label>Emergency Contact Phone</label><input className="input" placeholder="Phone" value={form.emergency_contact_phone} onChange={(e) => set('emergency_contact_phone', e.target.value)} required /></div>
              <div><label>Parent Name</label><input className="input" placeholder="Name" value={form.parent_contact_name} onChange={(e) => set('parent_contact_name', e.target.value)} required /></div>
              <div><label>Parent Phone</label><input className="input" placeholder="Phone" value={form.parent_contact_phone} onChange={(e) => set('parent_contact_phone', e.target.value)} required /></div>
            </div>
            <FileInput label="Profile Photo" field="profile_photo" />
            <FileInput label="Government ID Proof" field="id_proof" />
          </>}

          {step === 2 && <>
            <div>
              <label>Create Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input id="reg-password" className="input" style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={8} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Next steps after registration:</strong><br />
              1. You&apos;ll be prompted to scan a QR code to set up 2FA<br />
              2. Use Google Authenticator or Authy<br />
              3. Browse rooms and submit a booking request
            </div>
          </>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {step > 0 && (
              <button type="button" className="btn-secondary" onClick={() => setStep(s => s - 1)} style={{ flex: 1 }}>Back</button>
            )}
            <button id="reg-next" type="submit" className="btn-primary" disabled={loading} style={{ flex: 2 }}>
              {step < 2 ? <><span>Next</span><ArrowRight size={16} /></> : loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--brand-light)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
