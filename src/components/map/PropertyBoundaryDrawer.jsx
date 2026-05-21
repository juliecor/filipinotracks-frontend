import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GoogleMap, Marker, Polygon, Autocomplete, useJsApiLoader,
} from '@react-google-maps/api'
import {
  Box, Button, CircularProgress, Dialog, IconButton, ToggleButton, ToggleButtonGroup,
  Tooltip, Typography,
} from '@mui/material'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import MapIcon from '@mui/icons-material/Map'
import UndoIcon from '@mui/icons-material/Undo'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import { GOLD, NAVY } from '../../theme/theme'

const LIBRARIES = ['places']
const PH_CENTER = { lat: 14.5995, lng: 120.9842 }

// Higher default zoom so users see parcel-level detail
const ZOOM_WITH_CENTER = 19
const ZOOM_DEFAULT     = 12

const POLYGON_OPTIONS = {
  fillColor: GOLD,
  fillOpacity: 0.22,
  strokeColor: GOLD,
  strokeOpacity: 0.95,
  strokeWeight: 2.5,
  editable: false,
  draggable: false,
}

/**
 * Interactive polygon drawer with fullscreen mode.
 *
 * Props:
 *  - centerLat / centerLng: optional initial map center (e.g. user's pin)
 *  - points: array of { lat, lng } — the current polygon vertices
 *  - onChange(nextPoints): callback when user adds / moves / removes vertices
 */
