import { useState, useEffect, useRef } from 'react'
import { Upload, QrCode, CreditCard, CheckCircle2, Clock, AlertTriangle, Filter, Bell, BellOff, RefreshCw, Play, Save } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  paid:    { icon: CheckCircle2, badge: 'badge-success', label: 'Paid' },
  pending: { icon: Clock,        badge: 'badge-warning', label: 'Pending' },
  overdue: { icon: AlertTriangle,badge: 'badge-danger',  label: 'Overdue' },
}

export default function AdminPayments() {
  const [payments, setPayments]       = useState([])
  const [upiQR, setUpiQR]             = useState(null)
  const [filter, setFilter]           = useState('')
  const [uploading, setUploading]     = useState(false)
  const [triggering, setTriggering]   = useState(false)
  const [savingSched, setSavingSched] = useState(false)
  const [schedule, setSchedule]       = useState({ enabled: false, remind_hour: 9, remind_minute: 0, last_run_at: null })
  const fileRef = useRef()

  const fetchAll = async () => {
    try {
      const [payRes, qrRes, schedRes] = await Promise.all([
        api.get('/payments/admin/' + (filter ? `?status=${filter}` : '')),
        api.get('/payments/upi-qr/').catch(() => ({ data: null })),
        api.get('/payments/reminder-schedule/').catch(() => ({ data: null })),
      ])
      setPayments(payRes.data.results || payRes.data)
      setUpiQR(qrRes.data)
      if (schedRes.data) setSchedule(schedRes.data)
    } catch {
      toast.error('Failed to load payment data')
    }
  }

  useEffect(() => { fetchAll() }, [filter])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('image', file)
    try {
      await api.post('/payments/admin/upi-qr/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success('UPI QR uploaded successfully')
      fetchAll()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const markPaid = async (payment) => {
    try {
      await api.post(`/payments/${payment.id}/paid/`)
      toast.success(`${payment.resident_name}'s payment marked as paid`)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  const triggerReminders = async () => {
    setTriggering(true)
    try {
      const res = await api.post('/payments/trigger-reminders/')
      toast.success(res.data.detail)
      fetchAll()
    } catch {
      toast.error('Failed to trigger reminders')
    } finally {
      setTriggering(false)
    }
  }

  const saveSchedule = async () => {
    setSavingSched(true)
    try {
      const res = await api.patch('/payments/reminder-schedule/', {
        enabled: schedule.enabled,
        remind_hour: parseInt(schedule.remind_hour),
        remind_minute: parseInt(schedule.remind_minute),
      })
      setSchedule(res.data)
      toast.success('Reminder schedule saved')
    } catch {
      toast.error('Failed to save schedule')
    } finally {
      setSavingSched(false)
    }
  }

  const stats = {
    total: payments.length,
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'pending').length,
    overdue: payments.filter(p => p.status === 'overdue').length,
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>
        Payment Management
      </h1>

      {/* Top row: UPI upload + schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* UPI QR Upload */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <QrCode size={20} style={{ color: 'var(--brand)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>UPI QR Code</span>
          </div>
          {upiQR?.qr_image && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <img src={upiQR.qr_image} alt="UPI QR" style={{ width: 140, height: 140, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8 }} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Uploaded {new Date(upiQR.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          )}
          <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={handleUpload} />
          <button
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => fileRef.current.click()}
            disabled={uploading}
          >
            <Upload size={16} />
            {uploading ? 'Uploading…' : upiQR?.qr_image ? 'Replace QR' : 'Upload New QR'}
          </button>
        </div>

        {/* Reminder Schedule */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            {schedule.enabled ? <Bell size={20} style={{ color: 'var(--brand)' }} /> : <BellOff size={20} style={{ color: 'var(--text-muted)' }} />}
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Auto Email Reminders</span>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', cursor: 'pointer' }}>
            <div
              onClick={() => setSchedule(s => ({ ...s, enabled: !s.enabled }))}
              style={{
                width: 42, height: 24, borderRadius: 12, background: schedule.enabled ? 'var(--brand)' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, left: schedule.enabled ? 20 : 3, transition: 'left 0.2s'
              }} />
            </div>
            <span style={{ fontSize: '0.9rem', color: schedule.enabled ? 'var(--text)' : 'var(--text-muted)' }}>
              {schedule.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <label style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Hour (0–23)</div>
              <input
                type="number" min={0} max={23}
                value={schedule.remind_hour}
                onChange={e => setSchedule(s => ({ ...s, remind_hour: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
              />
            </label>
            <label style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Minute (0–59)</div>
              <input
                type="number" min={0} max={59}
                value={schedule.remind_minute}
                onChange={e => setSchedule(s => ({ ...s, remind_minute: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.9rem' }}
              />
            </label>
          </div>

          {schedule.last_run_at && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Last run: {new Date(schedule.last_run_at).toLocaleString()}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
              onClick={saveSchedule} disabled={savingSched}
            >
              <Save size={14} /> {savingSched ? 'Saving…' : 'Save'}
            </button>
            <button
              className="btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', background: 'var(--surface-2)', color: 'var(--text)' }}
              onClick={triggerReminders} disabled={triggering}
            >
              <Play size={14} /> {triggering ? 'Running…' : 'Run Now'}
            </button>
          </div>
        </div>

        {/* Stats card */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <CreditCard size={20} style={{ color: 'var(--brand)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Overview</span>
          </div>
          {[
            { label: 'Total Records', value: stats.total, color: 'var(--text)' },
            { label: 'Paid', value: stats.paid, color: 'var(--success)' },
            { label: 'Pending', value: stats.pending, color: 'var(--warning)' },
            { label: 'Overdue', value: stats.overdue, color: 'var(--danger)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Payment Records</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.85rem' }}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
            <button onClick={fetchAll} style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {payments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No payment records found.</div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Resident', 'Month', 'Amount', 'Due Date', 'Status', 'Paid On', 'Action'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const st = STATUS_STYLE[p.status] || STATUS_STYLE.pending
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '0.7rem 0.75rem', fontWeight: 600 }}>{p.resident_name}</td>
                      <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.85rem' }}>{p.month_label}</td>
                      <td style={{ padding: '0.7rem 0.75rem', fontWeight: 700 }}>₹{parseFloat(p.amount).toLocaleString()}</td>
                      <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.due_date}</td>
                      <td style={{ padding: '0.7rem 0.75rem' }}>
                        <span className={`badge ${st.badge}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <st.icon size={12} /> {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.paid_date || '—'}</td>
                      <td style={{ padding: '0.7rem 0.75rem' }}>
                        {p.status !== 'paid' && (
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                            onClick={() => markPaid(p)}
                          >
                            Mark Paid
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
