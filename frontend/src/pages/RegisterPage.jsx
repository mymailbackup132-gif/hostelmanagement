import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const STEPS = ['Verify Email', 'Personal Info', 'Contact Details', 'Password']

// Exactly 10 digits with optional +91 prefix
const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/

// Known disposable/temp email domains
const TEMP_EMAIL_DOMAINS = [
  'mailinator.com','guerrillamail.com','tempmail.com','throwam.com','sharklasers.com',
  'guerrillamail.info','guerrillamail.biz','guerrillamail.de','guerrillamail.net','guerrillamail.org',
  'spam4.me','yopmail.com','yopmail.fr','dispostable.com','mailnull.com','spamgourmet.com',
  'trashmail.at','trashmail.io','trashmail.me','trashmail.net','trashmail.org','fakeinbox.com',
  'mailnesia.com','maildrop.cc','discard.email','10minutemail.com','10minutemail.net',
  '20minutemail.com','tempinbox.com','getairmail.com','filzmail.com','spam.la',
]

function isTempEmail(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? TEMP_EMAIL_DOMAINS.includes(domain) : false
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '0.3rem' }}>{msg}</p>
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Step 0: Email OTP
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpErrors, setOtpErrors] = useState({})

  // Steps 1–3: registration fields
  const [form, setForm] = useState({
    full_name: '', phone: '', password: '', confirm_password: '',
    parent_contact_name: '', parent_contact_phone: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    sameAsParent: false,
    email: '',
  })
  const [errors, setErrors] = useState({})

  const set = (key, val) => {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (next.sameAsParent && (key === 'parent_contact_name' || key === 'parent_contact_phone')) {
        if (key === 'parent_contact_name') next.emergency_contact_name = val
        if (key === 'parent_contact_phone') next.emergency_contact_phone = val
      }
      if (key === 'sameAsParent' && val) {
        next.emergency_contact_name = next.parent_contact_name
        next.emergency_contact_phone = next.parent_contact_phone
      }
      return next
    })
    setErrors(e => ({ ...e, [key]: '' }))
  }

  // ── Validators ──────────────────────────────────────────────────────────────

  const validateStep1 = () => {
    const e = {}
    const name = form.full_name.trim()
    if (!name) e.full_name = 'Full name is required.'
    else if (name.length < 2) e.full_name = 'Full name must be at least 2 characters.'
    else if (name.length > 30) e.full_name = 'Full name must be 30 characters or fewer.'
    else if (!/^[a-zA-Z\s'\-]+$/.test(name)) e.full_name = 'Name may only contain letters, spaces, hyphens, and apostrophes.'

    const phone = form.phone.trim()
    if (!phone) e.phone = 'Phone number is required.'
    else if (!PHONE_RE.test(phone)) e.phone = 'Enter a valid 10-digit mobile number (e.g. 9876543210).'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    const pName = form.parent_contact_name.trim()
    const pPhone = form.parent_contact_phone.trim()

    if (!pName) e.parent_contact_name = 'Parent name is required.'
    else if (pName.length > 30) e.parent_contact_name = 'Name must be 30 characters or fewer.'
    if (!pPhone) e.parent_contact_phone = 'Parent phone is required.'
    else if (!PHONE_RE.test(pPhone)) e.parent_contact_phone = 'Enter a valid 10-digit mobile number.'

    if (!form.sameAsParent) {
      const eName = form.emergency_contact_name.trim()
      const ePhone = form.emergency_contact_phone.trim()
      if (!eName) e.emergency_contact_name = 'Emergency contact name is required.'
      else if (eName.length > 30) e.emergency_contact_name = 'Name must be 30 characters or fewer.'
      if (!ePhone) e.emergency_contact_phone = 'Emergency contact phone is required.'
      else if (!PHONE_RE.test(ePhone)) e.emergency_contact_phone = 'Enter a valid 10-digit mobile number.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = () => {
    const e = {}
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain at least one uppercase letter.'
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain at least one number.'

    if (!form.confirm_password) e.confirm_password = 'Please confirm your password.'
    else if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match.'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── OTP ─────────────────────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    const email = otpEmail.trim().toLowerCase()
    const e = {}
    if (!email) { e.email = 'Email is required.'; setOtpErrors(e); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { e.email = 'Enter a valid email address.'; setOtpErrors(e); return }
    if (isTempEmail(email)) { e.email = 'Temporary or disposable email addresses are not accepted.'; setOtpErrors(e); return }
    setOtpErrors({})
    setLoading(true)
    try {
      await api.post('/auth/email-otp/send/', { email })
      setOtpSent(true)
      toast.success('OTP sent! Check your inbox.', { position: 'top-center' })
    } catch (err) {
      setOtpErrors({ email: err.response?.data?.detail || 'Failed to send OTP.' })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    const email = otpEmail.trim().toLowerCase()
    const otp = otpCode.trim()
    const e = {}
    if (!otp) { e.otp = 'Please enter the OTP.'; setOtpErrors(e); return }
    if (!/^\d{6}$/.test(otp)) { e.otp = 'OTP must be exactly 6 digits.'; setOtpErrors(e); return }
    setOtpErrors({})
    setLoading(true)
    try {
      await api.post('/auth/email-otp/verify/', { email, otp })
      set('email', email)
      toast.success('Email verified!', { position: 'top-center' })
      setStep(1)
    } catch (err) {
      setOtpErrors({ otp: err.response?.data?.detail || 'OTP verification failed.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Final Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) { if (validateStep1()) setStep(2); return }
    if (step === 2) { if (validateStep2()) setStep(3); return }
    if (!validateStep3()) return

    setLoading(true)
    try {
      const payload = {
        email: form.email,
        password: form.password,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        parent_contact_name: form.parent_contact_name.trim(),
        parent_contact_phone: form.parent_contact_phone.trim(),
        emergency_contact_name: form.sameAsParent ? form.parent_contact_name.trim() : form.emergency_contact_name.trim(),
        emergency_contact_phone: form.sameAsParent ? form.parent_contact_phone.trim() : form.emergency_contact_phone.trim(),
      }
      await api.post('/auth/register/', payload)
      toast.success('Account created! Please log in.', { position: 'top-center' })
      navigate('/login')
    } catch (err) {
      const errData = err.response?.data
      if (errData && typeof errData === 'object') {
        const mapped = {}
        Object.entries(errData).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
        toast.error('Please fix the errors below.', { position: 'top-center' })
      } else {
        toast.error('Registration failed. Please try again.', { position: 'top-center' })
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Password strength ────────────────────────────────────────────────────────
  const pwStrength = (() => {
    const pw = form.password
    if (!pw) return null
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    if (s <= 1) return { label: 'Weak', color: '#ef4444', w: '25%' }
    if (s === 2) return { label: 'Fair', color: '#f59e0b', w: '50%' }
    if (s === 3) return { label: 'Good', color: '#3b82f6', w: '75%' }
    return { label: 'Strong', color: '#22c55e', w: '100%' }
  })()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <div className="card" style={{ width: '100%', maxWidth: 500, padding: '2.5rem', position: 'relative' }}>
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

        {/* ── Step 0: Verify Email ── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="input" style={{ paddingLeft: '2.75rem', borderColor: otpErrors.email ? '#f87171' : undefined }}
                  type="email" placeholder="you@example.com"
                  value={otpEmail}
                  onChange={e => { setOtpEmail(e.target.value); setOtpErrors({}); setOtpSent(false); setOtpCode('') }}
                  disabled={otpSent} autoFocus />
              </div>
              <FieldError msg={otpErrors.email} />
            </div>

            {!otpSent ? (
              <button type="button" className="btn-primary" disabled={loading} onClick={handleSendOTP}>
                {loading ? 'Sending OTP...' : <><span>Send Verification Code</span><ArrowRight size={16} /></>}
              </button>
            ) : (
              <>
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  A 6-digit code was sent to <strong style={{ color: 'var(--text)' }}>{otpEmail}</strong>. Valid for 10 minutes.
                </div>
                <div>
                  <label>Enter OTP</label>
                  <input className="input" type="text" inputMode="numeric" placeholder="123456"
                    maxLength={6} value={otpCode}
                    onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpErrors({}) }}
                    autoFocus
                    style={{ letterSpacing: '0.3em', fontSize: '1.2rem', textAlign: 'center', borderColor: otpErrors.otp ? '#f87171' : undefined }} />
                  <FieldError msg={otpErrors.otp} />
                </div>
                <button type="button" className="btn-primary" disabled={loading} onClick={handleVerifyOTP}>
                  {loading ? 'Verifying...' : <><span>Verify & Continue</span><ArrowRight size={16} /></>}
                </button>
                <button type="button" onClick={() => { setOtpSent(false); setOtpCode(''); setOtpErrors({}) }}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-light)', cursor: 'pointer', fontSize: '0.85rem', textDecoration: 'underline' }}>
                  Use a different email
                </button>
              </>
            )}

            <div style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--brand-light)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
            </div>
          </div>
        )}

        {/* ── Steps 1–3 ── */}
        {step > 0 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Step 1: Personal Info */}
            {step === 1 && <>
              <div>
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }} />
                  <ShieldCheck size={15} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#22c55e' }} />
                  <input className="input" style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', opacity: 0.7 }} type="email" value={form.email} readOnly />
                </div>
                <p style={{ color: '#22c55e', fontSize: '0.8rem', marginTop: '0.3rem' }}>Email verified</p>
              </div>

              <div>
                <label>Full Name <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(max 30 chars)</span></label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" style={{ paddingLeft: '2.75rem', borderColor: errors.full_name ? '#f87171' : undefined }}
                    type="text" placeholder="Enter your full name" maxLength={30}
                    value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <FieldError msg={errors.full_name} />
                  <span style={{ fontSize: '0.75rem', color: form.full_name.length > 25 ? '#f87171' : 'var(--text-muted)', marginTop: '0.3rem', marginLeft: 'auto' }}>{form.full_name.length}/30</span>
                </div>
              </div>

              <div>
                <label>Phone Number <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(10 digits)</span></label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" style={{ paddingLeft: '2.75rem', borderColor: errors.phone ? '#f87171' : undefined }}
                    type="tel" placeholder="9876543210" maxLength={13}
                    value={form.phone} onChange={e => set('phone', e.target.value.replace(/[^\d+\s-]/g, ''))} />
                </div>
                <FieldError msg={errors.phone} />
              </div>
            </>}

            {/* Step 2: Contact Details — Parent first, then Emergency */}
            {step === 2 && <>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
                You can add your address, photo, and ID after logging in.
              </p>

              {/* Parent Contact */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Parent Contact</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem' }}>Name <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(max 30)</span></label>
                    <input className="input" placeholder="Parent name" maxLength={30}
                      style={{ borderColor: errors.parent_contact_name ? '#f87171' : undefined }}
                      value={form.parent_contact_name} onChange={e => set('parent_contact_name', e.target.value)} />
                    <FieldError msg={errors.parent_contact_name} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem' }}>Phone</label>
                    <input className="input" placeholder="9876543210" maxLength={13}
                      style={{ borderColor: errors.parent_contact_phone ? '#f87171' : undefined }}
                      value={form.parent_contact_phone} onChange={e => set('parent_contact_phone', e.target.value.replace(/[^\d+\s-]/g, ''))} />
                    <FieldError msg={errors.parent_contact_phone} />
                  </div>
                </div>
              </div>

              {/* Same as parent toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', padding: '0.25rem 0' }}>
                <input type="checkbox" checked={form.sameAsParent} onChange={e => set('sameAsParent', e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--brand)' }} />
                <span style={{ fontSize: '0.88rem' }}>Use parent contact as emergency contact</span>
              </label>

              {/* Emergency Contact — only show if not same as parent */}
              {!form.sameAsParent && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--brand-light)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Emergency Contact</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem' }}>Name <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(max 30)</span></label>
                      <input className="input" placeholder="Contact name" maxLength={30}
                        style={{ borderColor: errors.emergency_contact_name ? '#f87171' : undefined }}
                        value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
                      <FieldError msg={errors.emergency_contact_name} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem' }}>Phone</label>
                      <input className="input" placeholder="9876543210" maxLength={13}
                        style={{ borderColor: errors.emergency_contact_phone ? '#f87171' : undefined }}
                        value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value.replace(/[^\d+\s-]/g, ''))} />
                      <FieldError msg={errors.emergency_contact_phone} />
                    </div>
                  </div>
                </div>
              )}
            </>}

            {/* Step 3: Password */}
            {step === 3 && <>
              <div>
                <label>Create Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" style={{ paddingLeft: '2.75rem', paddingRight: '3rem', borderColor: errors.password ? '#f87171' : undefined }}
                    type={showPw ? 'text' : 'password'} placeholder="Min 8 chars, 1 uppercase, 1 number"
                    value={form.password} onChange={e => set('password', e.target.value)} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwStrength && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pwStrength.w, background: pwStrength.color, borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: pwStrength.color, fontWeight: 600 }}>{pwStrength.label}</span>
                  </div>
                )}
                <FieldError msg={errors.password} />
              </div>

              <div>
                <label>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="input" style={{ paddingLeft: '2.75rem', paddingRight: '3rem', borderColor: errors.confirm_password ? '#f87171' : undefined }}
                    type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password"
                    value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldError msg={errors.confirm_password} />
              </div>

              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text)' }}>After registration:</strong><br />
                1. Set up 2FA with Google Authenticator or Authy<br />
                2. Complete your profile (photo + ID required to book a room)<br />
                3. Browse rooms and submit a booking request
              </div>
            </>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              {step > 1 && (
                <button type="button" className="btn-secondary" onClick={() => { setStep(s => s - 1); setErrors({}) }} style={{ flex: 1 }}>Back</button>
              )}
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2 }}>
                {step < 3 ? <><span>Next</span><ArrowRight size={16} /></> : loading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {step > 0 && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand-light)', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </div>
        )}
      </div>
    </div>
  )
}
