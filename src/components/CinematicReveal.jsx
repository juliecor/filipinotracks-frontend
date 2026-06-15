/**
 * Fullscreen cinematic boundary reveal.
 *
 * Plays when the user advances from "Pin Start Point" to the plotted result:
 *   1. fly  — a Google-Earth-style swoop from a wide view down to the lot
 *   2. draw — the boundary traces itself out edge-by-edge
 *   3. done — a best-effort 45° tilt + slow orbit of the finished parcel
 * Closeable any time (X button or Esc); the interactive result sits underneath.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, Polygon, Polyline, Marker, OverlayViewF, OverlayView } from '@react-google-maps/api'
import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { motion, AnimatePresence } from 'framer-motion'
import { GOLD, GOLD_LIGHT, NAVY } from '../theme/theme'
import SuccessBurst from './SuccessBurst'

/** Zoom level that fits the corners within the viewport (fitBounds math). */
function zoomForBounds(corners, wPx, hPx, padding = 140) {
  const lats = corners.map(c => c.lat), lngs = corners.map(c => c.lng)
  const latRad = (lat) => { const s = Math.sin(lat * Math.PI / 180); return Math.log((1 + s) / (1 - s)) / 2 }
  const latFraction = Math.max((latRad(Math.max(...lats)) - latRad(Math.min(...lats))) / Math.PI, 1e-9)
  let lngDiff = Math.max(...lngs) - Math.min(...lngs); if (lngDiff < 0) lngDiff += 360
  const lngFraction = Math.max(lngDiff / 360, 1e-9)
  const WORLD = 256
  const z = (px, frac) => Math.log(Math.max(px - padding, 64) / WORLD / frac) / Math.LN2
  return Math.max(3, Math.min(z(hPx, latFraction), z(wPx, lngFraction), 20))
}

