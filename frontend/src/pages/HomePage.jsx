import { Link } from 'react-router-dom'
import { Building2, Shield, Wifi, Droplets, UtensilsCrossed, Wind, Phone, Mail, MapPin, Star, ArrowRight, CheckCircle } from 'lucide-react'
import hostel1 from '../assets/hostel1.jpg'
import hostel2 from '../assets/hostel2.jpg'
import hostel3 from '../assets/hostel3.jpg'

const facilities = [
  { icon: <Wifi size={24} />, title: 'High-Speed Wi-Fi', desc: 'Unlimited internet access across all rooms' },
  { icon: <Droplets size={24} />, title: 'Hot Water 24/7', desc: 'Instant geyser in every attached bathroom' },
  { icon: <Shield size={24} />, title: 'Secure Access', desc: 'QR-based gate entry & 24/7 CCTV monitoring' },
  { icon: <UtensilsCrossed size={24} />, title: 'Common Kitchen', desc: 'Fully equipped shared kitchen facilities' },
  { icon: <Wind size={24} />, title: 'AC Rooms', desc: 'Climate-controlled rooms for maximum comfort' },
  { icon: <Building2 size={24} />, title: 'Attached Bathrooms', desc: 'Private bathroom in every room' },
]

const roomTypes = [
  { type: 'Single', beds: 1, price: 10000, color: 'from-violet-500 to-indigo-500', perks: ['Private room', 'Max privacy', 'Study desk'] },
  { type: 'Double Share', beds: 2, price: 9500, color: 'from-blue-500 to-cyan-500', perks: ['2 residents', 'Spacious layout', 'Shared desk'] },
  { type: 'Triple Share', beds: 3, price: 7500, color: 'from-teal-500 to-green-500', perks: ['3 residents', 'Most economical', 'Common area'] },
]

const reviews = [
  { name: 'Arjun K.', review: 'Best PG in the city. The QR-based entry makes me feel super secure.', rating: 5 },
  { name: 'Priya S.', review: 'Digital payments and instant receipts — management is flawless.', rating: 5 },
  { name: 'Rohan M.', review: 'Complaint system is so easy. Issues resolved within 24 hours!', rating: 4 },
]

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,15,35,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>HostelMS</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="#rooms" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Rooms</a>
          <a href="#facilities" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Facilities</a>
          <a href="#contact" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>Contact</a>
          <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>Login</Link>
          <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>Register</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: '7rem 2rem 5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        {/* Gradient blobs */}
        <div style={{ position: 'absolute', top: '-10rem', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700, background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '5rem', left: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 100, padding: '0.35rem 1rem', fontSize: '0.8rem', color: 'var(--brand-light)', fontWeight: 600, marginBottom: '1.5rem' }}>
          <Shield size={12} /> Smart PG Management Platform
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, maxWidth: 700, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fff 30%, var(--brand-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Your Home Away<br />From Home
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: 520, lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Premium PG accommodation with full digital management — book rooms, pay rent, raise complaints, and access the hostel all through one smart platform.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" className="btn-primary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
            Book a Room <ArrowRight size={18} />
          </Link>
          <a href="#rooms" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.9rem 2rem' }}>
            View Rooms
          </a>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['150+', 'Happy Residents'], ['100%', 'Digital Ops'], ['24/7', 'Security'], ['3 Types', 'Room Options']].map(([val, lab]) => (
            <div key={lab} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-light)' }}>{val}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{lab}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FACILITIES */}
      <section id="facilities" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>World-Class Facilities</h2>
            <p style={{ color: 'var(--text-muted)' }}>Everything you need for a comfortable and productive stay</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {facilities.map((f) => (
              <div key={f.title} className="card" style={{ padding: '1.75rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', transition: 'transform 0.2s', cursor: 'default' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: 48, height: 48, background: 'rgba(99,102,241,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-light)', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{f.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Gallery*/}
      <section id="gallery" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>A Glimpse of Our Hostel</h2>
            <p style={{ color: 'var(--text-muted)' }}>Take a look at the premium living experience our hostel offers</p>
          </div>
          <div className="gallery-grid">
            <div className="gallery-card">
              <img src={hostel1} alt="Common Area" />
              <div className="gallery-overlay">
                <span>Modern Rooms</span>
              </div>
            </div>
            <div className="gallery-card">
              <img src={hostel2} alt="Modern Rooms" />
              <div className="gallery-overlay">
                <span>Premium Living</span>
              </div>
            </div>
            <div className="gallery-card">
              <img src={hostel3} alt="Premium Living" />
              <div className="gallery-overlay">
                <span>Common Area</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ROOMS */}
      <section id="rooms" style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Choose Your Room</h2>
            <p style={{ color: 'var(--text-muted)' }}>Flexible options for every budget and preference</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {roomTypes.map((r) => (
              <div key={r.type} className="card" style={{ overflow: 'hidden', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ height: 8, background: `linear-gradient(90deg, ${r.color.replace('from-', '').replace('to-', '').split(' ').join(', ')})`, backgroundImage: `linear-gradient(to right, ${r.color.includes('violet') ? '#8b5cf6' : r.color.includes('blue') ? '#3b82f6' : '#14b8a6'}, ${r.color.includes('indigo') ? '#6366f1' : r.color.includes('cyan') ? '#06b6d4' : '#22c55e'})` }} />
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{r.type}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.beds} bed{r.beds > 1 ? 's' : ''} per room</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-light)' }}>₹{r.price.toLocaleString()}</span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>/month</div>
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {r.perks.map(p => (
                      <li key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <CheckCircle size={14} style={{ color: 'var(--success)' }} />{p}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="btn-primary" style={{ width: '100%', fontSize: '0.9rem', padding: '0.65rem' }}>Book Now</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Resident Reviews</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {reviews.map((r) => (
              <div key={r.name} className="card" style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '1rem' }}>
                  {Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>&ldquo;{r.review}&rdquo;</p>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Get In Touch</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Have questions? We&apos;re here to help.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {[
              [<Phone size={18} />, '+91 94944 27439'],
              [<Mail size={18} />, 'maheshsripada98@gmail.com'],
              [<MapPin size={18} />, 'Hyderabad, Telangana'],
            ].map(([icon, val], i) => (
              <div key={i} className="card" style={{ padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--brand-light)' }}>{icon}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
