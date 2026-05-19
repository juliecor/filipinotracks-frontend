import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Typography, Paper, Grid, Chip, TextField, InputAdornment,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  IconButton, Tooltip, CircularProgress, Alert, Skeleton,
  Dialog, ToggleButton, ToggleButtonGroup, Container,
} from '@mui/material'
import {
  GoogleMap, Marker, Polygon, InfoWindow, useJsApiLoader,
} from '@react-google-maps/api'
import SearchIcon from '@mui/icons-material/Search'
import MapIcon from '@mui/icons-material/Map'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PolylineIcon from '@mui/icons-material/Polyline'
import SquareFootIcon from '@mui/icons-material/SquareFoot'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LandingNav from '../components/landing/LandingNav'
import LandingFooter from '../components/landing/LandingFooter'
import {
  NAVY, NAVY_SURFACE, NAVY_LINE, GOLD, GOLD_DARK,
  INFO, SUCCESS, WARNING, DANGER,
  SURFACE, SURFACE_SUBTLE, BORDER, TEXT_BODY, TEXT_MUTED, TEXT_SUBTLE,
} from '../theme/theme'
import api from '../api/axios'

const LIBRARIES = ['places']

const POLY_DEFAULT = { fillColor: GOLD, fillOpacity: 0.2,  strokeColor: GOLD, strokeOpacity: 0.85, strokeWeight: 2 }
const POLY_ACTIVE  = { fillColor: INFO, fillOpacity: 0.3,  strokeColor: INFO, strokeOpacity: 1,    strokeWeight: 3 }

const STATUS_META = {
  'submitted':                { label: 'Submitted',    color: NAVY      },
  'under review':             { label: 'Under Review', color: INFO      },
  'verification ongoing':     { label: 'Verifying',    color: INFO      },
  'processing':               { label: 'Processing',   color: WARNING   },
  'waiting for requirements': { label: 'Waiting',      color: GOLD_DARK },
  'approved':                 { label: 'Approved',     color: SUCCESS   },
  'released':                 { label: 'Released',     color: SUCCESS   },
  'rejected':                 { label: 'Rejected',     color: DANGER    },
}

function getCenter(m) {
  if (m.latitude && m.longitude) return { lat: parseFloat(m.latitude), lng: parseFloat(m.longitude) }
  const coords = m.geojson_polygon?.geometry?.coordinates?.[0]
  if (coords?.length > 2) return {
    lat: coords.reduce((s, [, la]) => s + la, 0) / coords.length,
    lng: coords.reduce((s, [lo])   => s + lo, 0) / coords.length,
  }
  return null
}

function getPolygonPoints(m) {
  const coords = m.geojson_polygon?.geometry?.coordinates?.[0]
  if (!coords || coords.length < 3) return []
  return coords.map(([lo, la]) => ({ lat: la, lng: lo }))
}

function StatCard({ icon, label, value, color }) {
  return (
    <Paper sx={{ p: 2.5, borderRadius: 2.5, boxShadow: '0 2px 10px rgba(10,22,40,0.07)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Box sx={{ color }}>{icon}</Box>
      </Box>
      <Box>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: NAVY, lineHeight: 1 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: TEXT_MUTED, fontWeight: 600 }}>{label}</Typography>
      </Box>
    </Paper>
  )
}

