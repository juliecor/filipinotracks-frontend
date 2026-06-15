/**
 * Fullscreen cinematic boundary reveal.
 *
 * Plays when the user advances from "Pin Start Point" to the plotted result:
 * the lot traces itself out slowly over a full-screen satellite view, like a
 * surveyor walking the boundary. Closeable any time (X button or Esc); when it
 * finishes (or is closed) the normal interactive result sits underneath.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { GoogleMap, Polygon, Polyline, Marker, OverlayViewF, OverlayView } from '@react-google-maps/api'
import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { motion, AnimatePresence } from 'framer-motion'
import { GOLD, GOLD_LIGHT, NAVY } from '../theme/theme'
import SuccessBurst from './SuccessBurst'

export default function CinematicReveal({ plotted, extracted, onClose }) {
  const corners = plotted.corners
  const nEdges = corners.length - 1
  const mapRef = useRef(null)

  const [reveal, setReveal] = useState(0)
  const [done, setDone] = useState(false)

  // Slow, eased trace (~0.7s per edge, clamped 2.6–6s total)
  useEffect(() => {
    if (nEdges < 1) { setDone(true); return }
    let raf, start
    const total = Math.min(6000, Math.max(2600, nEdges * 700))
    const tick = (t) => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / total)
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      setReveal(eased * nEdges)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setDone(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [nEdges])

  // Lock body scroll + Esc to close
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  const fullIdx = Math.floor(reveal)

  const drawn = useMemo(() => {
    if (done) return null
    const frac = reveal - fullIdx
    const pts = corners.slice(0, fullIdx + 1)
    if (fullIdx < corners.length - 1 && frac > 0) {
      const a = corners[fullIdx], b = corners[fullIdx + 1]
      pts.push({ lat: a.lat + (b.lat - a.lat) * frac, lng: a.lng + (b.lng - a.lng) * frac })
    }
    return pts
  }, [done, reveal, fullIdx, corners])

  const edgeLabels = useMemo(() => (extracted.bearings || []).map((b, i) => {
    const a = corners[i], c = corners[i + 1]
    if (!a || !c) return null
    return {
      key: i,
      pos: { lat: (a.lat + c.lat) / 2, lng: (a.lng + c.lng) / 2 },
      text: `${b.dir1} ${b.degrees}°${String(Math.floor(b.minutes)).padStart(2, '0')}' ${b.dir2} · ${(+b.distance).toLocaleString('en-PH')} m`,
    }
  }).filter(Boolean), [extracted.bearings, corners])

  const fitBounds = (map) => {
    mapRef.current = map
    map.setMapTypeId('satellite')
    const b = new window.google.maps.LatLngBounds()
    corners.forEach(c => b.extend(c))
    map.fitBounds(b, 110)
  }

  const title = extracted.title_number || (extracted.lot_number ? `LOT ${extracted.lot_number}` : 'Plotted Lot')
  const visibleLabels = done ? edgeLabels : edgeLabels.filter(e => e.key < fullIdx)
  const progress = nEdges > 0 ? Math.min(1, reveal / nEdges) : 1

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      sx={{ position: 'fixed', inset: 0, zIndex: 1500, bgcolor: '#05080F' }}
    >
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={corners[0]}
        zoom={19}
        mapTypeId="satellite"
        onLoad={fitBounds}
        options={{
          disableDefaultUI: true, gestureHandling: 'none', keyboardShortcuts: false,
          mapTypeId: 'satellite', backgroundColor: '#05080F',
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
            PLOTTING BOUNDARY
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
            <motion.div key="tracing" exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Box component={motion.div} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: GOLD, letterSpacing: '0.1em' }}>
                TRACING BOUNDARY · CORNER {Math.min(fullIdx + 1, nEdges)} OF {nEdges}
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