export default function CinematicReveal({ plotted, extracted, onClose }) {
  const corners = plotted.corners
  const nEdges = corners.length - 1
  const mapRef = useRef(null)
  const [phase, setPhase] = useState('fly')   // 'fly' | 'draw' | 'done'
  const [reveal, setReveal] = useState(0)
  const done = phase === 'done'

  const centroid = useMemo(() => {
    const ring = corners.slice(0, -1)
    return {
      lat: ring.reduce((s, c) => s + c.lat, 0) / ring.length,
      lng: ring.reduce((s, c) => s + c.lng, 0) / ring.length,
    }
  }, [corners])

  const target = useMemo(() => zoomForBounds(corners, window.innerWidth, window.innerHeight), [corners])

  // Body scroll lock + Esc to close
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  // Phase 1 — frame the lot once (tiles load fully and stay loaded). The
  // fly-in is a CSS scale-settle on the wrapper, NOT a real camera animation,
  // so satellite tiles never reload mid-flight and never flash black.
  const onLoad = (map) => {
    mapRef.current = map
    try {
      map.setMapTypeId('satellite')
      const b = new window.google.maps.LatLngBounds()
      corners.forEach(c => b.extend(c))
      map.fitBounds(b, 140)
    } catch { /* ignore */ }
  }

  // Phase 2 — trace the boundary
  useEffect(() => {
    if (phase !== 'draw') return
    if (nEdges < 1) { setPhase('done'); return }
    let raf, start
    const total = Math.min(6000, Math.max(2600, nEdges * 700))
    const tick = (t) => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / total)
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      setReveal(eased * nEdges)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setPhase('done')
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, nEdges])

  // Phase 3 — best-effort 45° tilt + slow orbit (only where Google 3D imagery
  // supports it; silently stays top-down otherwise)
  useEffect(() => {
    if (phase !== 'done' || !mapRef.current) return
    const map = mapRef.current
    let raf
    try { map.setTilt(45) } catch { /* ignore */ }
    const tiltOk = (map.getTilt?.() || 0) > 0
    if (tiltOk) {
      let heading = map.getHeading?.() || 0
      const spin = () => {
        heading = (heading + 0.12) % 360
        try { map.setHeading(heading) } catch { /* ignore */ }
        raf = requestAnimationFrame(spin)
      }
      raf = requestAnimationFrame(spin)
    }
    return () => {
      if (raf) cancelAnimationFrame(raf)
      try { map.setTilt(0); map.setHeading(0) } catch { /* ignore */ }
    }
  }, [phase])

  const fullIdx = Math.floor(reveal)
  const drawn = useMemo(() => {
    if (done || phase === 'fly') return null
    const frac = reveal - fullIdx
    const pts = corners.slice(0, fullIdx + 1)
    if (fullIdx < corners.length - 1 && frac > 0) {
      const a = corners[fullIdx], b = corners[fullIdx + 1]
      pts.push({ lat: a.lat + (b.lat - a.lat) * frac, lng: a.lng + (b.lng - a.lng) * frac })
    }
    return pts
  }, [done, phase, reveal, fullIdx, corners])

  const edgeLabels = useMemo(() => (extracted.bearings || []).map((b, i) => {
    const a = corners[i], c = corners[i + 1]
    if (!a || !c) return null
    return {
      key: i,
      pos: { lat: (a.lat + c.lat) / 2, lng: (a.lng + c.lng) / 2 },
      text: `${b.dir1} ${b.degrees}°${String(Math.floor(b.minutes)).padStart(2, '0')}' ${b.dir2} · ${(+b.distance).toLocaleString('en-PH')} m`,
    }
  }).filter(Boolean), [extracted.bearings, corners])

  const title = extracted.title_number || (extracted.lot_number ? `LOT ${extracted.lot_number}` : 'Plotted Lot')
  const visibleLabels = done ? edgeLabels : edgeLabels.filter(e => e.key < fullIdx)
  const progress = phase === 'fly' ? 0 : nEdges > 0 ? Math.min(1, reveal / nEdges) : 1

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      sx={{ position: 'fixed', inset: 0, zIndex: 1500, bgcolor: '#05080F', overflow: 'hidden' }}
    >
      <Box
        component={motion.div}
        initial={{ scale: 2, x: -70, y: -44 }}
        animate={{ scale: 1, x: 0, y: 0 }}
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => setPhase((p) => (p === 'fly' ? 'draw' : p))}
        sx={{ width: '100%', height: '100%', transformOrigin: 'center center' }}
      >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={centroid}
        zoom={target}
        mapTypeId="satellite"
        onLoad={onLoad}
        options={{
          disableDefaultUI: true, gestureHandling: 'none', keyboardShortcuts: false,
          mapTypeId: 'satellite',
        }}
      >
        {!done && drawn && (
          <>
            <Polyline path={drawn} options={{ strokeColor: GOLD, strokeWeight: 5, strokeOpacity: 1 }} />
            {corners.slice(0, Math.min(fullIdx + 1, corners.length - 1)).map((c, i) => (
              <Marker key={i} position={c} label={{ text: String(i + 1), color: NAVY, fontWeight: '800', fontSize: '12px' }} />
            ))}
            {drawn.length > 1 && (
              <Marker
                position={drawn[drawn.length - 1]}
                icon={{ path: window.google?.maps?.SymbolPath?.CIRCLE, scale: 7, fillColor: '#FFF7E0', fillOpacity: 1, strokeColor: GOLD, strokeWeight: 4 }}
              />
            )}
          </>
        )}
        {done && (
          <>
            <Polygon paths={corners} options={{ fillColor: GOLD, fillOpacity: 0.32, strokeColor: GOLD, strokeWeight: 4, strokeOpacity: 1, clickable: false }} />
            {corners.slice(0, -1).map((c, i) => (
              <Marker key={i} position={c} label={{ text: String(i + 1), color: NAVY, fontWeight: '800', fontSize: '12px' }} />
            ))}
          </>
        )}
        {visibleLabels.map((e) => (
          <OverlayViewF key={e.key} position={e.pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}>
            <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: 'rgba(10,22,40,0.88)', border: `1px solid ${GOLD}88`, whiteSpace: 'nowrap' }}>
              <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: GOLD_LIGHT, fontFamily: 'monospace' }}>{e.text}</Typography>
            </Box>
          </OverlayViewF>
        ))}
      </GoogleMap>
      </Box>

      {/* Cinematic vignette */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 220px 60px rgba(5,8,15,0.85)' }} />

      {/* Top bar */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, p: 2,
        display: 'flex', alignItems: 'center', gap: 2,
        background: 'linear-gradient(180deg, rgba(5,8,15,0.85), transparent)',
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, letterSpacing: '0.2em' }}>
            {phase === 'fly' ? 'LOCATING PARCEL' : phase === 'draw' ? 'PLOTTING BOUNDARY' : 'LOT PLOTTED'}
          </Typography>
          <Typography noWrap sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.3rem' }, color: 'white' }}>
            {title}
          </Typography>
        </Box>
        <Tooltip title="Close (Esc)">
          <IconButton
            onClick={onClose}
            sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bottom caption + progress */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, p: 3,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
        background: 'linear-gradient(0deg, rgba(5,8,15,0.9), transparent)',
      }}>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <Button
                onClick={onClose} variant="contained" color="secondary" endIcon={<ArrowForwardIcon />}
                sx={{ fontWeight: 800, px: 4, py: 1.2, borderRadius: 5, fontSize: '0.95rem' }}
              >
                View details
              </Button>
            </motion.div>
          ) : (
            <motion.div key="working" exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Box component={motion.div} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: GOLD, letterSpacing: '0.1em' }}>
                {phase === 'fly' ? 'FLYING TO LOCATION…' : `TRACING BOUNDARY · CORNER ${Math.min(fullIdx + 1, nEdges)} OF ${nEdges}`}
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
        <Box sx={{ width: 'min(420px, 80%)', height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
          <Box sx={{ width: `${progress * 100}%`, height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${GOLD}, #F5E6C4)`, transition: 'width 0.1s linear' }} />
        </Box>
      </Box>

      {done && <SuccessBurst />}
    </Box>
  )
}
