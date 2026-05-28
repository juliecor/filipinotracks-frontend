import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Box, Typography, Chip, TextField, InputAdornment,
  IconButton, Tooltip, CircularProgress, Alert, Skeleton,
  Dialog, ToggleButton, ToggleButtonGroup, Menu, MenuItem,
  useTheme, useMediaQuery,
} from '@mui/material'
import {
  GoogleMap, Marker, Polygon, InfoWindow, useJsApiLoader,
} from '@react-google-maps/api'
import { motion, AnimatePresence } from 'framer-motion'
import SearchIcon from '@mui/icons-material/Search'
import MapIcon from '@mui/icons-material/Map'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PolylineIcon from '@mui/icons-material/Polyline'
import SquareFootIcon from '@mui/icons-material/SquareFoot'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import CloseIcon from '@mui/icons-material/Close'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import PaletteIcon from '@mui/icons-material/Palette'
import CheckIcon from '@mui/icons-material/Check'
import LandingNav from '../components/landing/LandingNav'
import PropertyCard from '../components/property/PropertyCard'
import PropertyDetailPanel from '../components/property/PropertyDetailPanel'
import FilterChips, { applyFilters } from '../components/property/FilterChips'
import PolygonMeasurements from '../components/map/PolygonMeasurements'
import {
  NAVY, GOLD, GOLD_DARK,
  INFO, SUCCESS,
  SURFACE_SUBTLE, BORDER, TEXT_MUTED, TEXT_SUBTLE,
} from '../theme/theme'
import { MAP_THEMES, getMapStyle } from '../utils/mapStyles'
import {
  STATUS_META, getCenter, getPolygonPoints, getCenterAndZoom,
} from '../utils/propertyGeo'
import api from '../api/axios'

const LIBRARIES = ['places', 'geometry']
const NAVBAR_HEIGHT_DESKTOP = 72
const NAVBAR_HEIGHT_MOBILE  = 64
const SIDEBAR_WIDTH = 380

const POLY_DEFAULT = { fillColor: GOLD, fillOpacity: 0.22, strokeColor: GOLD, strokeOpacity: 0.9, strokeWeight: 2 }
const POLY_ACTIVE  = { fillColor: INFO, fillOpacity: 0.32, strokeColor: INFO, strokeOpacity: 1,    strokeWeight: 3 }

