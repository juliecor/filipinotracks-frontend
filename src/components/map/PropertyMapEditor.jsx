import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Button, Dialog, DialogActions, IconButton, Tooltip, Typography,
  ToggleButton, ToggleButtonGroup, CircularProgress, Alert,
} from '@mui/material'
import {
  GoogleMap, Marker, Polygon, Autocomplete, useJsApiLoader,
} from '@react-google-maps/api'
import CloseIcon from '@mui/icons-material/Close'
import UndoIcon from '@mui/icons-material/Undo'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PolylineIcon from '@mui/icons-material/Polyline'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import MapIcon from '@mui/icons-material/Map'
import SaveIcon from '@mui/icons-material/Save'
import { GOLD, NAVY } from '../../theme/theme'
import api from '../../api/axios'

const LIBRARIES = ['places']
const PH_CENTER = { lat: 14.5995, lng: 120.9842 }

const POLYGON_OPTIONS = {
  fillColor: GOLD, fillOpacity: 0.22, strokeColor: GOLD, strokeOpacity: 0.95, strokeWeight: 2.5,
}

function geojsonToPoints(geojson) {
  const coords = geojson?.geometry?.coordinates?.[0]
  if (!coords || coords.length < 3) return []
  return coords.map(([lo, la]) => ({ lat: la, lng: lo }))
}

function pointsToGeojson(points) {
  if (points.length < 3) return null
  const coords = points.map(p => [p.lng, p.lat])
  coords.push(coords[0]) // close ring
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}

/**
 * Staff/Admin Property Map Editor.
 *
 * Lets a verifying officer set the pin coordinates and/or draw the polygon
 * for a transaction, then PUTs the result to the property-map endpoint.
 *
 * Props:
 *  - open: boolean
 *  - onClose(): close dialog
 *  - transactionId: number
 *  - initialPin: { lat, lng } | null
 *  - initialPolygon: GeoJSON Feature | null
 *  - onSaved(updatedMap): called with the saved map data
 */
