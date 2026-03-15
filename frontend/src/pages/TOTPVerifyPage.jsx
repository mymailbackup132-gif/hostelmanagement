import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Shield, RefreshCw } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function TOTPVerifyPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [qr, setQr] = useState(null)
  const [setupLoading, setSetupLoading] = useState(false)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])

  const { user_id, email, is_2fa_setup } = state || {}

  useEffect(() => {
    if (!user_id) navigate('/login')
  }, [user_id, navigate])

  useEffect(() => {
    if (!is_2fa_setup && user_id) {
      setSetupLoading(true)
      api.get(`/auth/totp/setup/?user_id=${user_id}`)
        .then(r => setQr(r.data))
        .catch(() => toast.error('Could not load QR code'))
        .finally(() => setSetupLoading(false))
    }
  }, [is_2fa_setup, user_id])

  const handleDigitChange = (val, idx) => {
    const updated = [...digits]
    updated[idx] = val.slice(-1)
    setDigits(updated)
    const full = updated.join('')
    setToken(full)
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (token.length !== 6) return toast.error('Enter all 6 digits')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/totp/verify/', { user_id, token })
      login(data)
      toast.success('Welcome back!')
      navigate(data.role === 'admin' ? '/admin' : '/resident')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid code')
      setDigits(['', '', '', '', '', ''])
      setToken('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div className="card" style={{ width: '100%', maxWidth: 460, padding: '2.5rem', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}>
            <Shield size={26} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>Two-Factor Auth</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
            {is_2fa_setup ? 'Enter the 6-digit code from your authenticator app' : 'Scan the QR code to set up your authenticator'}
          </p>
        </div>

        {!is_2fa_setup && (
          <div style={{ marginBottom: '1.5rem' }}>
            {setupLoading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}><RefreshCw size={24} className="animate-spin" /></div>
            ) : qr ? (
              <div style={{ textAlign: 'center' }}>
                <img src={qr.qr_image} alt="TOTP QR Code" style={{ width: 180, borderRadius: 12, border: '4px solid var(--border)', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Or enter this secret manually:</p>
                <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.4rem 0.75rem', borderRadius: 8, fontSize: '0.85rem', letterSpacing: '0.1em', color: 'var(--brand-light)' }}>{qr.secret}</code>
              </div>
            ) : null}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ textAlign: 'center', display: 'block', marginBottom: '1rem' }}>Enter 6-digit code</label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              {digits.map((d, i) => (
                <input
                  key={i} id={`otp-${i}`} type="text" inputMode="numeric"
                  value={d} onChange={(e) => handleDigitChange(e.target.value, i)}
                  onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) document.getElementById(`otp-${i - 1}`)?.focus() }}
                  maxLength={1} autoFocus={i === 0}
                  style={{ width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', outline: 'none' }}
                />
              ))}
            </div>
          </div>

          <button id="totp-submit" type="submit" className="btn-primary" disabled={loading || token.length !== 6} style={{ width: '100%' }}>
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--brand-light)', textDecoration: 'none' }}>← Back to login</Link>
        </div>
      </div>
    </div>
  )
}
