import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, UploadCloud, Users, BedDouble, ChevronRight } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function AdminRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  
  const [form, setForm] = useState({
    room_number: '', floor: '', room_type: 'single', total_beds: '', rent_amount: ''
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = () => {
    api.get('/rooms/admin/rooms/').then(r => setRooms(r.data.results || r.data)).finally(() => setLoading(false))
  }

  const openForm = (r = null) => {
    setEditingRoom(r)
    if (r) setForm({ room_number: r.room_number, floor: r.floor, room_type: r.room_type, total_beds: r.total_beds, rent_amount: r.rent_amount })
    else setForm({ room_number: '', floor: '', room_type: 'single', total_beds: '', rent_amount: '' })
    setIsFormOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRoom) await api.put(`/rooms/admin/rooms/${editingRoom.id}/`, form)
      else await api.post('/rooms/admin/rooms/', form)
      
      toast.success(`Room ${editingRoom ? 'updated' : 'added'}!`)
      setIsFormOpen(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving room')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room definitively? All beds will be lost.')) return
    try {
      await api.delete(`/rooms/admin/rooms/${id}/`)
      toast.success('Room deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete room (ensure no active allocations)')
    }
  }

  const handlePhotoUpload = async (id, e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    try {
      await api.post(`/rooms/admin/rooms/${id}/photos/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Photo uploaded')
      fetchData()
    } catch {
      toast.error('Failed to upload photo')
    }
  }

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Loading rooms...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Room Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Add, edit, and monitor physical hostel rooms.</p>
        </div>
        <button className="btn-primary" onClick={() => openForm()} style={{ fontSize: '0.85rem' }}>
          <Plus size={16} /> Add Room
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {rooms.map(r => (
          <div key={r.id} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{r.room_number}</span>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{r.room_type}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Floor {r.floor} • ₹{r.rent_amount}/mo</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openForm(r)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Edit"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Delete"><Trash2 size={16} /></button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>TOTAL BEDS</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <BedDouble size={14} color="var(--brand-light)" /> {r.total_beds}
                </div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>AVAILABLE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: r.available_beds > 0 ? 'var(--success)' : 'var(--danger)' }}>
                  <Users size={14} /> {r.available_beds}
                </div>
              </div>
            </div>

            {/* Photos */}
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                Photos ({r.photos_list?.length || 0})
                <label style={{ cursor: 'pointer', color: 'var(--brand-light)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <UploadCloud size={14} /> Add
                  <input type="file" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(r.id, e)} accept="image/*" />
                </label>
              </div>
              {r.photos_list?.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {r.photos_list.map(p => (
                    <img key={p.id} src={p.image} alt="Room" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No photos uploaded.</div>
              )}
            </div>
          </div>
        ))}
        {rooms.length === 0 && <div style={{ color: 'var(--text-muted)' }}>No rooms created yet.</div>}
      </div>

      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2rem', background: 'var(--surface)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.5rem' }}>{editingRoom ? 'Edit Room' : 'Add New Room'}</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div>
                  <label>Room Number</label>
                  <input type="text" className="input" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} required placeholder="101" />
                </div>
                <div>
                  <label>Floor</label>
                  <input type="number" className="input" value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} required min={0} placeholder="1" />
                </div>
              </div>

              <div>
                <label>Room Type</label>
                <select className="input" value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})} style={{ appearance: 'none', background: 'rgba(255,255,255,0.06)' }}>
                  <option value="single" style={{ background: 'var(--surface)' }}>Single</option>
                  <option value="double" style={{ background: 'var(--surface)' }}>Double Share</option>
                  <option value="triple" style={{ background: 'var(--surface)' }}>Triple Share</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div>
                  <label>Total Beds</label>
                  <input type="number" className="input" value={form.total_beds} onChange={e => setForm({...form, total_beds: e.target.value})} required min={1} max={10} disabled={!!editingRoom} />
                  {editingRoom && <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: 4 }}>Cannot edit bed count after creation.</div>}
                </div>
                <div>
                  <label>Rent / Month (₹)</label>
                  <input type="number" className="input" value={form.rent_amount} onChange={e => setForm({...form, rent_amount: e.target.value})} required min={0} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsFormOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