export default function PropertyMapEditor({
  open, onClose, transactionId, initialPin, initialPolygon, onSaved,
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [mode, setMode]       = useState('pin')      // 'pin' | 'draw'
  const [mapType, setMapType] = useState('satellite')
  const [pin, setPin]         = useState(initialPin)
  const [points, setPoints]   = useState(geojsonToPoints(initialPolygon))
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const mapRef = useRef(null)
  const autoRef = useRef(null)

  // Reset state when dialog opens with new data
  useEffect(() => {
    if (!open) return
    setPin(initialPin || null)
    setPoints(geojsonToPoints(initialPolygon))
    setError('')
  }, [open, initialPin, initialPolygon])

  const center = pin || points[0] || PH_CENTER
  const zoom = (pin || points.length) ? 19 : 12

  // Fit map to existing polygon when opening
  useEffect(() => {
    if (!open || !mapRef.current || !window.google?.maps) return
    const t = setTimeout(() => {
      if (points.length >= 3) {
        const bounds = new window.google.maps.LatLngBounds()
        points.forEach(p => bounds.extend(p))
        mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 })
      } else if (pin) {
        mapRef.current.panTo(pin)
        mapRef.current.setZoom(19)
      }
    }, 150)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = useCallback((e) => {
    const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    if (mode === 'pin') setPin(latLng)
    else setPoints(prev => [...prev, latLng])
  }, [mode])

  const handleVertexDrag = useCallback((index, e) => {
    setPoints(prev => prev.map((p, i) =>
      i === index ? { lat: e.latLng.lat(), lng: e.latLng.lng() } : p
    ))
  }, [])

  const handlePinDrag = (e) => setPin({ lat: e.latLng.lat(), lng: e.latLng.lng() })

  const undoLast = () => setPoints(prev => prev.slice(0, -1))
  const clearPolygon = () => setPoints([])
  const clearPin = () => setPin(null)

  const handlePlaceChanged = () => {
    const place = autoRef.current?.getPlace()
    const loc = place?.geometry?.location
    if (!loc) return
    mapRef.current?.panTo({ lat: loc.lat(), lng: loc.lng() })
    mapRef.current?.setZoom(19)
  }

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      mapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      mapRef.current?.setZoom(19)
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const { data } = await api.put(`/transactions/${transactionId}/property-map`, {
        latitude:  pin?.lat ?? null,
        longitude: pin?.lng ?? null,
        geojson_polygon: pointsToGeojson(points),
      })
      onSaved?.(data)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save property map.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog fullScreen open={open} onClose={onClose} PaperProps={{ sx: { m: 0 } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 2, py: 1.2, bgcolor: NAVY, color: 'white', borderBottom: `2px solid ${GOLD}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Close">
            <IconButton onClick={onClose} disabled={saving} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, letterSpacing: '0.14em' }}>
              FILIPINOTRACKS · STAFF VERIFICATION
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
              Edit Property Map
            </Typography>
          </Box>
        </Box>

        {/* Toolbar */}
        <Box sx={{ px: 2, py: 1.2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => v && setMode(v)}
              size="small"
            >
              <ToggleButton value="pin" sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
                <LocationOnIcon sx={{ fontSize: 16, mr: 0.5 }} /> Pin
              </ToggleButton>
              <ToggleButton value="draw" sx={{ px: 1.5, fontSize: '0.75rem', fontWeight: 700 }}>
                <PolylineIcon sx={{ fontSize: 16, mr: 0.5 }} /> Draw
              </ToggleButton>
            </ToggleButtonGroup>

            {mode === 'pin' ? (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.5, borderRadius: 1.5, bgcolor: `${GOLD}1A`, border: `1px solid ${GOLD}55` }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.primary' }}>
                  {pin ? `Pin set at ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : 'Click map to drop pin'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.5, borderRadius: 1.5, bgcolor: `${GOLD}1A`, border: `1px solid ${GOLD}55` }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.primary' }}>
                  {points.length} {points.length === 1 ? 'vertex' : 'vertices'}
                  {points.length >= 3 ? ' · Boundary visible' : ''}
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.8 }}>
            {mode === 'draw' ? (
              <>
                <Tooltip title="Undo last vertex">
                  <span><IconButton size="small" onClick={undoLast} disabled={!points.length}
                    sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                    <UndoIcon sx={{ fontSize: 17 }} />
                  </IconButton></span>
                </Tooltip>
                <Tooltip title="Clear polygon">
                  <span><IconButton size="small" onClick={clearPolygon} disabled={!points.length}
                    sx={{ bgcolor: 'action.hover', color: 'error.main' }}>
                    <DeleteSweepIcon sx={{ fontSize: 17 }} />
                  </IconButton></span>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Clear pin">
                <span><IconButton size="small" onClick={clearPin} disabled={!pin}
                  sx={{ bgcolor: 'action.hover', color: 'error.main' }}>
                  <DeleteSweepIcon sx={{ fontSize: 17 }} />
                </IconButton></span>
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
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ borderRadius: 0 }}>{error}</Alert>}

        {/* Map */}
        <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {isLoaded ? (
            <>
              <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10, width: 'min(420px, calc(100% - 200px))' }}>
                <Autocomplete
                  onLoad={ref => (autoRef.current = ref)}
                  onPlaceChanged={handlePlaceChanged}
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
                <Button variant="contained" size="small" onClick={handleLocate}
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
                onLoad={ref => (mapRef.current = ref)}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  draggableCursor: 'crosshair',
                  zoomControl: true,
                }}
              >
                {pin && (
                  <Marker
                    position={pin}
                    draggable
                    onDragEnd={handlePinDrag}
                    icon={mode === 'pin' && window.google?.maps ? {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      fillColor: GOLD,
                      fillOpacity: 1,
                      strokeColor: NAVY,
                      strokeWeight: 2,
                      scale: 9,
                    } : undefined}
                  />
                )}
                {points.map((p, i) => (
                  <Marker
                    key={i}
                    position={p}
                    draggable
                    onDragEnd={(e) => handleVertexDrag(i, e)}
                    label={{
                      text: String(i + 1),
                      color: NAVY,
                      fontSize: '11px',
                      fontWeight: '700',
                    }}
                  />
                ))}
                {points.length >= 3 && <Polygon paths={points} options={POLYGON_OPTIONS} />}
              </GoogleMap>
            </>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
              <CircularProgress sx={{ color: GOLD }} />
            </Box>
          )}
        </Box>

        {/* Actions */}
        <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Button onClick={onClose} disabled={saving} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: NAVY }} /> : <SaveIcon />}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {saving ? 'Saving…' : 'Save Property Map'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