function PropertyCard({ m, isActive, onClick }) {
  const status = m.transaction?.status
  const meta   = STATUS_META[status]
  const pts    = getPolygonPoints(m)
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2, borderRadius: 2, cursor: 'pointer', border: '1.5px solid',
        borderColor: isActive ? GOLD : BORDER,
        bgcolor: isActive ? `${GOLD}0A` : 'white',
        '&:hover': { borderColor: isActive ? GOLD : '#D1D9E6', bgcolor: isActive ? `${GOLD}12` : '#F8FAFC' },
        transition: 'all 0.15s',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.8 }}>
        <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.85rem', lineHeight: 1.3, flex: 1, pr: 1 }}>
          {m.registered_owner || 'Unknown Owner'}
        </Typography>
        {isActive && <ChevronRightIcon sx={{ fontSize: 16, color: GOLD, flexShrink: 0 }} />}
      </Box>
      {m.title_number && (
        <Typography sx={{ fontSize: '0.68rem', fontFamily: 'monospace', color: TEXT_MUTED, mb: 0.5 }}>{m.title_number}</Typography>
      )}
      <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mb: 0.8 }}>
        {m.city_municipality && (
          <Chip label={m.city_municipality} size="small" sx={{ fontSize: '0.6rem', fontWeight: 600, height: 18, bgcolor: SURFACE_SUBTLE, color: TEXT_BODY }} />
        )}
        {m.property_type && (
          <Chip label={m.property_type} size="small" sx={{ fontSize: '0.6rem', fontWeight: 600, height: 18, bgcolor: SURFACE_SUBTLE, color: TEXT_BODY, textTransform: 'capitalize' }} />
        )}
        {m.land_area && (
          <Chip label={`${parseFloat(m.land_area).toLocaleString()} sqm`} size="small" sx={{ fontSize: '0.6rem', fontWeight: 600, height: 18, bgcolor: `${INFO}14`, color: INFO }} />
        )}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {m.latitude  && <Chip label="Pin"      size="small" sx={{ bgcolor: `${SUCCESS}1A`, color: SUCCESS, fontWeight: 700, fontSize: '0.58rem', height: 16 }} />}
          {pts.length > 2 && <Chip label="Boundary" size="small" sx={{ bgcolor: `${GOLD}20`,  color: GOLD_DARK, fontWeight: 700, fontSize: '0.58rem', height: 16 }} />}
        </Box>
        {meta && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: meta.color }} />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default function PublicPropertyMapsPage() {
  const mapRef   = useRef(null)
  const fsMapRef = useRef(null)
  const rowRefs  = useRef({})

  const [maps, setMaps]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [fsSearch, setFsSearch] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [infoMap, setInfoMap]   = useState(null)
  const [mapType, setMapType]   = useState('hybrid')
  const [fullscreen, setFullscreen] = useState(false)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  useEffect(() => {
    api.get('/property-maps')
      .then(({ data }) => setMaps(data))
      .catch(() => setError('Failed to load property maps.'))
      .finally(() => setLoading(false))
  }, [])

  const onMapLoad   = useCallback(inst => { mapRef.current   = inst }, [])
  const onFsMapLoad = useCallback(inst => { fsMapRef.current = inst }, [])

  const flyTo = (m, useFs = false) => {
    const center = getCenter(m)
    if (!center) return
    setActiveId(m.id)
    setInfoMap(m)
    const ref = useFs ? fsMapRef : mapRef
    if (!ref.current) return

    const pts = getPolygonPoints(m)
    if (pts.length > 2 && window.google?.maps) {
      const bounds = new window.google.maps.LatLngBounds()
      pts.forEach(p => bounds.extend(p))
      ref.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 })
    } else {
      ref.current.panTo(center)
      ref.current.setZoom(19)
    }
    rowRefs.current[m.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleMapClick = (m, useFs = false) => {
    setActiveId(m.id)
    setInfoMap(m)
    if (!useFs) rowRefs.current[m.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const resetView = (useFs = false) => {
    setActiveId(null)
    setInfoMap(null)
    const ref = useFs ? fsMapRef : mapRef
    if (ref.current) { ref.current.panTo(mapCenter); ref.current.setZoom(mapZoom) }
  }

  const pinned    = maps.filter(m => m.latitude && m.longitude)
  const withBound = maps.filter(m => m.geojson_polygon)
  const totalArea = maps.reduce((s, m) => s + (parseFloat(m.land_area) || 0), 0)

  const makeFilter = (q) => (m) => !q ||
    m.registered_owner?.toLowerCase().includes(q) ||
    m.title_number?.toLowerCase().includes(q) ||
    m.lot_number?.toLowerCase().includes(q) ||
    m.province?.toLowerCase().includes(q) ||
    m.city_municipality?.toLowerCase().includes(q) ||
    m.barangay?.toLowerCase().includes(q)

  const filtered   = maps.filter(makeFilter(search.toLowerCase()))
  const fsFiltered = maps.filter(makeFilter(fsSearch.toLowerCase()))

  const mapCenter = pinned.length
    ? { lat: pinned.reduce((s, m) => s + parseFloat(m.latitude), 0) / pinned.length,
        lng: pinned.reduce((s, m) => s + parseFloat(m.longitude), 0) / pinned.length }
    : { lat: 12.8797, lng: 121.7740 }
  const mapZoom = pinned.length === 1 ? 16 : pinned.length > 1 ? 7 : 6

  function MapOverlays({ useFs = false }) {
    return maps.map(m => {
      const pts      = getPolygonPoints(m)
      const hasPin   = !!(m.latitude && m.longitude)
      const hasPoly  = pts.length > 2
      const isActive = activeId === m.id
      const center   = getCenter(m)
      return (
        <span key={m.id}>
          {hasPin && !hasPoly && (
            <Marker
              position={{ lat: parseFloat(m.latitude), lng: parseFloat(m.longitude) }}
              onClick={() => handleMapClick(m, useFs)}
              options={{ zIndex: isActive ? 999 : 1 }}
            />
          )}
          {hasPoly && (
            <Polygon
              paths={pts}
              options={isActive ? POLY_ACTIVE : POLY_DEFAULT}
              onClick={() => handleMapClick(m, useFs)}
            />
          )}
          {infoMap?.id === m.id && center && (
            <InfoWindow
              position={center}
              onCloseClick={() => { setInfoMap(null); setActiveId(null) }}
            >
              <Box sx={{ minWidth: 210, p: 0.5 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.3 }}>
                  FilipinoTracks
                </Typography>
                <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.88rem', mb: 0.5 }}>
                  {m.registered_owner || 'Unknown Owner'}
                </Typography>
                {m.title_number && <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED, mb: 0.2 }}>Title: <strong>{m.title_number}</strong></Typography>}
                {m.lot_number    && <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED, mb: 0.2 }}>Lot: {m.lot_number}{m.block_number ? ` / Block ${m.block_number}` : ''}</Typography>}
                {m.city_municipality && <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED, mb: 0.2 }}>{m.city_municipality}{m.province ? `, ${m.province}` : ''}</Typography>}
                {m.land_area && <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED }}>{parseFloat(m.land_area).toLocaleString()} sqm</Typography>}
              </Box>
            </InfoWindow>
          )}
        </span>
      )
    })
  }

  function MapControls({ useFs = false }) {
    return (
      <>
        <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
          <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small"
            sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', borderRadius: 1 }}>
            <ToggleButton value="hybrid"  sx={{ px: 1.5, fontSize: '0.72rem', fontWeight: 700 }}>
              <SatelliteAltIcon sx={{ fontSize: 15, mr: 0.5 }} /> Satellite
            </ToggleButton>
            <ToggleButton value="roadmap" sx={{ px: 1.5, fontSize: '0.72rem', fontWeight: 700 }}>
              <MapIcon sx={{ fontSize: 15, mr: 0.5 }} /> Map
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 1 }}>
          {activeId && (
            <Chip label="Reset view" size="small" onClick={() => resetView(useFs)}
              sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', bgcolor: 'white', color: DANGER, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
          )}
          {useFs ? (
            <Tooltip title="Exit fullscreen">
              <IconButton onClick={() => setFullscreen(false)} size="small"
                sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', borderRadius: 1, width: 36, height: 36, '&:hover': { bgcolor: '#F8FAFC' } }}>
                <CloseIcon sx={{ fontSize: 18, color: NAVY }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Fullscreen view">
              <IconButton onClick={() => setFullscreen(true)} size="small"
                sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', borderRadius: 1, width: 36, height: 36, '&:hover': { bgcolor: '#F8FAFC' } }}>
                <FullscreenIcon sx={{ fontSize: 18, color: NAVY }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SURFACE }}>
      <LandingNav />

      {/* Hero */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, ${NAVY_SURFACE} 60%, ${NAVY_LINE} 100%)`,
        pt: { xs: 12, md: 14 },
        pb: { xs: 5, md: 6 },
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px' }} />
        <Container maxWidth="xl" sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapIcon sx={{ color: NAVY, fontSize: 24 }} />
            </Box>
            <Box>
              <Chip
                label="PUBLIC REGISTRY"
                size="small"
                sx={{ mb: 0.8, bgcolor: `${GOLD}22`, color: GOLD, fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.12em', border: `1px solid ${GOLD}44`, height: 20 }}
              />
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.1, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
                Property Land Registry
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.85rem', md: '0.95rem' }, mt: 0.5 }}>
                Browse all documented properties and verified land titles across the Philippines.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}><StatCard icon={<HomeWorkIcon />}   label="Total Properties" value={loading ? '—' : maps.length}                          color={NAVY}    /></Grid>
          <Grid item xs={6} sm={3}><StatCard icon={<LocationOnIcon />} label="Location Pinned"  value={loading ? '—' : pinned.length}                       color={SUCCESS} /></Grid>
          <Grid item xs={6} sm={3}><StatCard icon={<PolylineIcon />}   label="Boundary Mapped"  value={loading ? '—' : withBound.length}                    color={GOLD}    /></Grid>
          <Grid item xs={6} sm={3}><StatCard icon={<SquareFootIcon />} label="Total Land Area"  value={loading ? '—' : `${totalArea.toLocaleString()} sqm`} color={INFO}    /></Grid>
        </Grid>

        {/* Inline map */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.09)', border: `1px solid ${BORDER}` }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Map Overview</Typography>
              <Typography variant="caption" sx={{ color: TEXT_SUBTLE }}>Click a property or row to zoom in · Use fullscreen for the full experience</Typography>
            </Box>
          </Box>

          {!isLoaded || loading ? (
            <Box sx={{ height: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: SURFACE_SUBTLE }}>
              <CircularProgress sx={{ color: GOLD }} />
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <MapControls useFs={false} />
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: 480 }}
                center={mapCenter} zoom={mapZoom} mapTypeId={mapType}
                onLoad={onMapLoad}
                options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true }}
              >
                <MapOverlays useFs={false} />
              </GoogleMap>
            </Box>
          )}
        </Paper>

        {/* Table */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(10,22,40,0.09)', border: `1px solid ${BORDER}` }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Property Records</Typography>
              <Typography variant="caption" sx={{ color: TEXT_SUBTLE }}>{filtered.length} of {maps.length} records · Click a row to locate on map</Typography>
            </Box>
            <TextField size="small" placeholder="Search owner, title, location…" value={search} onChange={e => setSearch(e.target.value)}
              sx={{ width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: TEXT_SUBTLE }} /></InputAdornment> }} />
          </Box>

          <TableContainer sx={{ maxHeight: 520, '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 } }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['#', 'Registered Owner', 'Title Number', 'Lot / Block', 'Province', 'City / Municipality', 'Barangay', 'Type', 'Area (sqm)', 'Status', 'Map', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.65rem', color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', bgcolor: '#F8FAFC', whiteSpace: 'nowrap', py: 1.2 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 12 }).map((_, j) => <TableCell key={j}><Skeleton height={20} /></TableCell>)}</TableRow>
                )) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} sx={{ textAlign: 'center', py: 6, color: TEXT_SUBTLE }}>
                      <HomeWorkIcon sx={{ fontSize: 36, display: 'block', mx: 'auto', mb: 1, opacity: 0.3 }} />
                      No property records found
                    </TableCell>
                  </TableRow>
                ) : filtered.map((m, i) => {
                  const status = m.transaction?.status
                  const meta   = STATUS_META[status] || { label: status, color: TEXT_MUTED }
                  const isActive = activeId === m.id
                  const canFly   = !!getCenter(m)
                  return (
                    <TableRow key={m.id} ref={el => { rowRefs.current[m.id] = el }} hover
                      onClick={() => canFly && flyTo(m, false)}
                      sx={{ cursor: canFly ? 'pointer' : 'default', '&:last-child td': { borderBottom: 0 },
                        bgcolor: isActive ? `${NAVY}08` : 'transparent',
                        borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                        transition: 'background 0.15s' }}
                    >
                      <TableCell sx={{ color: TEXT_SUBTLE, fontSize: '0.72rem', fontWeight: 600 }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: NAVY, fontSize: '0.78rem', whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.registered_owner || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontFamily: 'monospace', color: TEXT_BODY, whiteSpace: 'nowrap' }}>{m.title_number || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_BODY, whiteSpace: 'nowrap' }}>{[m.lot_number, m.block_number].filter(Boolean).join(' / ') || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_BODY, whiteSpace: 'nowrap' }}>{m.province || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_BODY, whiteSpace: 'nowrap' }}>{m.city_municipality || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_BODY, whiteSpace: 'nowrap' }}>{m.barangay || '—'}</TableCell>
                      <TableCell>{m.property_type ? <Chip label={m.property_type} size="small" sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'capitalize', bgcolor: SURFACE_SUBTLE, color: TEXT_BODY }} /> : '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: TEXT_BODY, whiteSpace: 'nowrap', fontWeight: 600 }}>{m.land_area ? parseFloat(m.land_area).toLocaleString() : '—'}</TableCell>
                      <TableCell>
                        {status ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, bgcolor: `${meta.color}15`, borderRadius: 1 }}>
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: meta.color }} />
                            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: meta.color, whiteSpace: 'nowrap' }}>{meta.label}</Typography>
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {m.latitude && <Chip label="Pin" size="small" sx={{ bgcolor: `${SUCCESS}1A`, color: SUCCESS, fontWeight: 700, fontSize: '0.58rem', height: 18 }} />}
                          {m.geojson_polygon && <Chip label="Poly" size="small" sx={{ bgcolor: `${GOLD}20`, color: GOLD_DARK, fontWeight: 700, fontSize: '0.58rem', height: 18 }} />}
                          {!m.latitude && !m.geojson_polygon && <Typography sx={{ fontSize: '0.72rem', color: '#CBD5E1' }}>—</Typography>}
                        </Box>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()} sx={{ pr: 1 }}>
                        {canFly && (
                          <Tooltip title="Locate on map">
                            <IconButton size="small" onClick={() => flyTo(m, false)} sx={{ bgcolor: `${GOLD}15`, '&:hover': { bgcolor: `${GOLD}30` } }}>
                              <MyLocationIcon sx={{ fontSize: 13, color: GOLD_DARK }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <LandingFooter />

      {/* Fullscreen dialog */}
      <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)}
        PaperProps={{ sx: { m: 0, borderRadius: 0, overflow: 'hidden' } }}>
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

          {/* Left: Map */}
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {isLoaded ? (
              <>
                <MapControls useFs />
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter} zoom={mapZoom} mapTypeId={mapType}
                  onLoad={onFsMapLoad}
                  options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true }}
                >
                  <MapOverlays useFs />
                </GoogleMap>
              </>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: SURFACE_SUBTLE }}>
                <CircularProgress sx={{ color: GOLD }} />
              </Box>
            )}
          </Box>

          {/* Right: Sidebar */}
          <Box sx={{
            width: 380, flexShrink: 0, height: '100vh', display: 'flex', flexDirection: 'column',
            bgcolor: '#F8FAFC', borderLeft: `1px solid ${BORDER}`,
          }}>
            <Box sx={{ px: 3, py: 2.5, bgcolor: NAVY, borderBottom: `2px solid ${GOLD}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: NAVY, fontWeight: 900, fontSize: '0.75rem' }}>FT</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.14em' }}>FilipinoTracks</Typography>
                  <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '0.9rem', lineHeight: 1.2 }}>Property Land Registry</Typography>
                </Box>
                <Tooltip title="Exit fullscreen">
                  <IconButton onClick={() => setFullscreen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                {[
                  { label: 'Properties', value: maps.length },
                  { label: 'Pinned', value: pinned.length },
                  { label: 'Boundaries', value: withBound.length },
                ].map(s => (
                  <Box key={s.label} sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, color: GOLD, fontSize: '1.1rem', lineHeight: 1 }}>{s.value}</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box sx={{ px: 2, py: 1.5, bgcolor: 'white', borderBottom: `1px solid ${BORDER}` }}>
              <TextField fullWidth size="small" placeholder="Search properties…" value={fsSearch} onChange={e => setFsSearch(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F8FAFC' } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: TEXT_SUBTLE }} /></InputAdornment> }} />
            </Box>

            {infoMap && (
              <Box sx={{ px: 2, py: 2, bgcolor: 'white', borderBottom: `2px solid ${BORDER}` }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: TEXT_SUBTLE, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                  Selected Property
                </Typography>
                <Box sx={{ p: 2, bgcolor: `${NAVY}06`, border: `1.5px solid ${GOLD}`, borderRadius: 2, mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem', mb: 0.5 }}>{infoMap.registered_owner || 'Unknown'}</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.8, mb: 1 }}>
                    {[
                      ['Title', infoMap.title_number],
                      ['Lot', infoMap.lot_number],
                      ['Block', infoMap.block_number],
                      ['Survey Plan', infoMap.survey_plan_number],
                      ['Tax Dec.', infoMap.tax_declaration_number],
                      ['Type', infoMap.property_type],
                      ['Province', infoMap.province],
                      ['City / Mun.', infoMap.city_municipality],
                      ['Barangay', infoMap.barangay],
                      ['Area', infoMap.land_area ? `${parseFloat(infoMap.land_area).toLocaleString()} sqm` : null],
                    ].filter(([, v]) => v).map(([label, value]) => (
                      <Box key={label}>
                        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: TEXT_SUBTLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: TEXT_BODY, textTransform: 'capitalize' }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {infoMap.latitude && (
                    <Typography sx={{ fontSize: '0.62rem', fontFamily: 'monospace', color: TEXT_SUBTLE }}>
                      {parseFloat(infoMap.latitude).toFixed(6)}, {parseFloat(infoMap.longitude).toFixed(6)}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <Box sx={{
              flex: 1, overflowY: 'auto', px: 2, py: 1.5,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 },
            }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: TEXT_SUBTLE, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.2 }}>
                All Properties ({fsFiltered.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {fsFiltered.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <HomeWorkIcon sx={{ fontSize: 32, color: '#CBD5E1', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography variant="caption" sx={{ color: TEXT_SUBTLE }}>No properties match your search</Typography>
                  </Box>
                ) : fsFiltered.map(m => (
                  <PropertyCard
                    key={m.id}
                    m={m}
                    isActive={activeId === m.id}
                    onClick={() => flyTo(m, true)}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
