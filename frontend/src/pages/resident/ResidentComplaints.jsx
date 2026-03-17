import { useState, useEffect, useRef } from 'react'
import { Plus, ChevronDown, ChevronUp, Send, MessageSquare, RefreshCw, Paperclip } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

const CATEGORIES = ['maintenance', 'cleanliness', 'noise', 'electrical', 'plumbing', 'staff', 'other']

const STATUS_BADGE = {
  submitted:   { cls: 'badge-info',    label: 'Submitted' },
  pending:     { cls: 'badge-warning', label: 'Pending' },
  in_progress: { cls: 'badge-warning', label: 'In Progress' },
  resolved:    { cls: 'badge-success', label: 'Resolved' },
}

export default function ResidentComplaints() {
  const [complaints, setComplaints] = useState([])
  const [expanded, setExpanded]     = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [replyText, setReplyText]   = useState({})
  const [form, setForm]             = useState({ category: 'maintenance', description: '' })
  const fileRef = useRef()
  const [photoFile, setPhotoFile]   = useState(null)

  const fetchComplaints = async () => {
    setLoading(true)
    try {
      const res = await api.get('/complaints/')
      setComplaints(res.data.results || res.data)
    } catch {
      toast.error('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComplaints() }, [])

  const submitComplaint = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) return toast.error('Please enter description')
    setSubmitting(true)
    const fd = new FormData()
    fd.append('category', form.category)
    fd.append('description', form.description)
    if (photoFile) fd.append('photo', photoFile)
    try {
      await api.post('/complaints/', fd)
      toast.success('Complaint submitted successfully')
      setForm({ category: 'maintenance', description: '' })
      setPhotoFile(null)
      setShowForm(false)
      fetchComplaints()
    } catch {
      toast.error('Failed to submit complaint')
    } finally {
      setSubmitting(false)
    }
  }

  const sendReply = async (complaintId) => {
    const msg = (replyText[complaintId] || '').trim()
    if (!msg) return
    try {
      await api.post(`/complaints/${complaintId}/messages/`, { message: msg })
      setReplyText(r => ({ ...r, [complaintId]: '' }))
      fetchComplaints()
    } catch {
      toast.error('Failed to send message')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
    </div>
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>My Complaints</h1>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowForm(f => !f)}>
          <Plus size={16} /> {showForm ? 'Cancel' : 'Raise a Complaint'}
        </button>
      </div>

      {/* New Complaint Form */}
      {showForm && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>New Complaint</h2>
          <form onSubmit={submitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Category</div>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)' }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            <label>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Description *</div>
              <textarea
                rows={4} placeholder="Describe your issue in detail…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </label>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Attach Photo (optional)</div>
              <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={e => setPhotoFile(e.target.files[0])} />
              <button type="button" onClick={() => fileRef.current.click()}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
                <Paperclip size={14} /> {photoFile ? photoFile.name : 'Choose Photo'}
              </button>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-end', minWidth: 140 }}>
              {submitting ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      )}

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No complaints yet. Raise one if you have an issue.</div>
      ) : (
        complaints.map(c => {
          const st = STATUS_BADGE[c.status] || STATUS_BADGE.submitted
          const isOpen = expanded === c.id
          return (
            <div key={c.id} className="card" style={{ marginBottom: '0.75rem', overflow: 'hidden' }}>
              {/* Header Row */}
              <div
                style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '0.5rem' }}
                onClick={() => setExpanded(isOpen ? null : c.id)}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.complaint_id}</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{c.category}</span>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded Detail */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem' }}>
                  <p style={{ marginBottom: '0.75rem', color: 'var(--text)', lineHeight: 1.6 }}>{c.description}</p>
                  {c.admin_notes && (
                    <div style={{ background: 'var(--surface-2)', borderRadius: 6, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                      <strong>Admin Notes:</strong> {c.admin_notes}
                    </div>
                  )}
                  {/* Thread messages */}
                  {c.messages?.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {c.messages.map(m => (
                        <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_role === 'resident' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '75%', padding: '0.5rem 0.75rem', borderRadius: 8,
                            background: m.sender_role === 'resident' ? 'var(--brand)' : 'var(--surface-2)',
                            color: m.sender_role === 'resident' ? '#fff' : 'var(--text)',
                            fontSize: '0.875rem'
                          }}>
                            {m.message}
                            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>
                              {m.sender_role === 'admin' ? 'Admin' : 'You'} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Reply input */}
                  {c.status !== 'resolved' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <input
                        placeholder="Send a follow-up message…"
                        value={replyText[c.id] || ''}
                        onChange={e => setReplyText(r => ({ ...r, [c.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && sendReply(c.id)}
                        style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.875rem' }}
                      />
                      <button className="btn btn-primary" onClick={() => sendReply(c.id)} style={{ padding: '0.5rem 0.9rem' }}>
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
