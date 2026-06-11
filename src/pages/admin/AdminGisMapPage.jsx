import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GoogleMap, Polygon, Marker, OverlayView, useJsApiLoader,
} from '@react-google-maps/api'
import {
  Box, Paper, Typography, IconButton, Tooltip, Chip, Button,
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Divider, Stack, ToggleButtonGroup, ToggleButton,
  Drawer, useTheme, useMediaQuery, Switch, FormControlLabel, Menu,
  ListItemIcon, ListItemText, Alert, Avatar,
} from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import DownloadIcon from '@mui/icons-material/Download'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import MapIcon from '@mui/icons-material/Map'
import RefreshIcon from '@mui/icons-material/Refresh'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import FilterCenterFocusIcon from '@mui/icons-material/FilterCenterFocus'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PublicIcon from '@mui/icons-material/Public'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import TerrainIcon from '@mui/icons-material/Terrain'
import GroupsIcon from '@mui/icons-material/Groups'
import StraightenIcon from '@mui/icons-material/Straighten'
import VerifiedIcon from '@mui/icons-material/Verified'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import BlockIcon from '@mui/icons-material/Block'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { NAVY, GOLD, GOLD_DARK } from '../../theme/theme'
import { GOOGLE_MAPS_LIBRARIES as LIBRARIES } from '../../utils/mapsLibraries'
import {
  polygonsOverlap, styleForStatus, OVERLAP_STYLE, STATUS_STYLES,
  exportGeoJSON, exportKML, exportCSV,
} from '../../utils/polygonGis'
import { formatCoordsDMS } from '../../utils/coordinates'
import SurveyPdfButton from '../../components/SurveyPdfButton'

const PH_CENTER = { lat: 12.8797, lng: 121.7740 }  // roughly centered on the archipelago
const PH_ZOOM   = 6
const PROPERTY_TYPES = ['residential', 'commercial', 'agricultural', 'condominium']
const STATUSES = Object.keys(STATUS_STYLES)

