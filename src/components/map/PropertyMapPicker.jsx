import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GoogleMap, Marker, Polygon, Autocomplete, useJsApiLoader,
} from '@react-google-maps/api'
import {
  Box, Button, CircularProgress, Dialog, IconButton, InputAdornment,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import MapIcon from '@mui/icons-material/Map'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { NAVY, GOLD } from '../../theme/theme'
import { GOOGLE_MAPS_LIBRARIES as LIBRARIES } from '../../utils/mapsLibraries'
import { parseCoordinates, formatCoordsDMS } from '../../utils/coordinates'

const PH_CENTER = { lat: 14.5995, lng: 120.9842 }
const ZOOM_PINNED = 19    // closer than 18 so users see parcel-level detail
const ZOOM_DEFAULT = 12

const POLYGON_OPTIONS = {
  fillColor: GOLD,
  fillOpacity: 0.2,
  strokeColor: GOLD,
  strokeOpacity: 0.9,
  strokeWeight: 2,
}

export default function PropertyMapPicker({ lat, lng, polygonPoints = [], onChange }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [mapType, setMapType] = useState('satellite')
  const [fullscreen, setFullscreen] = useState(false)
  const [coordInput, setCoordInput] = useState('')
  const [coordError, setCoordError] = useState(false)
  const [copied, setCopied] = useState(false)

  const mapRef    = useRef(null)
  const fsMapRef  = useRef(null)
  const autoRef   = useRef(null)
  const fsAutoRef = useRef(null)

  const center = lat && lng ? { lat, lng } : PH_CENTER
  const zoom = lat && lng ? ZOOM_PINNED : ZOOM_DEFAULT

  // When entering fullscreen, recenter / refit cleanly
  useEffect(() => {
    if (!fullscreen || !fsMapRef.current || !window.google?.maps) return
    const t = setTimeout(() => {
      if (lat && lng) {
        fsMapRef.current.panTo({ lat, lng })
        fsMapRef.current.setZoom(ZOOM_PINNED)
      } else if (polygonPoints.length > 2) {
        const bounds = new window.google.maps.LatLngBounds()
        polygonPoints.forEach(p => bounds.extend(p))
        fsMapRef.current.fitBounds(bounds, { top: 80, bottom: 80, left: 80, right: 80 })
      }
    }, 120)
    return () => clearTimeout(t)
  }, [fullscreen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = useCallback((e) => {
    onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }, [onChange])

  const handleMarkerDrag = useCallback((e) => {
    onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }, [onChange])

  const handlePlaceChanged = useCallback((useFs = false) => {
    const auto = useFs ? fsAutoRef.current : autoRef.current
    if (!auto) return
    const place = auto.getPlace()
    const loc = place?.geometry?.location
    if (!loc) return
    const newLat = loc.lat()
    const newLng = loc.lng()
    onChange({ lat: newLat, lng: newLng })
    const map = useFs ? fsMapRef.current : mapRef.current
    map?.panTo({ lat: newLat, lng: newLng })
    map?.setZoom(ZOOM_PINNED)
  }, [onChange])

  const handleLocate = useCallback((useFs = false) => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      onChange({ lat: latitude, lng: longitude })
      const map = useFs ? fsMapRef.current : mapRef.current
      map?.panTo({ lat: latitude, lng: longitude })
      map?.setZoom(ZOOM_PINNED)
    })
  }, [onChange])

  const handleClearPin = useCallback(() => {
    onChange({ lat: null, lng: null })
  }, [onChange])

  // ── Coordinates input — accepts DMS or decimal, pans + pins on submit ──
  const handleCoordSubmit = useCallback((useFs = false) => {
    const parsed = parseCoordinates(coordInput)
    if (!parsed) {
      setCoordError(true)
      return
    }
    setCoordError(false)
    onChange(parsed)
    const map = useFs ? fsMapRef.current : mapRef.current
    map?.panTo(parsed)
    map?.setZoom(ZOOM_PINNED)
    setCoordInput('')
  }, [coordInput, onChange])

  const handleCopyDMS = useCallback(async () => {
    if (!(lat && lng)) return
    const text = formatCoordsDMS(lat, lng)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Browsers without clipboard API — fail silently
    }
  }, [lat, lng])

  if (!isLoaded) {
    return (
      <Box sx={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    )
  }

  /* ── Reusable coordinate input row (render function — NOT a component, so React doesn't remount it on each parent render) ── */
  const renderCoordsInputBar = (useFs = false, dense = false) => (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1,
      px: dense ? 1.5 : 2, py: dense ? 1 : 1.2,
      bgcolor: 'background.paper',
      borderTop: 1, borderBottom: 1, borderColor: 'divider',
      flexWrap: 'wrap',
    }}>
      <GpsFixedIcon sx={{ fontSize: 16, color: GOLD, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
        Jump to coordinates
      </Typography>
      <TextField
        size="small"
        value={coordInput}
        onChange={(e) => { setCoordInput(e.target.value); if (coordError) setCoordError(false) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCoordSubmit(useFs) } }}
        error={coordError}
        helperText={coordError ? 'Could not parse — try 9°37\'46.46"N 123°49\'29.97"E or 9.629572, 123.824992' : ' '}
        placeholder={`e.g. 9°37'46.46"N 123°49'29.97"E   or   9.629572, 123.824992`}
        sx={{
          flex: 1, minWidth: 240,
          '& .MuiOutlinedInput-root': { fontSize: '0.82rem', fontFamily: 'monospace' },
          '& .MuiFormHelperText-root': { fontSize: '0.66rem', m: 0, mt: 0.3, lineHeight: 1.3 },
        }}
      />
      <Button
        size="small"
        variant="contained"
        color="secondary"
        onClick={() => handleCoordSubmit(useFs)}
        disabled={!coordInput.trim()}
        sx={{ fontWeight: 700, alignSelf: 'flex-start', mt: '4px' }}
      >
        Go
      </Button>
    </Box>
  )

  /* ── Reusable map overlays (pin marker + optional polygon preview) ── */
  const overlays = (
    <>
      {lat && lng && (
        <Marker
          position={{ lat, lng }}
          draggable
          onDragEnd={handleMarkerDrag}
          animation={window.google?.maps?.Animation?.DROP}
        />
      )}
      {polygonPoints.length > 2 && <Polygon paths={polygonPoints} options={POLYGON_OPTIONS} />}
    </>
  )

  return (
    <Box>
      {/* ── Inline picker ── */}
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
        {/* Search box */}
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10, width: 'calc(100% - 230px)' }}>
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
              placeholder="Search a place or address…"
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 8, border: '1px solid #CBD5E1',
                fontSize: 14, fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                outline: 'none', background: 'white',
              }}
            />
          </Autocomplete>
        </Box>

        {/* Map type toggle + Fullscreen */}
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 0.8 }}>
          <ToggleButtonGroup
            value={mapType}
            exclusive
            onChange={(_, v) => v && setMapType(v)}
            size="small"
            sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 1 }}
          >
            <ToggleButton value="satellite" sx={{ px: 1.5 }}>
              <SatelliteAltIcon sx={{ fontSize: 16, mr: 0.5 }} /> Satellite
            </ToggleButton>
            <ToggleButton value="roadmap" sx={{ px: 1.5 }}>
              <MapIcon sx={{ fontSize: 16, mr: 0.5 }} /> Map
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Open fullscreen for a clearer view">
            <IconButton
              size="small"
              onClick={() => setFullscreen(true)}
              aria-label="Open fullscreen"
              sx={{
                bgcolor: NAVY, color: 'white',
                width: 34, height: 34,
                '&:hover': { bgcolor: '#060E1A' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              }}
            >
              <FullscreenIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Locate me button */}
        <Box sx={{ position: 'absolute', bottom: 70, right: 12, zIndex: 10 }}>
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
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          {overlays}
        </GoogleMap>

        {/* Coordinates input row */}
        {renderCoordsInputBar(false, true)}

        {/* Hint + pin readout (decimal + DMS + copy) */}
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            🎯 Click to place a pin · Drag to fine-tune · Or paste coordinates above
          </Typography>
          {lat && lng && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.disabled', lineHeight: 1.3 }}>
                  {lat.toFixed(6)}, {lng.toFixed(6)}
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600, lineHeight: 1.3 }}>
                  {formatCoordsDMS(lat, lng)}
                </Typography>
              </Box>
              <Tooltip title={copied ? 'Copied!' : 'Copy DMS coordinates'}>
                <IconButton size="small" onClick={handleCopyDMS}
                  sx={{ bgcolor: `${GOLD}1A`, color: 'text.primary', '&:hover': { bgcolor: `${GOLD}33` } }}>
                  <ContentCopyIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Fullscreen dialog ── */}
      <Dialog
        fullScreen
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        PaperProps={{ sx: { m: 0, bgcolor: 'background.paper' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          {/* Header */}
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
                FILIPINOTRACKS · PIN PROPERTY LOCATION
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
                Drop a pin on your property
              </Typography>
            </Box>
          </Box>

          {/* Toolbar */}
          <Box sx={{
            px: 2, py: 1.2, display: 'flex', flexWrap: 'wrap', gap: 1.5,
            alignItems: 'center', justifyContent: 'space-between',
            borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper',
          }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.5, borderRadius: 1.5, bgcolor: `${GOLD}1A`, border: `1px solid ${GOLD}55` }}>
              <LocationOnIcon sx={{ fontSize: 16, color: GOLD }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.primary' }}>
                {lat && lng
                  ? `Pin at ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                  : 'Click anywhere on the map to drop a pin'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.8 }}>
              {lat && lng && (
                <Tooltip title="Clear pin">
                  <IconButton size="small" onClick={handleClearPin}
                    sx={{ bgcolor: 'action.hover', color: 'error.main', '&:hover': { bgcolor: 'error.light' } }}>
                    <DeleteSweepIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              )}
              <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small">
                <ToggleButton value="satellite" sx={{ px: 1, fontSize: '0.72rem' }}>
                  <SatelliteAltIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
                <ToggleButton value="roadmap" sx={{ px: 1, fontSize: '0.72rem' }}>
                  <MapIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                onClick={() => setFullscreen(false)}
                sx={{ fontWeight: 700, ml: 0.5 }}
              >
                Done
              </Button>
            </Box>
          </Box>

          {/* Map */}
          <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
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
                  placeholder="Search a place to jump to…"
                  style={{
                    width: '100%', padding: '10px 14px',
                    borderRadius: 8, border: '1px solid #CBD5E1',
                    fontSize: 14, fontFamily: 'inherit',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    outline: 'none', background: 'white',
                  }}
                />
              </Autocomplete>
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
                zoomControl: true,
              }}
            >
              {overlays}
            </GoogleMap>
          </Box>

          {/* Coordinates input row */}
          {renderCoordsInputBar(true, false)}

          {/* Bottom hint + DMS readout + copy */}
          <Box sx={{
            px: 2, py: 1.5, bgcolor: 'background.default',
            borderTop: 1, borderColor: 'divider',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 1.5,
          }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              🎯 Click to drop the pin · Drag to fine-tune · Or paste coordinates above · Click <strong>Done</strong> when finished
            </Typography>
            {lat && lng && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.disabled', lineHeight: 1.3 }}>
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, lineHeight: 1.3 }}>
                    {formatCoordsDMS(lat, lng)}
                  </Typography>
                </Box>
                <Tooltip title={copied ? 'Copied!' : 'Copy DMS coordinates'}>
                  <IconButton size="small" onClick={handleCopyDMS}
                    sx={{ bgcolor: `${GOLD}1A`, color: 'text.primary', '&:hover': { bgcolor: `${GOLD}33` } }}>
                    <ContentCopyIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
