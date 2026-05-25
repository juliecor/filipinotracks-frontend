import { useRef, useState } from 'react'
import {
  GoogleMap, Marker, Polygon, useJsApiLoader, InfoWindow,
} from '@react-google-maps/api'
import {
  Box, Button, CircularProgress, ToggleButton, ToggleButtonGroup, Typography, Chip,
  IconButton, Dialog, Tooltip, Divider,
} from '@mui/material'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import MapIcon from '@mui/icons-material/Map'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { NAVY, GOLD } from '../../theme/theme'

const LIBRARIES = ['places']

const POLYGON_OPTIONS = {
  fillColor: GOLD,
  fillOpacity: 0.2,
  strokeColor: GOLD,
  strokeOpacity: 0.9,
  strokeWeight: 2,
}

const POLYGON_OPTIONS_FS = {
  ...POLYGON_OPTIONS,
  fillOpacity: 0.25,
  strokeWeight: 2.5,
}

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <Box sx={{ py: 1.2, borderBottom: '1px solid #F1F5F9' }}>
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.3 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', textTransform: 'capitalize', lineHeight: 1.4 }}>
        {value}
      </Typography>
    </Box>
  )
}

export default function PropertyMapViewer({ propertyMap }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [mapType, setMapType]   = useState('satellite')
  const [infoOpen, setInfoOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const mapRef   = useRef(null)
  const fsMapRef = useRef(null)

  if (!propertyMap) return null

  const {
    latitude: lat, longitude: lng, geojson_polygon,
    registered_owner, title_number, lot_number, block_number,
    survey_plan_number, tax_declaration_number, property_type,
    land_area, province, city_municipality, barangay, full_address,
    staff_notes, boundaries,
  } = propertyMap

  const hasLocation = !!(lat && lng)
  const center      = hasLocation ? { lat, lng } : { lat: 14.5995, lng: 120.9842 }
  const zoom        = hasLocation ? 18 : 12

  let polygonPoints = []
  if (geojson_polygon?.geometry?.coordinates?.[0]) {
    polygonPoints = geojson_polygon.geometry.coordinates[0].map(([lo, la]) => ({ lat: la, lng: lo }))
  }

  const hasPolygon     = polygonPoints.length > 2
  const googleMapsUrl  = hasLocation ? `https://www.google.com/maps?q=${lat},${lng}` : null
  const hasBoundaries  = boundaries?.some(b => b.degrees)

  if (!isLoaded) {
    return (
      <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9' }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    )
  }

  if (!hasLocation && !polygonPoints.length) {
    return (
      <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC', border: '1.5px dashed #E2E8F0' }}>
        <MapIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
        <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>No location pinned yet</Typography>
        <Typography variant="caption" sx={{ color: '#CBD5E1' }}>The client has not provided map coordinates</Typography>
      </Box>
    )
  }

  /* ── shared map controls bar ── */
  function MapControls({ onFullscreen, isFullscreen }) {
    return (
      <>
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', gap: 1 }}>
          <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small"
            sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', borderRadius: 1 }}>
            <ToggleButton value="satellite" sx={{ px: 1.5, fontSize: '0.72rem', fontWeight: 700 }}>
              <SatelliteAltIcon sx={{ fontSize: 15, mr: 0.5 }} /> Satellite
            </ToggleButton>
            <ToggleButton value="roadmap" sx={{ px: 1.5, fontSize: '0.72rem', fontWeight: 700 }}>
              <MapIcon sx={{ fontSize: 15, mr: 0.5 }} /> Map
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 1 }}>
          {googleMapsUrl && (
            <Button variant="contained" size="small" component="a" href={googleMapsUrl} target="_blank"
              startIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
              sx={{ bgcolor: 'white', color: NAVY, fontWeight: 700, fontSize: '0.72rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)', '&:hover': { bgcolor: '#F8FAFC' }, textTransform: 'none' }}>
              Google Maps
            </Button>
          )}
          <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen view'}>
            <IconButton onClick={onFullscreen} size="small"
              sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', borderRadius: 1,
                '&:hover': { bgcolor: '#F8FAFC' }, width: 36, height: 36 }}>
              {isFullscreen
                ? <CloseIcon sx={{ fontSize: 18, color: NAVY }} />
                : <FullscreenIcon sx={{ fontSize: 18, color: NAVY }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </>
    )
  }

  /* ── property details panel (used in fullscreen) ── */
  function DetailsPanel() {
    return (
      <Box sx={{
        width: { xs: '100%', md: 360 }, flexShrink: 0,
        height: '100%', overflowY: 'auto', bgcolor: 'white',
        borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 4 },
      }}>
        {/* Panel header */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #EEF2F7', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HomeWorkIcon sx={{ fontSize: 18, color: NAVY }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', mb: 0.3 }}>
              FilipinoTracks
            </Typography>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {registered_owner || 'Property Details'}
            </Typography>
            {title_number && (
              <Typography variant="caption" sx={{ color: '#94A3B8', fontFamily: 'monospace' }}>
                {title_number}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Status chips */}
        <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', borderBottom: '1px solid #F1F5F9' }}>
          {hasLocation && (
            <Chip label="Location Pinned" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '0.65rem' }} />
          )}
          {hasPolygon && (
            <Chip label={`Boundary: ${polygonPoints.length - 1} pts`} size="small" sx={{ bgcolor: `${GOLD}20`, color: '#A8882A', fontWeight: 700, fontSize: '0.65rem' }} />
          )}
        </Box>

        {/* Detail fields */}
        <Box sx={{ px: 3, py: 1, flex: 1 }}>
          <DetailRow label="Registered Owner"    value={registered_owner} />
          <DetailRow label="Title Number"        value={title_number} />
          <DetailRow label="Lot Number"          value={lot_number} />
          <DetailRow label="Block Number"        value={block_number} />
          <DetailRow label="Survey Plan"         value={survey_plan_number} />
          <DetailRow label="Tax Declaration"     value={tax_declaration_number} />
          <DetailRow label="Property Type"       value={property_type} />
          <DetailRow label="Land Area"           value={land_area ? `${land_area} sqm` : null} />
          <DetailRow label="Province"            value={province} />
          <DetailRow label="City / Municipality" value={city_municipality} />
          <DetailRow label="Barangay"            value={barangay} />
          <DetailRow label="Full Address"        value={full_address} />
        </Box>

        {/* Coordinates */}
        {hasLocation && (
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOnIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
            <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: '#64748B' }}>
              {lat?.toFixed(6)}, {lng?.toFixed(6)}
            </Typography>
          </Box>
        )}

        {/* Staff notes */}
        {staff_notes && (
          <Box sx={{ mx: 3, mb: 2, p: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 2 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>Staff Notes</Typography>
            <Typography variant="caption" sx={{ color: '#78350F', lineHeight: 1.6 }}>{staff_notes}</Typography>
          </Box>
        )}

        {/* Technical description */}
        {hasBoundaries && (
          <Box sx={{ px: 3, pb: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
              Technical Description
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {boundaries.filter(b => b.degrees).map((b, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1.5, py: 0.8, bgcolor: i % 2 === 0 ? '#F8FAFC' : 'white', borderRadius: 1 }}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                    {b.point_from || i + 1} → {b.point_to || i + 2}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: NAVY, fontWeight: 700 }}>
                    {b.dir1} {b.degrees}°{b.minutes ? ` ${b.minutes}'` : ''} {b.dir2}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                    {b.distance}m
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    )
  }

  /* ── Normal inline view ── */
  return (
    <>
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <MapControls onFullscreen={() => setFullscreen(true)} isFullscreen={false} />
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: 520 }}
          center={center}
          zoom={zoom}
          mapTypeId={mapType}
          onLoad={ref => (mapRef.current = ref)}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true }}
        >
          {hasLocation && !hasPolygon && (
            <Marker position={{ lat, lng }} onClick={() => setInfoOpen(true)}>
              {infoOpen && (
                <InfoWindow onCloseClick={() => setInfoOpen(false)}>
                  <Box sx={{ p: 0.5, minWidth: 160 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: NAVY, display: 'block' }}>
                      {registered_owner || 'Property'}
                    </Typography>
                    {title_number && <Typography variant="caption" sx={{ color: '#64748B' }}>Title: {title_number}</Typography>}
                    {lot_number && <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>Lot: {lot_number}</Typography>}
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                      {lat?.toFixed(6)}, {lng?.toFixed(6)}
                    </Typography>
                  </Box>
                </InfoWindow>
              )}
            </Marker>
          )}
          {hasPolygon && <Polygon paths={polygonPoints} options={POLYGON_OPTIONS} />}
        </GoogleMap>

        <Box sx={{ px: 2.5, py: 1.2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          {hasLocation && (
            <Chip label="Location Pinned" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '0.68rem' }} />
          )}
          {hasPolygon && (
            <Chip label={`Boundary: ${polygonPoints.length - 1} points`} size="small" sx={{ bgcolor: `${GOLD}20`, color: '#A8882A', fontWeight: 700, fontSize: '0.68rem' }} />
          )}
          {hasLocation && (
            <Typography variant="caption" sx={{ ml: 'auto', fontFamily: 'monospace', color: '#94A3B8', fontSize: '0.7rem' }}>
              {lat?.toFixed(6)}, {lng?.toFixed(6)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* ── Fullscreen Dialog ── */}
      <Dialog
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        fullScreen
        PaperProps={{ sx: { bgcolor: '#1a1a2e', m: 0, borderRadius: 0 } }}
      >
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          {/* Map area */}
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <MapControls onFullscreen={() => setFullscreen(false)} isFullscreen />
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={center}
              zoom={zoom}
              mapTypeId={mapType}
              onLoad={ref => (fsMapRef.current = ref)}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true }}
            >
              {hasLocation && !hasPolygon && (
                <Marker position={{ lat, lng }} />
              )}
              {hasPolygon && <Polygon paths={polygonPoints} options={POLYGON_OPTIONS_FS} />}
            </GoogleMap>
          </Box>

          {/* Details sidebar */}
          <DetailsPanel />
        </Box>
      </Dialog>
    </>
  )
}
