import { useState, useEffect } from 'react'
import { Filter, ChevronDown, ChevronUp, Send, RefreshCw, MessageSquare } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

const STATUS_OPTS = ['submitted', 'pending', 'in_progress', 'resolved']
const PRIORITY_OPTS = ['low', 'medium', 'high']
const CATEGORY_OPTS = ['maintenance', 'cleanliness', 'noise', 'electrical', 'plumbing', 'staff', 'other']

const STATUS_BADGE = {
  submitted:   { cls: 'badge-info',    label: 'Submitted' },
  pending:     { cls: 'badge-warning', label: 'Pending' },
  in_progress: { cls: 'badge-warning', label: 'In Progress' },
  resolved:    { cls: 'badge-success', label: 'Resolved' },
}
const PRIORITY_BADGE = {
  low:    'badge-info',
  medium: 'badge-warning',
  high:   'badge-danger',
}

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([])
  const [expanded, setExpanded]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [filters, setFilters]       = useState({ status: '', category: '', priority: '' })
  const [updating, setUpdating]     = useState(null)
  const [editState, setEditState]   = useState({}) // { [id]: { status, priority, admin_notes } }
  const [replyText, setReplyText]   = useState({})

  const fetchComplaints = async () => {
    setLoading(true)
    const params = Object.entries(filters).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&')
    try {
      const res = await api.get(`/complaints/admin/${params ? '?' + params : ''}`)
      setComplaints(res.data.results || res.data)
    } catch {
      toast.error('Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchComplaints() }, [filters])

  const openExpand = (id, c) => {
    if (expanded === id) { setExpanded(null); return }
    setExpanded(id)
    setEditState(s => ({ ...s, [id]: { status: c.status, priority: c.priority, admin_notes: c.admin_notes } }))
  }

  const saveUpdate = async (c) => {
    setUpdating(c.id)
    try {
      await api.patch(`/complaints/admin/${c.id}/`, editState[c.id])
      toast.success(`Complaint ${c.complaint_id} updated`)
      fetchComplaints()
    } catch {
      toast.error('Update failed')
    } finally {
      setUpdating(null)
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
      toast.error('Failed to send reply')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
    </div>
  )

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>Complaint Management</h1>
        <button onClick={fetchComplaints} style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={15} style={{ color: 'var(--text-muted)' }} />
        {[
          { key: 'status', opts: STATUS_OPTS, label: 'All Statuses' },
          { key: 'category', opts: CATEGORY_OPTS, label: 'All Categories' },
          { key: 'priority', opts: PRIORITY_OPTS, label: 'All Priorities' },
        ].map(({ key, opts, label }) => (
          <select
            key={key}
            value={filters[key]}
            onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
            style={{ padding: '0.4rem 0.75rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.85rem' }}
          >
            <option value="">{label}</option>
            {opts.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
          </select>
        ))}
      </div>

      {/* List */}
      {complaints.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No complaints found.</div>
      ) : (
        complaints.map(c => {
          const st = STATUS_BADGE[c.status] || STATUS_BADGE.submitted
          const isOpen = expanded === c.id
          const edit = editState[c.id] || {}
          return (
            <div key={c.id} className="card" style={{ marginBottom: '0.75rem', overflow: 'hidden' }}>
              {/* Header */}
              <div
                onClick={() => openExpand(c.id, c)}
                style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '0.5rem' }}
              >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.complaint_id}</span>
                  <span style={{ fontWeight: 600 }}>{c.resident_name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{c.category}</span>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                  <span className={`badge ${PRIORITY_BADGE[c.priority]}`} style={{ textTransform: 'capitalize' }}>{c.priority}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {c.messages?.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <MessageSquare size={12} /> {c.messages.length}
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem' }}>
                  <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{c.description}</p>

                  {/* Admin Update Fields */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    <label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Status</div>
                      <select
                        value={edit.status || c.status}
                        onChange={e => setEditState(s => ({ ...s, [c.id]: { ...s[c.id], status: e.target.value } }))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.875rem' }}
                      >
                        {STATUS_OPTS.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                      </select>
                    </label>
                    <label>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Priority</div>
                      <select
                        value={edit.priority || c.priority}
                        onChange={e => setEditState(s => ({ ...s, [c.id]: { ...s[c.id], priority: e.target.value } }))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.875rem' }}
                      >
                        {PRIORITY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </label>
                  </div>
                  <label style={{ display: 'block', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Admin Notes</div>
                    <textarea
                      value={edit.admin_notes ?? c.admin_notes}
                      onChange={e => setEditState(s => ({ ...s, [c.id]: { ...s[c.id], admin_notes: e.target.value } }))}
                      rows={2} placeholder="Add notes for the resident…"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', resize: 'vertical', fontSize: '0.875rem', boxSizing: 'border-box' }}
                    />
                  </label>
                  <button
                    className="btn btn-primary"
                    onClick={() => saveUpdate(c)}
                    disabled={updating === c.id}
                    style={{ marginBottom: '1rem', fontSize: '0.875rem' }}
                  >
                    {updating === c.id ? 'Saving…' : 'Save Changes'}
                  </button>

                  {/* Thread */}
                  {c.messages?.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {c.messages.map(m => (
                        <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_role === 'admin' ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '75%', padding: '0.5rem 0.75rem', borderRadius: 8,
                            background: m.sender_role === 'admin' ? 'var(--brand)' : 'var(--surface-2)',
                            color: m.sender_role === 'admin' ? '#fff' : 'var(--text)',
                            fontSize: '0.875rem',
                          }}>
                            {m.message}
                            <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.2rem' }}>
                              {m.sender_role === 'admin' ? 'You (Admin)' : 'Resident'} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <input
                      placeholder="Reply to resident…"
                      value={replyText[c.id] || ''}
                      onChange={e => setReplyText(r => ({ ...r, [c.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && sendReply(c.id)}
                      style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: '0.875rem' }}
                    />
                    <button className="btn btn-primary" onClick={() => sendReply(c.id)} style={{ padding: '0.5rem 0.9rem' }}>
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
