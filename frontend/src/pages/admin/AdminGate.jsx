import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, CameraOff, CheckCircle, XCircle, ScanLine, User, RefreshCw, AlertTriangle, KeyRound, Send } from 'lucide-react'
import jsQR from 'jsqr'
import api from '../../api'
import toast from 'react-hot-toast'

export default function AdminGate() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const scanIntervalRef = useRef(null)
  const lastScannedRef = useRef(null)

  const [cameraOn, setCameraOn] = useState(false)
  const [stream, setStream] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [manualToken, setManualToken] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  // Camera only works on HTTPS or localhost (secure context)
  const isSecureContext = typeof window !== 'undefined' &&
    (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  useEffect(() => {
    fetchLogs()
    return () => stopCamera()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await api.get('/gate/logs/')
      setLogs(res.data.results || res.data)
    } catch (err) {
      console.error('Failed to load scan logs', err)
    } finally {
      setLogsLoading(false)
    }
  }

  // Manual QR token submission (works on any network)
  const submitManualToken = async (e) => {
    e.preventDefault()
    if (!manualToken.trim()) return
    setManualLoading(true)
    try {
      const res = await api.post('/gate/scan/', { qr_token: manualToken.trim() })
      setScanResult({ type: res.data.result, data: res.data })
      setManualToken('')
      fetchLogs()
    } catch (err) {
      toast.error('Server error. Check the token and try again.')
    } finally {
      setManualLoading(false)
    }
  }

  const startCamera = async () => {
    if (!isSecureContext) {
      toast.error('Camera requires HTTPS or localhost. Use manual token input below.')
      return
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setStream(s)
      setCameraOn(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        videoRef.current.play()
      }
      // Start scanning loop
      scanIntervalRef.current = setInterval(scanFrame, 250)
    } catch (err) {
      toast.error('Unable to access camera. Check browser permissions.')
      console.error(err)
    }
  }

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (stream) stream.getTracks().forEach(t => t.stop())
    setStream(null)
    setCameraOn(false)
  }, [stream])

  const scanFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code && code.data && code.data !== lastScannedRef.current) {
      lastScannedRef.current = code.data
      // Debounce: reset after 3 seconds
      setTimeout(() => { lastScannedRef.current = null }, 3000)
      handleQRDetected(code.data)
    }
  }

  const handleQRDetected = async (qrToken) => {
    try {
      const res = await api.post('/gate/scan/', { qr_token: qrToken })
      const data = res.data
      setScanResult({ type: data.result, data })
      fetchLogs() // refresh logs
    } catch (err) {
      setScanResult({ type: 'failed', data: { reason: 'Server error. Try again.' } })
    }
  }

  const resetScan = () => {
    setScanResult(null)
    lastScannedRef.current = null
  }

  const isSuccess = scanResult?.type === 'success'

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.25rem' }}>Gate Scanner</h1>
        <p style={{ color: 'var(--text-muted)' }}>Scan resident QR codes to allow or deny entry.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)', gap: '1.5rem' }}>

        {/* Camera Panel */}
        <div>
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ScanLine size={18} color="var(--brand-light)" /> QR Scanner
              </div>
              <button
                className={cameraOn ? 'btn-secondary' : 'btn-primary'}
                onClick={cameraOn ? stopCamera : startCamera}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {cameraOn ? <CameraOff size={15} /> : <Camera size={15} />}
                {cameraOn ? 'Stop' : 'Start Camera'}
              </button>
            </div>

            {/* Video Feed */}
            <div style={{
              position: 'relative', width: '100%', aspectRatio: '1',
              background: 'rgba(0,0,0,0.6)', borderRadius: 12, overflow: 'hidden',
              border: scanResult
                ? `3px solid ${isSuccess ? 'var(--success)' : 'var(--danger)'}`
                : '2px solid var(--border)'
            }}>
              <video
                ref={videoRef}
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {!cameraOn && !scanResult && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                  {!isSecureContext ? (
                    <>
                      <AlertTriangle size={36} color="var(--warning)" opacity={0.7} />
                      <span style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                        Camera unavailable on HTTP.<br />Use <strong>localhost</strong> or the manual input below.
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera size={40} opacity={0.3} />
                      <span style={{ fontSize: '0.85rem' }}>Camera is off</span>
                    </>
                  )}
                </div>
              )}

              {/* Scan overlay guides */}
              {cameraOn && !scanResult && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{
                    width: '60%', aspectRatio: '1',
                    border: '3px solid rgba(255,255,255,0.7)',
                    borderRadius: 8,
                    boxShadow: 'inset 0 0 0 9999px rgba(0,0,0,0.3)',
                  }} />
                </div>
              )}

              {/* Result overlay */}
              {scanResult && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  background: isSuccess ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  padding: '1.5rem'
                }}>
                  {isSuccess
                    ? <CheckCircle size={56} color="var(--success)" style={{ marginBottom: '1rem' }} />
                    : <XCircle size={56} color="var(--danger)" style={{ marginBottom: '1rem' }} />
                  }
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isSuccess ? 'var(--success)' : 'var(--danger)', marginBottom: '0.25rem' }}>
                    {isSuccess ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                  </div>
                  {isSuccess ? (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {scanResult.data.resident?.name} — Room {scanResult.data.resident?.room}, Bed #{scanResult.data.resident?.bed}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{scanResult.data.reason}</div>
                  )}
                  <button onClick={resetScan} className="btn-secondary" style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={15} /> Scan Next
                  </button>
                </div>
              )}
            </div>

            {/* Resident Info Card on success */}
            {isSuccess && scanResult.data.resident && (
              <div style={{
                marginTop: '1rem', padding: '1rem', borderRadius: 10,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}>
                {scanResult.data.resident.photo ? (
                  <img src={scanResult.data.resident.photo} style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} alt="Resident" />
                ) : (
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={24} color="#fff" />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 700 }}>{scanResult.data.resident.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Room {scanResult.data.resident.room} (Floor {scanResult.data.resident.floor}) · Bed #{scanResult.data.resident.bed}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Token Input — works everywhere regardless of HTTPS */}
        <div className="card" style={{ padding: '1.25rem', marginTop: '1rem', gridColumn: '1' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <KeyRound size={16} color="var(--brand-light)" />
            Manual Token Entry
            {!isSecureContext && (
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--warning)', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 100, padding: '0.15rem 0.5rem' }}>
                ⚠️ Use this — camera unavailable on HTTP
              </span>
            )}
          </div>
          <form onSubmit={submitManualToken} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              placeholder="Paste the QR token UUID here…"
              style={{
                flex: 1, padding: '0.6rem 0.9rem',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                borderRadius: 8, color: 'var(--text)', fontSize: '0.85rem',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={manualLoading || !manualToken.trim()}
              style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
            >
              <Send size={14} /> {manualLoading ? 'Checking…' : 'Check'}
            </button>
          </form>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Copy the <strong>qr_token</strong> from the resident's profile page or the allocation record.
          </p>
        </div>

        {/* Scan Logs Panel */}
        <div className="card" style={{ padding: '1.5rem', maxHeight: '75vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Scan Logs</div>
            <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {logsLoading ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Loading logs...</div>
            ) : logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No scan logs yet.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Resident', 'Time', 'Result', 'Reason'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>
                        {log.resident_name || <span style={{ color: 'var(--text-muted)' }}>Unknown</span>}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.scan_time).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700,
                          background: log.result === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                          color: log.result === 'success' ? 'var(--success)' : 'var(--danger)',
                        }}>
                          {log.result === 'success' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {log.result}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{log.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