function StatPill({ icon, value, label, color }) {
  return (
    <Box sx={{
      flex: 1, minWidth: 0,
      px: 1.5, py: 1.2,
      bgcolor: 'background.paper',
      border: 1, borderColor: 'divider',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}>
      <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.9rem', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: '0.6rem', color: TEXT_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </Typography>
      </Box>
    </Box>
  )
}

export default function PublicPropertyMapsPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const mapRef   = useRef(null)
  const fsMapRef = useRef(null)
  const rowRefs  = useRef({})

  const [maps, setMaps]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [fsSearch, setFsSearch] = useState('')
  const [filters, setFilters]   = useState({ hasPin: false, hasBoundary: false, province: null })
  const [activeId, setActiveId] = useState(null)
  const [infoMap, setInfoMap]   = useState(null)
  const [mapType, setMapType]   = useState('satellite')
  const [mapTheme, setMapTheme] = useState('default')
  const [themeAnchor, setThemeAnchor] = useState(null)
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

  const handleThemeSelect = (themeId) => {
    setMapTheme(themeId)
    if (themeId !== 'default' && mapType !== 'roadmap') setMapType('roadmap')
    setThemeAnchor(null)
  }

  const flyTo = (m, useFs = false) => {
    setActiveId(m.id)
    setInfoMap(m)
    const center = getCenter(m)
    if (!center) return
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

  const handleBack = () => {
    setActiveId(null)
    setInfoMap(null)
  }

  const resetView = (useFs = false) => {
    setActiveId(null)
    setInfoMap(null)
    const ref = useFs ? fsMapRef : mapRef
    if (ref.current) { ref.current.panTo(mapCenter); ref.current.setZoom(mapZoom) }
  }

  // ─── Derived data ───
  const pinned    = useMemo(() => maps.filter(m => m.latitude && m.longitude), [maps])
  const withBound = useMemo(() => maps.filter(m => m.geojson_polygon), [maps])
  const totalArea = useMemo(() => maps.reduce((s, m) => s + (parseFloat(m.land_area) || 0), 0), [maps])
  const provinces = useMemo(() => maps.map(m => m.province), [maps])

  const makeFilter = (q) => (m) => !q ||
    m.registered_owner?.toLowerCase().includes(q) ||
    m.title_number?.toLowerCase().includes(q) ||
    m.lot_number?.toLowerCase().includes(q) ||
    m.province?.toLowerCase().includes(q) ||
    m.city_municipality?.toLowerCase().includes(q) ||
    m.barangay?.toLowerCase().includes(q)

  const filtered = useMemo(
    () => applyFilters(maps, filters).filter(makeFilter(search.toLowerCase())),
    [maps, filters, search]
  )
  const fsFiltered = useMemo(
    () => applyFilters(maps, filters).filter(makeFilter(fsSearch.toLowerCase())),
    [maps, filters, fsSearch]
  )

  const { center: mapCenter, zoom: mapZoom } = useMemo(() => getCenterAndZoom(maps), [maps])

  const activeProperty = useMemo(
    () => maps.find(m => m.id === activeId) || null,
    [maps, activeId]
  )

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
          {hasPoly && isActive && <PolygonMeasurements paths={pts} />}
          {infoMap?.id === m.id && center && (
            <InfoWindow position={center} onCloseClick={() => { setInfoMap(null); setActiveId(null) }}>
              <Box sx={{ minWidth: 200, p: 0.5 }}>
                <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.3 }}>
                  FilipinoTracks
                </Typography>
                <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.88rem', mb: 0.5 }}>
                  {m.registered_owner || 'Unknown Owner'}
                </Typography>
                {m.title_number && <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED, mb: 0.2 }}>Title: <strong>{m.title_number}</strong></Typography>}
                {m.city_municipality && <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED, mb: 0.2 }}>{[m.city_municipality, m.province].filter(Boolean).join(', ')}</Typography>}
                {m.land_area && <Typography sx={{ fontSize: '0.72rem', color: TEXT_MUTED }}>{parseFloat(m.land_area).toLocaleString()} sqm</Typography>}
              </Box>
            </InfoWindow>
          )}
        </span>
      )
    })
  }

  function MapControls({ useFs = false }) {
    const themeDisabled = mapType !== 'roadmap'
    return (
      <>
        <Box sx={{
          position: 'absolute',
          top: { xs: 10, md: 14 },
          left: { xs: 10, md: 14 },
          zIndex: 10,
          display: 'flex',
          gap: 0.8,
          flexWrap: 'wrap',
        }}>
          <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small"
            sx={{ bgcolor: 'white', boxShadow: '0 4px 12px rgba(10,22,40,0.15)', borderRadius: 1.5 }}>
            <ToggleButton value="satellite"  sx={{ px: 1.3, py: 0.6, fontSize: '0.72rem', fontWeight: 700, border: 'none' }}>
              <SatelliteAltIcon sx={{ fontSize: 15, mr: 0.5 }} />
              {!isMobile && 'Satellite'}
            </ToggleButton>
            <ToggleButton value="roadmap" sx={{ px: 1.3, py: 0.6, fontSize: '0.72rem', fontWeight: 700, border: 'none' }}>
              <MapIcon sx={{ fontSize: 15, mr: 0.5 }} />
              {!isMobile && 'Map'}
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title={themeDisabled ? 'Switch to Map view first' : 'Map theme'}>
            <Box>
              <IconButton size="small" onClick={(e) => setThemeAnchor(e.currentTarget)}
                sx={{
                  bgcolor: 'white', boxShadow: '0 4px 12px rgba(10,22,40,0.15)', borderRadius: 1.5,
                  width: 34, height: 34, opacity: themeDisabled ? 0.55 : 1,
                  '&:hover': { bgcolor: '#F8FAFC' },
                }}>
                <PaletteIcon sx={{ fontSize: 17, color: themeDisabled ? TEXT_SUBTLE : NAVY }} />
              </IconButton>
            </Box>
          </Tooltip>
        </Box>

        <Box sx={{
          position: 'absolute',
          top: { xs: 10, md: 14 },
          right: { xs: 10, md: 14 },
          zIndex: 10,
          display: 'flex',
          gap: 0.8,
        }}>
          {activeId && (
            <Chip label="Reset" size="small" onClick={() => resetView(useFs)}
              sx={{ fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', bgcolor: 'white', color: '#DC2626', boxShadow: '0 4px 12px rgba(10,22,40,0.15)', height: 30 }} />
          )}
          {useFs ? (
            <Tooltip title="Exit fullscreen">
              <IconButton onClick={() => setFullscreen(false)} size="small"
                sx={{ bgcolor: 'white', boxShadow: '0 4px 12px rgba(10,22,40,0.15)', borderRadius: 1.5, width: 34, height: 34, '&:hover': { bgcolor: '#F8FAFC' } }}>
                <CloseIcon sx={{ fontSize: 17, color: NAVY }} />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Fullscreen">
              <IconButton onClick={() => setFullscreen(true)} size="small"
                sx={{ bgcolor: 'white', boxShadow: '0 4px 12px rgba(10,22,40,0.15)', borderRadius: 1.5, width: 34, height: 34, '&:hover': { bgcolor: '#F8FAFC' } }}>
                <FullscreenIcon sx={{ fontSize: 17, color: NAVY }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </>
    )
  }

  const navHeight = isMobile ? NAVBAR_HEIGHT_MOBILE : NAVBAR_HEIGHT_DESKTOP

  /* ────── Sidebar — list view ────── */
  const listView = (
    <Box sx={{
      width: '100%',
      height: '100%',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      borderRight: { xs: 'none', md: 1 },
      borderTop:   { xs: 1, md: 'none' },
      borderColor: 'divider',
    }}>
      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: { xs: 2, md: 2.5 }, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Chip
          label="PROPERTY REGISTRY"
          size="small"
          sx={{ mb: 1, bgcolor: `${GOLD}1F`, color: GOLD_DARK, fontWeight: 800, fontSize: '0.6rem', letterSpacing: '0.12em', height: 20 }}
        />
        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.15rem', md: '1.35rem' }, lineHeight: 1.2, mb: 0.5 }}>
          Verified properties across the Philippines
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', lineHeight: 1.5 }}>
          {loading
            ? 'Loading registry…'
            : `${maps.length} documented ${maps.length === 1 ? 'property' : 'properties'} in our database`}
        </Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.5, display: 'flex', gap: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
        <StatPill icon={<HomeWorkIcon sx={{ fontSize: 16 }} />}   value={loading ? '—' : maps.length}      label="Total"   color={NAVY}    />
        <StatPill icon={<LocationOnIcon sx={{ fontSize: 16 }} />} value={loading ? '—' : pinned.length}    label="Pinned"  color={SUCCESS} />
        <StatPill icon={<PolylineIcon sx={{ fontSize: 16 }} />}   value={loading ? '—' : withBound.length} label="Mapped"  color={GOLD}    />
      </Box>

      {/* Filters */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.2, borderBottom: 1, borderColor: 'divider' }}>
        <FilterChips filters={filters} onChange={setFilters} provinces={provinces} />
      </Box>

      {/* Search */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth size="small" placeholder="Search owner, title, location…"
          value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
        />
      </Box>

      {/* Count */}
      <Box sx={{ px: { xs: 2, md: 2.5 }, py: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
        </Typography>
        {!loading && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <SquareFootIcon sx={{ fontSize: 13, color: INFO }} />
            <Typography sx={{ fontSize: '0.7rem', color: INFO, fontWeight: 700 }}>
              {totalArea.toLocaleString()} sqm total
            </Typography>
          </Box>
        )}
      </Box>

      {/* List */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        px: { xs: 2, md: 2.5 }, pb: 2,
        display: 'flex', flexDirection: 'column', gap: 1,
        '&::-webkit-scrollbar': { width: 5 },
        '&::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 },
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={92} sx={{ borderRadius: 2 }} />
          ))
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <HomeWorkIcon sx={{ fontSize: 36, color: '#CBD5E1', display: 'block', mx: 'auto', mb: 1 }} />
            <Typography variant="body2" sx={{ color: TEXT_MUTED, fontWeight: 600, mb: 0.5 }}>No properties found</Typography>
            <Typography variant="caption" sx={{ color: TEXT_SUBTLE }}>Try a different search term or clear filters.</Typography>
          </Box>
        ) : (
          filtered.map(m => (
            <Box key={m.id} ref={el => { rowRefs.current[m.id] = el }}>
              <PropertyCard
                m={m}
                isActive={activeId === m.id}
                onClick={() => flyTo(m, false)}
              />
            </Box>
          ))
        )}
      </Box>
    </Box>
  )

  const detailView = activeProperty && (
    <PropertyDetailPanel
      property={activeProperty}
      onBack={handleBack}
      onCenterOnMap={() => flyTo(activeProperty, false)}
    />
  )

  const mapElement = (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', bgcolor: SURFACE_SUBTLE }}>
      {!isLoaded || loading ? (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: GOLD }} />
        </Box>
      ) : (
        <>
          <MapControls useFs={false} />
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter} zoom={mapZoom} mapTypeId={mapType}
            onLoad={onMapLoad}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true, styles: getMapStyle(mapTheme) }}
          >
            <MapOverlays useFs={false} />
          </GoogleMap>
        </>
      )}
    </Box>
  )

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <LandingNav />
      <Box sx={{ height: navHeight, flexShrink: 0 }} />

      <Box sx={{
        flex: 1, minHeight: 0, display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
      }}>
        {/* Sidebar (list or detail) */}
        <Box sx={{
          width: { xs: '100%', md: SIDEBAR_WIDTH },
          flexShrink: 0,
          height: { xs: 'auto', md: '100%' },
          order: { xs: 2, md: 1 },
          minHeight: { xs: '45vh', md: 'auto' },
          maxHeight: { xs: '55vh', md: 'none' },
          overflow: 'hidden',
          position: 'relative',
        }}>
          <AnimatePresence mode="wait" initial={false}>
            {activeProperty ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 32 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%', height: '100%' }}
              >
                {detailView}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%', height: '100%' }}
              >
                {listView}
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        {/* Map */}
        <Box sx={{
          flex: 1,
          minHeight: { xs: '45vh', md: 0 },
          order: { xs: 1, md: 2 },
        }}>
          {mapElement}
        </Box>
      </Box>

      {/* Map theme menu */}
      <Menu
        anchorEl={themeAnchor} open={Boolean(themeAnchor)} onClose={() => setThemeAnchor(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{ sx: { mt: 0.5, minWidth: 180, borderRadius: 2, boxShadow: '0 8px 24px rgba(10,22,40,0.15)' } }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${BORDER}` }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Map Theme
          </Typography>
        </Box>
        {MAP_THEMES.map(t => (
          <MenuItem key={t.id} selected={t.id === mapTheme} onClick={() => handleThemeSelect(t.id)}
            sx={{ fontSize: '0.85rem', fontWeight: t.id === mapTheme ? 700 : 500, color: NAVY, py: 1 }}>
            <Box sx={{ flex: 1 }}>{t.label}</Box>
            {t.id === mapTheme && <CheckIcon sx={{ fontSize: 16, color: GOLD, ml: 1 }} />}
          </MenuItem>
        ))}
      </Menu>

      {/* Fullscreen */}
      <Dialog fullScreen open={fullscreen} onClose={() => setFullscreen(false)}
        PaperProps={{ sx: { m: 0, borderRadius: 0, overflow: 'hidden' } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: '100vh', overflow: 'hidden' }}>
          <Box sx={{ flex: 1, position: 'relative', minHeight: { xs: '50vh', md: 0 } }}>
            {isLoaded ? (
              <>
                <MapControls useFs />
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter} zoom={mapZoom} mapTypeId={mapType}
                  onLoad={onFsMapLoad}
                  options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true, styles: getMapStyle(mapTheme) }}
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
          <Box sx={{
            width: { xs: '100%', md: SIDEBAR_WIDTH }, flexShrink: 0,
            height: { xs: '50vh', md: '100vh' },
            display: 'flex', flexDirection: 'column',
            bgcolor: 'white', borderLeft: { xs: 'none', md: `1px solid ${BORDER}` },
          }}>
            <Box sx={{ px: 3, py: 2.5, bgcolor: NAVY, borderBottom: `2px solid ${GOLD}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: NAVY, fontWeight: 900, fontSize: '0.75rem' }}>FT</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.14em' }}>FilipinoTracks</Typography>
                  <Typography sx={{ fontWeight: 800, color: 'white', fontSize: '0.9rem', lineHeight: 1.2 }}>Property Registry</Typography>
                </Box>
                <Tooltip title="Exit fullscreen">
                  <IconButton onClick={() => setFullscreen(false)} size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                    <CloseIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'white', borderBottom: `1px solid ${BORDER}` }}>
              <TextField fullWidth size="small" placeholder="Search properties…" value={fsSearch} onChange={e => setFsSearch(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#F6F8FB' } }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: TEXT_SUBTLE }} /></InputAdornment> }} />
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5,
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: BORDER, borderRadius: 4 } }}>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.2 }}>
                All Properties ({fsFiltered.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {fsFiltered.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <HomeWorkIcon sx={{ fontSize: 32, color: '#CBD5E1', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography variant="caption" sx={{ color: TEXT_SUBTLE }}>No properties match your search</Typography>
                  </Box>
                ) : fsFiltered.map(m => (
                  <PropertyCard key={m.id} m={m} isActive={activeId === m.id} onClick={() => flyTo(m, true)} />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
