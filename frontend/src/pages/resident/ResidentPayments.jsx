import { useState, useEffect } from 'react'
import { CreditCard, QrCode, CheckCircle2, Clock, AlertTriangle, RefreshCw, Download, Send } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  paid:    { icon: CheckCircle2, color: 'var(--success)', badge: 'badge-success', label: 'Paid' },
  pending: { icon: Clock,        color: 'var(--warning)', badge: 'badge-warning', label: 'Pending' },
  overdue: { icon: AlertTriangle,color: 'var(--danger)',  badge: 'badge-danger',  label: 'Overdue' },
}

export default function ResidentPayments() {
  const [payments, setPayments] = useState([])
  const [upiQR, setUpiQR]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [recordingId, setRecordingId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [payRes, qrRes] = await Promise.all([
        api.get('/payments/my/'),
        api.get('/payments/upi-qr/').catch(() => ({ data: null })),
      ])
      setPayments(payRes.data.results || payRes.data)
      setUpiQR(qrRes.data)
    } catch {
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleRecordPayment = async (paymentId) => {
    setRecordingId(paymentId)
    try {
      const res = await api.post(`/payments/${paymentId}/record/`)
      toast.success(res.data.detail)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to record payment')
    } finally {
      setRecordingId(null)
    }
  }

  const outstanding = payments.filter(p => p.status !== 'paid')
  const totalDue    = outstanding.reduce((s, p) => s + parseFloat(p.amount || 0), 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
    </div>
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>
        My Payments
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Summary Card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <CreditCard size={20} style={{ color: 'var(--brand)' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>Payment Summary</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Payments</span>
              <span style={{ fontWeight: 600 }}>{payments.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Paid</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>{payments.filter(p => p.status === 'paid').length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Outstanding</span>
              <span style={{ color: outstanding.length > 0 ? 'var(--danger)' : 'var(--text)', fontWeight: 600 }}>
                {outstanding.length > 0 ? `₹${totalDue.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* UPI QR Card */}
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', justifyContent: 'center' }}>
            <QrCode size={20} style={{ color: 'var(--brand)' }} />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>Pay via UPI</span>
          </div>
          {upiQR?.qr_image ? (
            <>
              <img
                src={upiQR.qr_image}
                alt="UPI QR Code"
                style={{ width: 350, height: 350, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)', margin: '0 auto', display: 'block', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                Scan to pay rent
              </p>
              <a
                href={upiQR.qr_image}
                download="hostel_upi_qr.png"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--brand)', textDecoration: 'none' }}
              >
                <Download size={14} /> Download QR
              </a>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
              No UPI QR uploaded yet. Contact the administrator.
            </div>
          )}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Payment History</h2>
        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No payment records yet.</div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Month', 'Due Date', 'Amount', 'Status', 'Paid On', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '0.7rem 0.75rem', fontWeight: 600 }}>{p.month_label}</td>
                      <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.due_date}</td>
                      <td style={{ padding: '0.7rem 0.75rem', fontWeight: 700 }}>₹{parseFloat(p.amount).toLocaleString()}</td>
                      <td style={{ padding: '0.7rem 0.75rem' }}>
                        <span className={`badge ${st.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <st.icon size={12} />
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {p.paid_date || '—'}
                      </td>
                      <td style={{ padding: '0.7rem 0.75rem' }}>
                        {p.status !== 'paid' && (
                          <button
                            onClick={() => handleRecordPayment(p.id)}
                            disabled={recordingId === p.id}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.7rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 6, color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600, cursor: recordingId === p.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: recordingId === p.id ? 0.6 : 1 }}
                          >
                            <Send size={12} /> {recordingId === p.id ? 'Sending…' : 'I Paid'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