const peso = (n) => {
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n)
}
const fmtArea = (sqm) => {
  if (!Number.isFinite(sqm) || sqm <= 0) return '—'
  if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)} ha · ${sqm.toLocaleString()} sqm`
  return `${sqm.toLocaleString()} sqm`
}

export default function AdminGisMapPage() {
  const navigate = useNavigate()
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter]     = useState('all')
  const [showOverlapsOnly, setShowOverlapsOnly] = useState(false)
  const [showPinsForPolygons, setShowPinsForPolygons] = useState(true)

  const [mapType, setMapType]     = useState('hybrid')   // currently displayed
  const [userMapType, setUserMapType] = useState('hybrid')   // last type the user picked manually
  const [currentZoom, setCurrentZoom] = useState(PH_ZOOM)
  const [selectedId, setSelectedId] = useState(null)
  const [hoveredId, setHoveredId]   = useState(null)
  const [exportAnchor, setExportAnchor] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(true)

  const mapRef = useRef(null)
  const hoverTimerRef = useRef(null)

  // Hide the centroid pins once the user is close enough to see the polygon itself
  const PIN_HIDE_ZOOM = 16
  const showPins = currentZoom < PIN_HIDE_ZOOM
  const isZoomedIn = currentZoom > PH_ZOOM + 2  // anything noticeably tighter than the country view

  // When the user picks Satellite/Map/Terrain manually we remember it so "Back" can restore it
  const handleMapTypeChange = useCallback((_, v) => {
    if (!v) return
    setMapType(v)
    setUserMapType(v)
  }, [])

  /* ─── Fetch ───────────────────────────────────────────────────────── */
  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    api.get('/admin/gis-map')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load GIS data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ─── Derived: overlaps map (id → array of overlapping ids) ────── */
  const overlapsByFeature = useMemo(() => {
    if (!data?.features) return {}
    const polyFeatures = data.features.filter(f => f.geometry?.type === 'Polygon')
    const result = {}
    for (let i = 0; i < polyFeatures.length; i++) {
      for (let j = i + 1; j < polyFeatures.length; j++) {
        const a = polyFeatures[i], b = polyFeatures[j]
        if (polygonsOverlap(a.geometry.coordinates[0], b.geometry.coordinates[0])) {
          ;(result[a.id] ||= []).push({ id: b.id, code: b.properties?.transaction_code, title: b.properties?.title_number })
          ;(result[b.id] ||= []).push({ id: a.id, code: a.properties?.transaction_code, title: a.properties?.title_number })
        }
      }
    }
    return result
  }, [data])

  /* ─── Filtering ──────────────────────────────────────────────────── */
  const filteredFeatures = useMemo(() => {
    if (!data?.features) return []
    const q = search.trim().toLowerCase()
    return data.features.filter(f => {
      const p = f.properties || {}
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (typeFilter   !== 'all' && p.property_type !== typeFilter) return false
      if (showOverlapsOnly && !overlapsByFeature[f.id]) return false
      if (q) {
        const hay = [
          p.title_number, p.lot_number, p.transaction_code, p.registered_owner,
          p.submitted_by, p.full_address, p.barangay, p.city_municipality, p.province,
        ].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [data, search, statusFilter, typeFilter, showOverlapsOnly, overlapsByFeature])

  /* ─── Stats panel ────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const features = filteredFeatures
    const byStatus = {}
    let totalArea = 0
    let withPolygons = 0
    let owners = new Set()
    for (const f of features) {
      const p = f.properties || {}
      byStatus[p.status || 'unknown'] = (byStatus[p.status || 'unknown'] || 0) + 1
      if (Number.isFinite(p.land_area) && p.land_area > 0) totalArea += p.land_area
      if (f.geometry?.type === 'Polygon') withPolygons++
      if (p.registered_owner) owners.add(p.registered_owner.toLowerCase())
    }
    const overlapCount = features.filter(f => overlapsByFeature[f.id]).length
    return {
      total: features.length,
      byStatus,
      totalArea,
      withPolygons,
      uniqueOwners: owners.size,
      overlapCount,
    }
  }, [filteredFeatures, overlapsByFeature])

  /* ─── Selected feature card ──────────────────────────────────────── */
  const selectedFeature = useMemo(
    () => data?.features?.find(f => f.id === selectedId) || null,
    [selectedId, data]
  )

  /**
   * Cinematic fly-to:
   *   1. If we're far, zoom OUT a couple steps first (gives a "lift-off" feel)
   *   2. Smoothly pan to the target (Google's built-in easing)
   *   3. Step-zoom IN one level at a time until we land at parcel level
   * Result: a satisfying swoop instead of a hard cut.
   */
  const flyToFeature = useCallback((f) => {
    if (!f || !mapRef.current || !window.google?.maps) return
    const c = f.properties?.centroid
    if (!c) return
    const target  = { lat: c.lat, lng: c.lng }
    const map     = mapRef.current
    const current = map.getZoom() || PH_ZOOM
    const desired = 19

    const stepZoom = (from, to) => {
      if (from === to) return
      const dir = from < to ? 1 : -1
      let z = from
      const tick = () => {
        z += dir
        map.setZoom(z)
        if (z !== to) setTimeout(tick, 70)
      }
      setTimeout(tick, 70)
    }

    // Auto-switch to Satellite (hybrid = satellite + labels) so the user sees the real land
    setMapType('hybrid')

    if (Math.abs(current - desired) > 5) {
      // Far away: lift-off → cruise → descent
      map.setZoom(Math.max(current - 1, 9))
      setTimeout(() => {
        map.panTo(target)
        setTimeout(() => stepZoom(map.getZoom(), desired), 380)
      }, 180)
    } else {
      // Already close — just glide
      map.panTo(target)
      setTimeout(() => stepZoom(map.getZoom(), desired), 220)
    }
  }, [])

  const handleSelectFeature = useCallback((id) => {
    setSelectedId(id)
    const f = data?.features?.find(x => x.id === id)
    if (f) flyToFeature(f)
  }, [data, flyToFeature])

  const handleHover = useCallback((id) => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
    setHoveredId(id)
  }, [])

  const handleHoverOut = useCallback(() => {
    // Tiny delay so moving cursor between polygon ↔ marker doesn't flicker the tooltip
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => setHoveredId(null), 80)
  }, [])

  useEffect(() => () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current) }, [])

  const handleResetView = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) return
    setMapType(userMapType)  // restore the user's preferred map view
    setSelectedId(null)
    if (!filteredFeatures.length) {
      mapRef.current.panTo(PH_CENTER)
      mapRef.current.setZoom(PH_ZOOM)
      return
    }
    const bounds = new window.google.maps.LatLngBounds()
    let extended = 0
    for (const f of filteredFeatures) {
      const c = f.properties?.centroid
      if (c) { bounds.extend({ lat: c.lat, lng: c.lng }); extended++ }
    }
    if (extended > 0) mapRef.current.fitBounds(bounds, 80)
  }, [filteredFeatures, userMapType])

  // Auto-fit once on first load
  const fittedRef = useRef(false)
  useEffect(() => {
    if (!fittedRef.current && isLoaded && data?.features?.length && mapRef.current) {
      handleResetView()
      fittedRef.current = true
    }
  }, [isLoaded, data, handleResetView])

  /* ─── Export menu handlers ───────────────────────────────────────── */
  const handleExport = (kind) => {
    const fc = { type: 'FeatureCollection', features: filteredFeatures }
    const stamp = new Date().toISOString().slice(0, 10)
    if (kind === 'geojson') exportGeoJSON(fc, `filipinotracks-gis-${stamp}.geojson`)
    if (kind === 'kml')     exportKML(fc,     `filipinotracks-gis-${stamp}.kml`)
    if (kind === 'csv')     exportCSV(fc,     `filipinotracks-gis-${stamp}.csv`)
    setExportAnchor(null)
  }

  if (!isLoaded || loading) {
    return (
      <Box sx={{ height: 'calc(100vh - 56px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: GOLD }} size={48} />
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
          Loading GIS data…
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" action={<Button onClick={fetchData} startIcon={<RefreshIcon />}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    )
  }

  /* ─── Sidebar (filters + stats + property list) ───────────────────── */
  const Sidebar = (
    <Box sx={{
      width: { xs: '100vw', md: 360 },
      maxWidth: '100vw',
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: 1, borderColor: 'divider',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.8,
        background: `linear-gradient(135deg, ${NAVY} 0%, #060E1A 100%)`,
        color: 'white',
        borderBottom: `2px solid ${GOLD}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
      }}>
        <Box>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, letterSpacing: '0.18em' }}>
            FILIPINOTRACKS · GIS
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
            Property Map
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.4 }}>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchData} sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <RefreshIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {isMobile && (
            <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Stats strip */}
      <Box sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, bgcolor: 'action.hover' }}>
        <StatTile icon={<LocationOnIcon sx={{ fontSize: 14 }} />} value={stats.total} label="Lots" tint={GOLD} />
        <StatTile icon={<TerrainIcon sx={{ fontSize: 14 }} />} value={stats.totalArea >= 10000 ? `${(stats.totalArea / 10000).toFixed(1)}ha` : `${(stats.totalArea / 1000).toFixed(0)}k`} label="Area" tint="#16A34A" />
        <StatTile icon={<GroupsIcon sx={{ fontSize: 14 }} />} value={stats.uniqueOwners} label="Owners" tint="#2563EB" />
        <StatTile icon={<WarningAmberIcon sx={{ fontSize: 14 }} />} value={stats.overlapCount} label="Overlaps" tint={stats.overlapCount > 0 ? '#DC2626' : '#64748B'} alert={stats.overlapCount > 0} />
      </Box>

      {/* Search + filters */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        <TextField
          size="small"
          placeholder="Search title, lot, owner, address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
              <MenuItem value="all">All statuses</MenuItem>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{STATUS_STYLES[s].label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Type</InputLabel>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type">
              <MenuItem value="all">All types</MenuItem>
              {PROPERTY_TYPES.map(t => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <FormControlLabel
          control={<Switch size="small" checked={showOverlapsOnly} onChange={(e) => setShowOverlapsOnly(e.target.checked)} />}
          label={<Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Show overlapping lots only</Typography>}
        />
      </Box>

      {/* Property list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filteredFeatures.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              No properties match your filters.
            </Typography>
          </Box>
        ) : (
          filteredFeatures.map(f => {
            const p = f.properties || {}
            const isSelected = f.id === selectedId
            const hasOverlap = !!overlapsByFeature[f.id]
            const st = hasOverlap ? OVERLAP_STYLE : styleForStatus(p.status)
            return (
              <Box
                key={f.id}
                onClick={() => handleSelectFeature(f.id)}
                sx={{
                  px: 2, py: 1.4,
                  borderBottom: 1, borderColor: 'divider',
                  cursor: 'pointer',
                  bgcolor: isSelected ? `${GOLD}10` : 'transparent',
                  borderLeft: `3px solid ${isSelected ? GOLD : st.color}`,
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: isSelected ? `${GOLD}18` : 'action.hover' },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title_number || p.transaction_code || `Property #${f.id}`}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.registered_owner || p.submitted_by || '—'} · {p.barangay || p.city_municipality || '—'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.4} alignItems="center">
                    {hasOverlap && (
                      <Tooltip title={`Overlaps ${overlapsByFeature[f.id].length} other lot(s)`}>
                        <WarningAmberIcon sx={{ fontSize: 16, color: OVERLAP_STYLE.color }} />
                      </Tooltip>
                    )}
                    <Chip
                      label={st.label}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.6rem', fontWeight: 700,
                        bgcolor: `${st.color}1F`, color: st.color,
                        border: `1px solid ${st.color}55`,
                      }}
                    />
                  </Stack>
                </Box>
              </Box>
            )
          })
        )}
      </Box>

      {/* Footer actions */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', gap: 1 }}>
        <Button
          size="small" fullWidth
          variant="contained" color="secondary"
          startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
          onClick={(e) => setExportAnchor(e.currentTarget)}
          sx={{ fontWeight: 700 }}
        >
          Export
        </Button>
        <Button
          size="small" fullWidth
          variant="outlined"
          startIcon={<FilterCenterFocusIcon sx={{ fontSize: 16 }} />}
          onClick={handleResetView}
          sx={{ fontWeight: 700, color: NAVY, borderColor: NAVY }}
        >
          Reset View
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ height: 'calc(100vh - 56px)', display: 'flex', overflow: 'hidden', bgcolor: 'background.default', position: 'relative' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <AnimatePresence initial={false}>
          {drawerOpen && (
            <motion.div
              initial={{ x: -360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -360, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ height: '100%', flexShrink: 0 }}
            >
              {Sidebar}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} ModalProps={{ keepMounted: true }}>
          {Sidebar}
        </Drawer>
      )}

      {/* Map area */}
      <Box sx={{ flex: 1, position: 'relative', minWidth: 0 }}>
        {/* Floating top toolbar */}
        <Box sx={{
          position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap', pointerEvents: 'none',
        }}>
          <Box sx={{ display: 'flex', gap: 0.8, pointerEvents: 'auto' }}>
            <Tooltip title={drawerOpen ? 'Hide sidebar' : 'Show sidebar'}>
              <IconButton
                onClick={() => setDrawerOpen(!drawerOpen)}
                sx={{ bgcolor: 'white', boxShadow: 2, '&:hover': { bgcolor: '#F8FAFC' } }}
              >
                {drawerOpen ? <VisibilityOffIcon sx={{ fontSize: 18, color: NAVY }} /> : <VisibilityIcon sx={{ fontSize: 18, color: NAVY }} />}
              </IconButton>
            </Tooltip>
            <Paper sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, bgcolor: 'white', boxShadow: 2 }}>
              <LayersIcon sx={{ fontSize: 16, color: GOLD }} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: NAVY }}>
                {filteredFeatures.length}<span style={{ color: '#94A3B8', fontWeight: 500 }}> / {data?.total || 0} lots visible</span>
              </Typography>
              {stats.overlapCount > 0 && (
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: 14, color: 'white !important' }} />}
                  label={`${stats.overlapCount} overlap${stats.overlapCount === 1 ? '' : 's'}`}
                  size="small"
                  onClick={() => setShowOverlapsOnly(true)}
                  sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: OVERLAP_STYLE.color, color: 'white', cursor: 'pointer' }}
                />
              )}
            </Paper>
          </Box>

          <Box sx={{ display: 'flex', gap: 0.6, pointerEvents: 'auto' }}>
            <ToggleButtonGroup
              value={mapType}
              exclusive
              onChange={handleMapTypeChange}
              size="small"
              sx={{ bgcolor: 'white', boxShadow: 2 }}
            >
              <ToggleButton value="hybrid" sx={{ px: 1.2 }}>
                <SatelliteAltIcon sx={{ fontSize: 16, mr: 0.5 }} /> Satellite
              </ToggleButton>
              <ToggleButton value="roadmap" sx={{ px: 1.2 }}>
                <MapIcon sx={{ fontSize: 16, mr: 0.5 }} /> Map
              </ToggleButton>
              <ToggleButton value="terrain" sx={{ px: 1.2 }}>
                <TerrainIcon sx={{ fontSize: 16, mr: 0.5 }} /> Terrain
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Map */}
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={PH_CENTER}
          zoom={PH_ZOOM}
          mapTypeId={mapType}
          onLoad={(map) => {
            mapRef.current = map
            setCurrentZoom(map.getZoom() || PH_ZOOM)
          }}
          onZoomChanged={() => {
            const z = mapRef.current?.getZoom()
            if (typeof z === 'number') setCurrentZoom(z)
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'greedy',
            // Slight desaturation for non-satellite maps so polygons pop
            styles: mapType === 'roadmap' ? [{ stylers: [{ saturation: -25 }] }] : [],
          }}
        >
          {filteredFeatures.flatMap(f => {
            const p = f.properties || {}
            const hasOverlap = !!overlapsByFeature[f.id]
            const isSelected = f.id === selectedId
            const isHovered  = f.id === hoveredId
            const st = hasOverlap ? OVERLAP_STYLE : styleForStatus(p.status)

            // Bigger circles + larger again on hover/select
            const baseScale = 10
            const markerScale = isSelected ? 16 : isHovered ? 14 : baseScale

            if (f.geometry?.type === 'Polygon') {
              const path = f.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }))
              const out = [
                <Polygon
                  key={`poly-${f.id}`}
                  paths={path}
                  options={{
                    fillColor:    st.color,
                    fillOpacity:  st.fill + (isSelected ? 0.25 : isHovered ? 0.15 : 0),
                    strokeColor:  st.color,
                    strokeWeight: isSelected ? st.weight + 2 : isHovered ? st.weight + 1 : st.weight,
                    strokeOpacity: 0.95,
                    clickable: true,
                    zIndex: hasOverlap ? 5 : isSelected ? 6 : isHovered ? 4 : 2,
                  }}
                  onClick={() => handleSelectFeature(f.id)}
                  onMouseOver={() => handleHover(f.id)}
                  onMouseOut={handleHoverOut}
                />,
              ]
              if (showPinsForPolygons && showPins && p.centroid) {
                out.push(
                  <Marker
                    key={`ring-${f.id}`}
                    position={{ lat: p.centroid.lat, lng: p.centroid.lng }}
                    clickable={false}
                    zIndex={hasOverlap ? 50 : isSelected ? 40 : 10}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.CIRCLE,
                      scale: markerScale + 6,
                      fillColor: hasOverlap ? OVERLAP_STYLE.color : st.color,
                      fillOpacity: isSelected ? 0.35 : isHovered ? 0.25 : 0.15,
                      strokeColor: hasOverlap ? OVERLAP_STYLE.color : st.color,
                      strokeOpacity: 0.5,
                      strokeWeight: 1,
                    }}
                  />,
                  <Marker
                    key={`pin-${f.id}`}
                    position={{ lat: p.centroid.lat, lng: p.centroid.lng }}
                    zIndex={hasOverlap ? 100 : isSelected ? 90 : 60}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.CIRCLE,
                      scale: markerScale,
                      fillColor: hasOverlap ? OVERLAP_STYLE.color : st.color,
                      fillOpacity: 1,
                      strokeColor: '#FFFFFF',
                      strokeWeight: isSelected ? 3.5 : 2.5,
                    }}
                    onClick={() => handleSelectFeature(f.id)}
                    onMouseOver={() => handleHover(f.id)}
                    onMouseOut={handleHoverOut}
                  />
                )
              }
              return out
            }
            // Pin-only feature (no polygon)
            return [
              <Marker
                key={`ring-${f.id}`}
                position={{ lat: p.centroid.lat, lng: p.centroid.lng }}
                clickable={false}
                zIndex={hasOverlap ? 50 : isSelected ? 40 : 10}
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE,
                  scale: markerScale + 6,
                  fillColor: hasOverlap ? OVERLAP_STYLE.color : st.color,
                  fillOpacity: isSelected ? 0.35 : isHovered ? 0.25 : 0.15,
                  strokeColor: hasOverlap ? OVERLAP_STYLE.color : st.color,
                  strokeOpacity: 0.5,
                  strokeWeight: 1,
                }}
              />,
              <Marker
                key={`marker-${f.id}`}
                position={{ lat: p.centroid.lat, lng: p.centroid.lng }}
                onClick={() => handleSelectFeature(f.id)}
                onMouseOver={() => handleHover(f.id)}
                onMouseOut={handleHoverOut}
                zIndex={hasOverlap ? 100 : isSelected ? 90 : 60}
                icon={{
                  path: window.google?.maps?.SymbolPath?.CIRCLE,
                  scale: markerScale,
                  fillColor: hasOverlap ? OVERLAP_STYLE.color : st.color,
                  fillOpacity: 1,
                  strokeColor: '#FFFFFF',
                  strokeWeight: isSelected ? 3.5 : 2.5,
                }}
              />,
            ]
          })}

          {/* Hover preview tooltip — floats above the centroid */}
          {hoveredId !== null && hoveredId !== selectedId && (() => {
            const f = data?.features?.find(x => x.id === hoveredId)
            if (!f?.properties?.centroid) return null
            return (
              <OverlayView
                key={`hover-${hoveredId}`}
                position={{ lat: f.properties.centroid.lat, lng: f.properties.centroid.lng }}
                mapPaneName={OverlayView.FLOAT_PANE}
                getPixelPositionOffset={(w, h) => ({ x: -(w / 2), y: -(h + 28) })}
              >
                <HoverPreviewCard feature={f} hasOverlap={!!overlapsByFeature[hoveredId]} />
              </OverlayView>
            )
          })()}
        </GoogleMap>

        {/* Selected-property detail card (bottom-right) */}
        <AnimatePresence>
          {selectedFeature && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 11, maxWidth: 'calc(100% - 32px)' }}
            >
              <FeatureCard
                feature={selectedFeature}
                overlaps={overlapsByFeature[selectedFeature.id] || []}
                onClose={() => setSelectedId(null)}
                onOpen={(txId) => navigate(`/admin/transactions/${txId}`)}
                onJumpTo={handleSelectFeature}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating "Back to overview" button — only when zoomed in past the country view */}
        <AnimatePresence>
          {isZoomedIn && (
            <motion.div
              initial={{ x: -120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -120, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ position: 'absolute', bottom: 24, left: 24, zIndex: 12 }}
            >
              <Button
                onClick={handleResetView}
                startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
                endIcon={<PublicIcon sx={{ fontSize: 16, opacity: 0.7 }} />}
                sx={{
                  bgcolor: 'white',
                  color: NAVY,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  px: 2, py: 1,
                  borderRadius: 99,
                  boxShadow: '0 6px 18px rgba(10,22,40,0.25)',
                  border: `1.5px solid ${GOLD}55`,
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: GOLD, boxShadow: '0 8px 22px rgba(10,22,40,0.32)' },
                }}
              >
                Back to overview
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Export menu */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('geojson')}>
          <ListItemIcon><Box sx={{ fontSize: 11, fontWeight: 800, color: GOLD_DARK }}>GIS</Box></ListItemIcon>
          <ListItemText primary=".geojson" secondary="QGIS, ArcGIS, Mapbox" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('kml')}>
          <ListItemIcon><Box sx={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>EARTH</Box></ListItemIcon>
          <ListItemText primary=".kml" secondary="Google Earth, Maps" />
        </MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>
          <ListItemIcon><Box sx={{ fontSize: 11, fontWeight: 800, color: '#2563EB' }}>CSV</Box></ListItemIcon>
          <ListItemText primary=".csv" secondary="Excel, Sheets" />
        </MenuItem>
      </Menu>
    </Box>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────── */

function HoverPreviewCard({ feature, hasOverlap }) {
  const p = feature.properties || {}
  const st = hasOverlap ? OVERLAP_STYLE : styleForStatus(p.status)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      style={{
        background: 'white',
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(10,22,40,0.30)',
        border: `1.5px solid ${st.color}`,
        padding: '8px 12px',
        minWidth: 200,
        maxWidth: 260,
        pointerEvents: 'none',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {p.transaction_code || `LOT #${feature.id}`}
      </div>
      <div style={{ fontWeight: 800, fontSize: 13, color: NAVY, lineHeight: 1.2, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {p.title_number || 'No title number'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', marginTop: 6, fontSize: 10.5, lineHeight: 1.4 }}>
        <span style={{ color: '#94A3B8' }}>Owner</span>
        <strong style={{ color: '#0A1628', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {p.registered_owner || '—'}
        </strong>
        <span style={{ color: '#94A3B8' }}>Area</span>
        <strong style={{ color: '#0A1628' }}>
          {Number.isFinite(p.land_area) && p.land_area > 0
            ? (p.land_area >= 10000
                ? `${(p.land_area / 10000).toFixed(2)} ha`
                : `${p.land_area.toLocaleString()} sqm`)
            : '—'}
        </strong>
        <span style={{ color: '#94A3B8' }}>Type</span>
        <strong style={{ color: '#0A1628', textTransform: 'capitalize' }}>{p.property_type || '—'}</strong>
        <span style={{ color: '#94A3B8' }}>Status</span>
        <strong style={{ color: st.color, textTransform: 'capitalize', fontWeight: 700 }}>{p.status || '—'}</strong>
      </div>
      {hasOverlap && (
        <div style={{
          marginTop: 6, padding: '4px 6px', borderRadius: 6,
          background: '#FEE2E2', color: '#991B1B',
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ⚠ Overlap detected
        </div>
      )}
      <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 6, fontStyle: 'italic' }}>
        Click to zoom in →
      </div>
      {/* Arrow */}
      <div style={{
        position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop: `7px solid ${st.color}`,
      }} />
    </motion.div>
  )
}

function StatTile({ icon, value, label, tint, alert = false }) {
  return (
    <Box sx={{
      p: 0.8, borderRadius: 1.5, bgcolor: 'background.paper',
      border: 1, borderColor: alert ? `${tint}55` : 'divider',
      boxShadow: alert ? `0 0 0 2px ${tint}22` : 'none',
      textAlign: 'center',
    }}>
      <Box sx={{ color: tint, mb: 0.2 }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: 'text.primary', lineHeight: 1.1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.58rem', color: 'text.secondary', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
    </Box>
  )
}

function FeatureCard({ feature, overlaps, onClose, onOpen, onJumpTo }) {
  const p = feature.properties || {}
  const st = styleForStatus(p.status)
  const lat = p.centroid?.lat
  const lng = p.centroid?.lng

  return (
    <Paper sx={{
      width: 360, maxWidth: '95vw',
      bgcolor: 'background.paper',
      boxShadow: '0 20px 60px rgba(10,22,40,0.30)',
      overflow: 'hidden',
      border: 1, borderColor: 'divider',
    }}>
      {/* Status bar */}
      <Box sx={{ height: 4, bgcolor: st.color }} />

      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Avatar sx={{ bgcolor: `${st.color}22`, color: st.color, width: 36, height: 36, fontSize: '0.8rem' }}>
          {(() => {
            const s = p.status || ''
            if (s === 'approved' || s === 'released') return <VerifiedIcon sx={{ fontSize: 18 }} />
            if (s === 'rejected') return <BlockIcon sx={{ fontSize: 18 }} />
            return <HourglassEmptyIcon sx={{ fontSize: 18 }} />
          })()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.12em' }}>
            {p.transaction_code || `LOT #${feature.id}`} · <span style={{ textTransform: 'capitalize', color: st.color }}>{p.status}</span>
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'text.primary', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.title_number || 'No title number'}
          </Typography>
          {(p.lot_number || p.block_number) && (
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.2 }}>
              {p.lot_number && `Lot ${p.lot_number}`}{p.lot_number && p.block_number && ' · '}{p.block_number && `Block ${p.block_number}`}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <Divider />

      <Box sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px' }}>
        <DetailRow label="Owner"    value={p.registered_owner || '—'} />
        <DetailRow label="Type"     value={p.property_type ? <span style={{ textTransform: 'capitalize' }}>{p.property_type}</span> : '—'} />
        <DetailRow label="Area"     value={fmtArea(p.land_area)} icon={<StraightenIcon sx={{ fontSize: 13 }} />} />
        {p.price && <DetailRow label="Asking" value={peso(p.price)} />}
        <DetailRow label="Address"  value={[p.barangay, p.city_municipality, p.province].filter(Boolean).join(', ') || '—'} />
        <DetailRow label="Submitted" value={p.submitted_by || '—'} />
        <DetailRow label="Pin (DMS)" value={
          Number.isFinite(lat) && Number.isFinite(lng)
            ? <span style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{formatCoordsDMS(lat, lng)}</span>
            : '—'
        } />
      </Box>

      {overlaps.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2, py: 1.3, bgcolor: '#FEE2E2' }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.6 }}>
              <WarningAmberIcon sx={{ fontSize: 16 }} /> Overlapping titles detected ({overlaps.length})
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {overlaps.slice(0, 8).map(o => (
                <Chip
                  key={o.id}
                  label={o.title || o.code || `#${o.id}`}
                  size="small"
                  onClick={() => onJumpTo(o.id)}
                  sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: 'white', border: '1px solid #FCA5A5', color: '#991B1B', cursor: 'pointer' }}
                />
              ))}
            </Stack>
          </Box>
        </>
      )}

      <Divider />
      <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <SurveyPdfButton
          transactionId={p.transaction_id}
          transaction={{ user: { name: p.submitted_by }, transaction_code: p.transaction_code }}
          size="small"
          variant="contained"
          fullWidth
          label="Generate Survey PDF"
        />
        <Button
          size="small" fullWidth
          variant="outlined" color="primary"
          startIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
          onClick={() => onOpen(p.transaction_id)}
          sx={{ fontWeight: 700 }}
        >
          Open transaction
        </Button>
      </Box>
    </Paper>
  )
}

function DetailRow({ label, value, icon }) {
  return (
    <>
      <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, pt: 0.3, display: 'flex', alignItems: 'center', gap: 0.3 }}>
        {icon}{label}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', color: 'text.primary', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </Typography>
    </>
  )
}
