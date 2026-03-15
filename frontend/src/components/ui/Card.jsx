export function Card({ title, description, headerRight, children, className = '', ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || description || headerRight) && (
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            {title && (
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: description ? 4 : 0 }}>
                {title}
              </h2>
            )}
            {description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{description}</p>
            )}
          </div>
          {headerRight && <div style={{ textAlign: 'right' }}>{headerRight}</div>}
        </div>
      )}
      <div style={{ padding: '1.25rem' }}>{children}</div>
    </div>
  )
}