export default function PropertyBoundaryDrawer({
  centerLat,
  centerLng,
  points = [],
  onChange,
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [mapType, setMapType]       = useState('hybrid')
  const [fullscreen, setFullscreen] = useState(false)

  const mapRef      = useRef(null)
  const fsMapRef    = useRef(null)
  const autoRef     = useRef(null)
  const fsAutoRef   = useRef(null)

  const center = (centerLat && centerLng)
    ? { lat: centerLat, lng: centerLng }
    : (points[0] || PH_CENTER)
  const zoom = (centerLat || points.length) ? ZOOM_WITH_CENTER : ZOOM_DEFAULT

  // When entering fullscreen, auto-fit to existing polygon (if any) for the best view
  useEffect(() => {
    if (!fullscreen || !fsMapRef.current || !window.google?.maps) return
    const timer = setTimeout(() => {
      if (points.length >= 3) {
        const bounds = new window.google.maps.LatLngBounds()
        points.forEach(p => bounds.extend(p))
        fsMapRef.current.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 })
      } else if (centerLat && centerLng) {
        fsMapRef.current.panTo({ lat: centerLat, lng: centerLng })
        fsMapRef.current.setZoom(ZOOM_WITH_CENTER)
      }
    }, 120)
    return () => clearTimeout(timer)
  }, [fullscreen, points, centerLat, centerLng])

  const handleMapClick = useCallback((e) => {
    const next = [...points, { lat: e.latLng.lat(), lng: e.latLng.lng() }]
    onChange(next)
  }, [points, onChange])

  const handleVertexDrag = useCallback((index, latLng) => {
    const next = points.map((p, i) =>
      i === index ? { lat: latLng.lat(), lng: latLng.lng() } : p
    )
    onChange(next)
  }, [points, onChange])

  const undoLast = useCallback(() => {
    if (!points.length) return
    onChange(points.slice(0, -1))
  }, [points, onChange])

  const clearAll = useCallback(() => onChange([]), [onChange])

  const handlePlaceChanged = useCallback((useFs = false) => {
    const auto = useFs ? fsAutoRef.current : autoRef.current
    if (!auto) return
    const place = auto.getPlace()
    const loc = place?.geometry?.location
    if (!loc) return
    const map = useFs ? fsMapRef.current : mapRef.current
    map?.panTo({ lat: loc.lat(), lng: loc.lng() })
    map?.setZoom(ZOOM_WITH_CENTER)
  }, [])

  const handleLocate = useCallback((useFs = false) => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      const map = useFs ? fsMapRef.current : mapRef.current
      map?.panTo({ lat: latitude, lng: longitude })
      map?.setZoom(ZOOM_WITH_CENTER)
    })
  }, [])

  if (!isLoaded) {
    return (
      <Box sx={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    )
  }

  /* ────────────────────────────────────────────────────────────
     Reusable: vertex markers + polygon (works in both views)
     ──────────────────────────────────────────────────────────── */
  const mapOverlays = (
    <>
      {points.map((p, i) => (
        <Marker
          key={i}
          position={p}
          draggable
          onDragEnd={(e) => handleVertexDrag(i, e.latLng)}
          label={{
            text: String(i + 1),
            color: NAVY,
            fontSize: '11px',
            fontWeight: '700',
          }}
        />
      ))}
      {points.length >= 3 && <Polygon paths={points} options={POLYGON_OPTIONS} />}
    </>
  )

  /* ────────────────────────────────────────────────────────────
     Reusable: toolbar (status pill + actions)
     ──────────────────────────────────────────────────────────── */
  const Toolbar = ({ onFullscreen, onExitFullscreen, useFs = false }) => (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 1.5, flexWrap: 'wrap',
      ...(useFs ? { px: 2, py: 1.2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' } : { mb: 1.5 }),
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.6,
          px: 1.2, py: 0.5, borderRadius: 1.5,
          bgcolor: `${GOLD}1A`, border: `1px solid ${GOLD}55`,
        }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD }} />
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.primary' }}>
            {points.length} {points.length === 1 ? 'vertex' : 'vertices'}
          </Typography>
        </Box>
        {points.length < 3 && (
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
            Need at least 3 to form a boundary
          </Typography>
        )}
        {points.length >= 3 && (
          <Typography sx={{ fontSize: '0.72rem', color: 'success.main', fontWeight: 700 }}>
            ✓ Boundary visible
          </Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 0.8 }}>
        <Tooltip title="Undo last point">
          <span>
            <IconButton size="small" onClick={undoLast} disabled={!points.length} aria-label="Undo last vertex"
              sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' }, '&.Mui-disabled': { opacity: 0.4 } }}>
              <UndoIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Clear all">
          <span>
            <IconButton size="small" onClick={clearAll} disabled={!points.length} aria-label="Clear all vertices"
              sx={{ bgcolor: 'action.hover', color: 'error.main', '&:hover': { bgcolor: 'error.light' }, '&.Mui-disabled': { opacity: 0.4 } }}>
              <DeleteSweepIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </span>
        </Tooltip>
        {!useFs && (
          <Tooltip title="Open fullscreen for clearer drawing">
            <IconButton
              size="small"
              onClick={onFullscreen}
              aria-label="Open fullscreen drawing"
              sx={{
                bgcolor: NAVY, color: 'white',
                '&:hover': { bgcolor: '#060E1A' },
                ml: 0.5,
              }}
            >
              <FullscreenIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        )}
        {useFs && (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={onExitFullscreen}
            sx={{ fontWeight: 700, ml: 0.5 }}
          >
            Done
          </Button>
        )}
      </Box>
    </Box>
  )

  return (
    <Box>
      {/* Toolbar */}
      <Toolbar onFullscreen={() => setFullscreen(true)} />

      {/* Inline map */}
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10, width: 'calc(100% - 180px)' }}>
          <Autocomplete
            onLoad={ref => (autoRef.current = ref)}
            onPlaceChanged={() => handlePlaceChanged(false)}
            options={{
              componentRestrictions: { country: 'ph' },
              fields: ['geometry.location', 'name', 'formatted_address'],
            }}
          >
            <input
              type="text"
              placeholder="Search a place, address, or landmark…"
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 8, border: '1px solid #CBD5E1',
                fontSize: 14, fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                outline: 'none',
                background: 'white',
              }}
            />
          </Autocomplete>
        </Box>

        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
          <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small"
            sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 1 }}>
            <ToggleButton value="hybrid" sx={{ px: 1.5 }}>
              <SatelliteAltIcon sx={{ fontSize: 16, mr: 0.5 }} /> Satellite
            </ToggleButton>
            <ToggleButton value="roadmap" sx={{ px: 1.5 }}>
              <MapIcon sx={{ fontSize: 16, mr: 0.5 }} /> Map
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ position: 'absolute', bottom: 100, right: 12, zIndex: 10 }}>
          <Button variant="contained" size="small" onClick={() => handleLocate(false)}
            startIcon={<MyLocationIcon sx={{ fontSize: 15 }} />}
            sx={{ bgcolor: 'white', color: NAVY, fontWeight: 700, fontSize: '0.75rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)', '&:hover': { bgcolor: '#F8FAFC' } }}>
            My Location
          </Button>
        </Box>

        <GoogleMap
          mapContainerStyle={{ width: '100%', height: 420 }}
          center={center}
          zoom={zoom}
          mapTypeId={mapType}
          onClick={handleMapClick}
          onLoad={ref => (mapRef.current = ref)}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            draggableCursor: 'crosshair',
          }}
        >
          {mapOverlays}
        </GoogleMap>

        <Box sx={{
          px: 2, py: 1, bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1,
        }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            🎯 Click on the map to add a vertex · Drag numbered pins to adjust · Tap fullscreen for a bigger canvas
          </Typography>
          {points.length > 0 && (
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
              Last: {points[points.length - 1].lat.toFixed(5)}, {points[points.length - 1].lng.toFixed(5)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── FULLSCREEN DRAWING DIALOG ── */}
      <Dialog
        fullScreen
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        PaperProps={{ sx: { bgcolor: 'background.paper', m: 0 } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          {/* Top bar */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.2, bgcolor: NAVY, color: 'white',
            borderBottom: `2px solid ${GOLD}`,
          }}>
            <Tooltip title="Close fullscreen">
              <IconButton
                onClick={() => setFullscreen(false)}
                aria-label="Close fullscreen"
                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, letterSpacing: '0.14em' }}>
                FILIPINOTRACKS · BOUNDARY DRAWING
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
                Draw the property boundary
              </Typography>
            </Box>
          </Box>

          {/* Toolbar */}
          <Toolbar useFs onExitFullscreen={() => setFullscreen(false)} />

          {/* Map */}
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10, width: 'min(420px, calc(100% - 200px))' }}>
              <Autocomplete
                onLoad={ref => (fsAutoRef.current = ref)}
                onPlaceChanged={() => handlePlaceChanged(true)}
                options={{
                  componentRestrictions: { country: 'ph' },
                  fields: ['geometry.location', 'name', 'formatted_address'],
                }}
              >
                <input
                  type="text"
                  placeholder="Search a place, address, or landmark…"
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: 8, border: '1px solid #CBD5E1',
                    fontSize: 14, fontFamily: 'inherit',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    outline: 'none',
                    background: 'white',
                  }}
                />
              </Autocomplete>
            </Box>

            <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
              <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small"
                sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 1 }}>
                <ToggleButton value="hybrid" sx={{ px: 1.5 }}>
                  <SatelliteAltIcon sx={{ fontSize: 16, mr: 0.5 }} /> Satellite
                </ToggleButton>
                <ToggleButton value="roadmap" sx={{ px: 1.5 }}>
                  <MapIcon sx={{ fontSize: 16, mr: 0.5 }} /> Map
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ position: 'absolute', bottom: 24, right: 12, zIndex: 10 }}>
              <Button variant="contained" size="small" onClick={() => handleLocate(true)}
                startIcon={<MyLocationIcon sx={{ fontSize: 15 }} />}
                sx={{ bgcolor: 'white', color: NAVY, fontWeight: 700, fontSize: '0.78rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)', '&:hover': { bgcolor: '#F8FAFC' } }}>
                My Location
              </Button>
            </Box>

            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={center}
              zoom={zoom}
              mapTypeId={mapType}
              onClick={handleMapClick}
              onLoad={ref => (fsMapRef.current = ref)}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                draggableCursor: 'crosshair',
                zoomControl: true,
              }}
            >
              {mapOverlays}
            </GoogleMap>
          </Box>

          {/* Bottom hint */}
          <Box sx={{
            px: 2, py: 1.5, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5,
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              🎯 Click anywhere on the map to add a vertex · Drag pins to adjust · Click <strong>Done</strong> when finished
            </Typography>
            {points.length > 0 && (
              <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.disabled' }}>
                Last vertex: {points[points.length - 1].lat.toFixed(6)}, {points[points.length - 1].lng.toFixed(6)}
              </Typography>
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
