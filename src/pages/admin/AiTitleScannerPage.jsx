import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { GoogleMap, Polygon, Polyline, Marker, useJsApiLoader } from '@react-google-maps/api'
import {
  Box, Paper, Typography, Button, IconButton,
  TextField, Stack, Chip, Divider, Alert, CircularProgress, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select,
  Card, CardContent, ToggleButtonGroup, ToggleButton, useTheme, useMediaQuery,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import MapIcon from '@mui/icons-material/Map'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import PlaceIcon from '@mui/icons-material/Place'
import PinDropIcon from '@mui/icons-material/PinDrop'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import TerrainIcon from '@mui/icons-material/Terrain'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon   from '@mui/icons-material/ArrowBack'
import { motion, AnimatePresence } from 'framer-motion'
import { GOLD, GOLD_DARK, NAVY } from '../../theme/theme'
import { GOOGLE_MAPS_LIBRARIES as LIBRARIES } from '../../utils/mapsLibraries'
import { scanTitleImage } from '../../utils/openaiVision'
import { plotPolygonFromBearings, closureError, cornersToGeoJsonPolygon, quadrantToTrueBearing, destinationPoint, parseTieLine } from '../../utils/bearingsPlotter'
import { suggestClosureFixes } from '../../utils/closureAutoFix'
import { parseCoordinates, formatCoordsDMS } from '../../utils/coordinates'
import { polygonAreaSqm } from '../../utils/polygonGis'
import { useToast } from '../../context/ToastContext'
import SurveyPdfButton from '../../components/SurveyPdfButton'
import BearingsSketch from '../../components/BearingsSketch'

const PH_CENTER = { lat: 12.8797, lng: 121.7740 }
const GOLD_GRADIENT = `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`

const STEP_META = [
  { label: 'Upload Title',    short: 'Upload',  icon: CloudUploadIcon },
  { label: 'Review Data',     short: 'Review',  icon: FactCheckIcon },
  { label: 'Pin Start Point', short: 'Pin',     icon: PinDropIcon },
  { label: 'Plotted Result',  short: 'Result',  icon: TerrainIcon },
]

/* ════════════════════════════════════════════════════════════════════
   Shared visual building blocks
   ════════════════════════════════════════════════════════════════════ */

/** Glass-style panel that adapts to light/dark and floats in with a soft rise. */
function GlassPanel({ children, sx, delay = 0, ...rest }) {
  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      elevation={0}
      sx={(theme) => ({
        borderRadius: 4,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(201,162,74,0.18)' : 'rgba(10,22,40,0.07)',
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'background.paper',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 18px 50px -28px rgba(0,0,0,0.8)'
          : '0 18px 50px -32px rgba(10,22,40,0.35)',
        ...(typeof sx === 'function' ? sx(theme) : sx),
      })}
      {...rest}
    >
      {children}
    </Paper>
  )
}

/** Small uppercase eyebrow + bold title used as section headers. */
function PanelHeader({ kicker, title, icon, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.4, alignItems: 'center' }}>
        {icon && (
          <Box sx={{
            width: 38, height: 38, borderRadius: 2.2, flexShrink: 0,
            background: GOLD_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 18px -6px ${GOLD}cc`,
          }}>
            {icon}
          </Box>
        )}
        <Box>
          {kicker && (
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.16em' }}>
              {kicker}
            </Typography>
          )}
          <Typography sx={{ fontWeight: 800, fontSize: '1.02rem', color: 'text.primary', lineHeight: 1.2 }}>
            {title}
          </Typography>
        </Box>
      </Box>
      {action}
    </Box>
  )
}

/** Animated number that eases up from 0 — used for the result stats. */
function CountUp({ value, decimals = 0, duration = 1, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const to = Number(value) || 0
    let raf, start
    const tick = (t) => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / (duration * 1000))
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(to * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{display.toLocaleString('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</>
}

/* ════════════════════════════════════════════════════════════════════
   Hero — animated aurora background + custom glowing step rail
   ════════════════════════════════════════════════════════════════════ */
function ScannerHero({ step, onRestart }) {
  const n = STEP_META.length
  const edge = 100 / (2 * n)
  const span = 100 - 2 * edge
  const fillW = n > 1 ? (step / (n - 1)) * span : 0

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 4,
        background: `linear-gradient(135deg, ${NAVY} 0%, #0B1A30 45%, #05080F 100%)`,
        color: 'white', position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(201,162,74,0.22)',
      }}
    >
      {/* Drifting aurora glow */}
      <motion.div
        animate={{ x: ['-12%', '12%', '-12%'], y: ['-8%', '10%', '-8%'], rotate: [0, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-40%', right: '-10%', width: 520, height: 520,
          background: `radial-gradient(circle, ${GOLD}33 0%, transparent 62%)`,
          filter: 'blur(8px)', pointerEvents: 'none',
        }}
      />
      {/* Faint survey grid */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.10, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${GOLD} 1px, transparent 1px), linear-gradient(90deg, ${GOLD} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at 70% 0%, black, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 70% 0%, black, transparent 75%)',
      }} />

      <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box
          component={motion.div}
          animate={{ boxShadow: [`0 0 0 0 ${GOLD}55`, `0 0 0 14px ${GOLD}00`] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
          sx={{
            width: 56, height: 56, borderRadius: 2.5, background: GOLD_GRADIENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <AutoAwesomeIcon sx={{ color: NAVY, fontSize: 30 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 240 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, letterSpacing: '0.2em' }}>
            AI-POWERED · LAND TITLE INTELLIGENCE
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', md: '1.55rem' }, lineHeight: 1.12, mt: 0.4 }}>
            From paper title to a{' '}
            <Box component="span" sx={{
              background: `linear-gradient(90deg, ${GOLD}, #F5E6C4, ${GOLD})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              plotted parcel
            </Box>
            {' '}— in seconds.
          </Typography>
        </Box>
        {step > 0 && (
          <Button
            variant="outlined" startIcon={<RestartAltIcon />} onClick={onRestart}
            sx={{
              color: GOLD, borderColor: 'rgba(201,162,74,0.5)', fontWeight: 700, borderRadius: 2,
              '&:hover': { borderColor: GOLD, bgcolor: 'rgba(201,162,74,0.1)' },
            }}
          >
            Start Over
          </Button>
        )}
      </Box>

      {/* Custom step rail */}
      <Box sx={{ position: 'relative', mt: 3.5 }}>
        <Box sx={{ position: 'absolute', top: 22, left: `${edge}%`, right: `${edge}%`, height: 3, bgcolor: 'rgba(255,255,255,0.14)', borderRadius: 2 }} />
        <Box
          component={motion.div}
          animate={{ width: `${fillW}%` }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          sx={{ position: 'absolute', top: 22, left: `${edge}%`, height: 3, borderRadius: 2, background: `linear-gradient(90deg, ${GOLD_DARK}, ${GOLD})`, boxShadow: `0 0 12px ${GOLD}aa` }}
        />
        <Box sx={{ display: 'flex', position: 'relative' }}>
          {STEP_META.map((s, i) => {
            const Icon = s.icon
            const active = i === step
            const done = i < step
            return (
              <Box key={s.label} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box
                  component={motion.div}
                  animate={active
                    ? { scale: [1, 1.08, 1], boxShadow: [`0 0 0 0 ${GOLD}66`, `0 0 0 10px ${GOLD}00`] }
                    : { scale: 1 }}
                  transition={active ? { duration: 2, repeat: Infinity, ease: 'easeOut' } : { duration: 0.3 }}
                  sx={{
                    width: 46, height: 46, borderRadius: '50%', zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: (active || done) ? GOLD_GRADIENT : 'rgba(255,255,255,0.07)',
                    border: '1px solid', borderColor: (active || done) ? 'transparent' : 'rgba(255,255,255,0.18)',
                  }}
                >
                  {done
                    ? <CheckCircleIcon sx={{ color: NAVY, fontSize: 24 }} />
                    : <Icon sx={{ color: active ? NAVY : 'rgba(255,255,255,0.55)', fontSize: 22 }} />}
                </Box>
                <Typography sx={{
                  fontSize: { xs: '0.62rem', sm: '0.72rem' }, fontWeight: active ? 800 : 600, textAlign: 'center',
                  color: active ? GOLD : done ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)',
                }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{s.label}</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{s.short}</Box>
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>
    </Paper>
  )
}

/* ════════════════════════════════════════════════════════════════════
   Main page
   ════════════════════════════════════════════════════════════════════ */
export default function AiTitleScannerPage() {
  const toast = useToast()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [step, setStep] = useState(0)
  const [files, setFiles] = useState([])           // uploaded title images (1 or 2)
  const [scanning, setScanning] = useState(false)
  const [extracted, setExtracted] = useState(null) // structured AI output
  const [startPoint, setStartPoint] = useState(null) // {lat, lng}
  const [coordInput, setCoordInput] = useState('')
  const [coordError, setCoordError] = useState(false)
  const [mapType, setMapType] = useState('satellite')
  const [rotation, setRotation] = useState(0)       // fine-tune rotation (deg) on the result map

  const mapRef    = useRef(null)
  const resultRef = useRef(null)

  /* ─── Step 1: Upload + AI scan ────────────────────────────────────── */
  const onDrop = useCallback((accepted) => {
    if (!accepted?.length) return
    // Cap at 2 files (front + back)
    const next = [...files, ...accepted].slice(0, 2)
    setFiles(next)
  }, [files])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  })

  const handleScan = async () => {
    if (!files.length) return
    setScanning(true)
    try {
      const result = await scanTitleImage(files)
      setExtracted(result)
      setStep(1)
      const found = (result.bearings || []).length
      toast.success(`AI extracted ${found} bearing${found === 1 ? '' : 's'} (${result.confidence} confidence).`)
    } catch (err) {
      toast.error(err.message || 'AI scan failed. Try a clearer image.')
    } finally {
      setScanning(false)
    }
  }

  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx))

  /* ─── Step 2: Editable extracted fields ──────────────────────────── */
  const updateField = (key, value) => setExtracted(prev => ({ ...prev, [key]: value }))
  const updateBearing = (idx, key, value) => setExtracted(prev => {
    const next = { ...prev, bearings: prev.bearings.map((b, i) => i === idx ? { ...b, [key]: value } : b) }
    return next
  })
  const addBearing = () => setExtracted(prev => {
    const nextNo = String((prev.bearings?.length || 0) + 1)
    const fromN = String(prev.bearings?.length || 0)
    return {
      ...prev,
      bearings: [
        ...(prev.bearings || []),
        { point_from: fromN || '1', point_to: nextNo, dir1: 'N', degrees: 0, minutes: 0, dir2: 'E', distance: 0, conf: 'high' },
      ],
    }
  })
  const removeBearing = (idx) => setExtracted(prev => ({
    ...prev,
    bearings: prev.bearings.filter((_, i) => i !== idx),
  }))
  /** Bulk-replace bearings — used by the closure auto-fix suggestions. */
  const applyBearings = (bearings) => setExtracted(prev => ({ ...prev, bearings }))

  /* ─── Step 3: Start point selection ──────────────────────────────── */
  const handleMapClick = useCallback((e) => {
    setStartPoint({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }, [])

  const handleCoordSubmit = () => {
    const parsed = parseCoordinates(coordInput)
    if (!parsed) { setCoordError(true); return }
    setCoordError(false)
    setStartPoint(parsed)
    setCoordInput('')
    if (mapRef.current) {
      mapRef.current.panTo(parsed)
      mapRef.current.setZoom(19)
    }
  }

  const handleLocate = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setStartPoint(pt)
      if (mapRef.current) {
        mapRef.current.panTo(pt)
        mapRef.current.setZoom(19)
      }
    })
  }

  /* ─── Step 4: Compute the plotted polygon ────────────────────────── */
  const plotted = useMemo(() => {
    if (!startPoint || !extracted?.bearings?.length) return null
    const corners = plotPolygonFromBearings(startPoint, extracted.bearings, rotation)
    const closure = closureError(corners)
    const feature = cornersToGeoJsonPolygon(corners)
    const ring = feature?.geometry?.coordinates?.[0] || []
    const area = polygonAreaSqm(ring.slice(0, -1))  // omit closing duplicate
    return { corners, closure, feature, area }
  }, [startPoint, extracted, rotation])

  // Auto-fit the satellite view to the plotted polygon on entering step 4
  useEffect(() => {
    if (step !== 3 || !plotted || !resultRef.current || !window.google?.maps) return
    const bounds = new window.google.maps.LatLngBounds()
    plotted.corners.forEach(c => bounds.extend(c))
    setTimeout(() => resultRef.current.fitBounds(bounds, 80), 120)
  }, [step, plotted])

  /**
   * Build a synthetic PropertyMap record from the extraction + plotted polygon
   * so the shared SurveyPdfButton can render the same branded preview dialog
   * we use from the GIS map. Includes `boundaries` so the button skips its
   * normal /transactions/.../property-map fetch.
   */
  const syntheticMap = useMemo(() => {
    if (!extracted || !plotted) return null
    return {
      id: 0,
      title_number:       extracted.title_number,
      lot_number:         extracted.lot_number,
      block_number:       extracted.block_number,
      survey_plan_number: extracted.survey_plan_number,
      registered_owner:   extracted.registered_owner,
      land_area:          extracted.land_area_sqm || plotted.area || null,
      province:           extracted.province,
      city_municipality:  extracted.city_municipality,
      barangay:           extracted.barangay,
      full_address:       extracted.full_address,
      latitude:           startPoint?.lat,
      longitude:          startPoint?.lng,
      geojson_polygon:    plotted.feature || null,
      boundaries:         (extracted.bearings || []).map((b, i) => ({ ...b, sort_order: i })),
    }
  }, [extracted, plotted, startPoint])

  const handleRestart = () => {
    setStep(0)
    setFiles([])
    setExtracted(null)
    setStartPoint(null)
    setCoordInput('')
    setRotation(0)
  }

  /* ─── UI ──────────────────────────────────────────────────────────── */
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: 'calc(100vh - 56px)', position: 'relative' }}>
      {/* Ambient page glow */}
      <Box sx={{
        position: 'absolute', top: 0, right: 0, width: 480, height: 480, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(circle at 70% 20%, ${GOLD}14 0%, transparent 60%)`,
      }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <ScannerHero step={step} onRestart={handleRestart} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -26 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            {step === 0 && (
              <StepUpload
                files={files}
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                isDragActive={isDragActive}
                onRemove={removeFile}
                onScan={handleScan}
                scanning={scanning}
              />
            )}

            {step === 1 && extracted && (
              <StepReview
                extracted={extracted}
                onUpdate={updateField}
                onUpdateBearing={updateBearing}
                onAddBearing={addBearing}
                onRemoveBearing={removeBearing}
                onApplyBearings={applyBearings}
                onBack={() => setStep(0)}
                onNext={() => setStep(2)}
              />
            )}

            {step === 2 && (
              <StepPin
                isLoaded={isLoaded}
                extracted={extracted}
                startPoint={startPoint}
                setStartPoint={setStartPoint}
                coordInput={coordInput}
                setCoordInput={setCoordInput}
                coordError={coordError}
                setCoordError={setCoordError}
                onCoordSubmit={handleCoordSubmit}
                onLocate={handleLocate}
                onMapClick={handleMapClick}
                mapType={mapType}
                setMapType={setMapType}
                mapRef={mapRef}
                onBack={() => setStep(1)}
                onNext={() => setStep(3)}
              />
            )}

            {step === 3 && plotted && extracted && (
              <StepResult
                isLoaded={isLoaded}
                extracted={extracted}
                plotted={plotted}
                startPoint={startPoint}
                setStartPoint={setStartPoint}
                rotation={rotation}
                setRotation={setRotation}
                onApplyBearings={applyBearings}
                resultRef={resultRef}
                syntheticMap={syntheticMap}
                onBack={() => setStep(2)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 1 — Upload  (+ the headline document-scanner animation)
   ════════════════════════════════════════════════════════════════════ */

/** Viewfinder corner bracket — four of these frame the document while scanning. */
function CornerBracket({ pos }) {
  const base = { position: 'absolute', width: 26, height: 26, borderColor: GOLD, pointerEvents: 'none' }
  const map = {
    tl: { top: 10, left: 10, borderTop: '3px solid', borderLeft: '3px solid', borderTopLeftRadius: 6 },
    tr: { top: 10, right: 10, borderTop: '3px solid', borderRight: '3px solid', borderTopRightRadius: 6 },
    bl: { bottom: 10, left: 10, borderBottom: '3px solid', borderLeft: '3px solid', borderBottomLeftRadius: 6 },
    br: { bottom: 10, right: 10, borderBottom: '3px solid', borderRight: '3px solid', borderBottomRightRadius: 6 },
  }
  return (
    <Box
      component={motion.div}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      sx={{ ...base, ...map[pos] }}
    />
  )
}

/** The scanning overlay placed over each uploaded title image. */
function ScanOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {/* Darken for contrast */}
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,8,15,0.55), rgba(5,8,15,0.35))' }} />
      {/* Moving survey grid */}
      <Box
        component={motion.div}
        animate={{ backgroundPositionY: ['0px', '22px'] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
        sx={{
          position: 'absolute', inset: 0, opacity: 0.3,
          backgroundImage: `linear-gradient(${GOLD}33 1px, transparent 1px), linear-gradient(90deg, ${GOLD}33 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
        }}
      />
      {/* Viewfinder brackets */}
      <CornerBracket pos="tl" /><CornerBracket pos="tr" /><CornerBracket pos="bl" /><CornerBracket pos="br" />

      {/* Sweeping laser band (bright core + soft glow) */}
      <motion.div
        animate={{ top: ['-12%', '100%'] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ position: 'absolute', left: 0, right: 0, height: 86 }}
      >
        <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent, ${GOLD}22 42%, ${GOLD} 50%, ${GOLD}22 58%, transparent)` }} />
        <Box sx={{
          position: 'absolute', left: 0, right: 0, top: '50%', height: 2,
          background: `linear-gradient(90deg, transparent, ${GOLD}, #FFF7E0, ${GOLD}, transparent)`,
          boxShadow: `0 0 18px 5px ${GOLD}99`,
        }} />
      </motion.div>

      {/* Live scanning tag */}
      <Box sx={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 0.8, px: 1, py: 0.4, borderRadius: 1.5, bgcolor: 'rgba(5,8,15,0.6)', border: `1px solid ${GOLD}55` }}>
        <Box component={motion.div} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: GOLD }} />
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, letterSpacing: '0.14em' }}>SCANNING</Typography>
      </Box>
    </motion.div>
  )
}

/** Immersive status strip shown under the images while the AI reads. */
const SCAN_MESSAGES = [
  'Reading the title number…',
  'Identifying the registered owner…',
  'Locating the technical description…',
  'Parsing the bearings table…',
  'Cross-checking distances and land area…',
  'Rating per-field confidence…',
]
function ScanningBanner() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => i + 1), 2300)
    return () => clearInterval(t)
  }, [])
  const msg = SCAN_MESSAGES[idx % SCAN_MESSAGES.length]
  return (
    <Box sx={{
      mt: 2.5, p: 2, borderRadius: 3, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(135deg, ${NAVY} 0%, #0B1A30 100%)`, border: `1px solid ${GOLD}33`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component={motion.div}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          sx={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: GOLD_GRADIENT }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 18, color: NAVY }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, letterSpacing: '0.16em' }}>
            OPENAI VISION · WORKING
          </Typography>
          <AnimatePresence mode="wait">
            <motion.div
              key={msg}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{msg}</Typography>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
      {/* Indeterminate shimmer track */}
      <Box sx={{ mt: 1.5, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <Box
          component={motion.div}
          animate={{ x: ['-60%', '160%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          sx={{ width: '45%', height: '100%', borderRadius: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, #F5E6C4, ${GOLD}, transparent)` }}
        />
      </Box>
    </Box>
  )
}

function StepUpload({ files, getRootProps, getInputProps, isDragActive, onRemove, onScan, scanning }) {
  return (
    <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <PanelHeader
        kicker="STEP 1"
        title="Upload the Land Title"
        icon={<CloudUploadIcon sx={{ color: NAVY, fontSize: 22 }} />}
      />
      <Typography sx={{ fontSize: '0.86rem', color: 'text.secondary', mb: 2.5 }}>
        A clear photo or scan of the title page works best. Upload both <strong>front and back</strong> for higher accuracy.
      </Typography>

      <Box
        {...getRootProps()}
        component={motion.div}
        whileHover={{ scale: 1.005 }}
        sx={{
          position: 'relative', overflow: 'hidden',
          border: '2px dashed', borderColor: isDragActive ? GOLD : 'divider',
          borderRadius: 4, p: { xs: 3, md: 6 }, textAlign: 'center', cursor: 'pointer',
          bgcolor: isDragActive ? `${GOLD}14` : 'action.hover', transition: 'all 0.2s',
          '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}0a` },
        }}
      >
        <input {...getInputProps()} />
        <Box
          component={motion.div}
          animate={{ y: isDragActive ? [-4, 4, -4] : [0, -6, 0] }}
          transition={{ duration: isDragActive ? 0.6 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
          sx={{
            width: 76, height: 76, borderRadius: '50%', mx: 'auto', mb: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: GOLD_GRADIENT, boxShadow: `0 14px 36px -10px ${GOLD}cc`,
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 38, color: NAVY }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: '1.12rem', color: 'text.primary', mb: 0.6 }}>
          {isDragActive ? 'Drop the title image(s) here' : 'Drag a title image here, or click to browse'}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          JPG / PNG / WEBP · up to 20 MB each · up to 2 files (front + back)
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {files.map((f, i) => (
            <Card
              key={i}
              component={motion.div}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              elevation={0}
              sx={{ position: 'relative', overflow: 'hidden', borderRadius: 3, border: '1px solid', borderColor: scanning ? `${GOLD}66` : 'divider' }}
            >
              <Box sx={{ position: 'relative', height: 240, bgcolor: '#05080F' }}>
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <AnimatePresence>{scanning && <ScanOverlay key="scan" />}</AnimatePresence>
                {!scanning && (
                  <Tooltip title="Remove">
                    <IconButton
                      size="small"
                      onClick={() => onRemove(i)}
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: 'white' } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Box sx={{ px: 1.5, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.name}
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                  {(f.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {scanning && <ScanningBanner />}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 3 }}>
        <Button
          variant="contained"
          color="secondary"
          disabled={!files.length || scanning}
          onClick={onScan}
          startIcon={scanning ? <CircularProgress size={16} sx={{ color: NAVY }} /> : <AutoAwesomeIcon />}
          sx={{ fontWeight: 800, px: 3.5, py: 1.3, borderRadius: 2.5, fontSize: '0.92rem' }}
        >
          {scanning ? 'AI is reading the title…' : 'Scan with AI'}
        </Button>
      </Box>

      {!scanning && (
        <Alert severity="info" icon={<AutoAwesomeIcon />} sx={{ mt: 2.5, fontSize: '0.78rem', borderRadius: 2 }}>
          Powered by OpenAI Vision. The AI extracts the title number, lot number, registered owner, area, and the full bearings table.
          You'll get a chance to review and edit before plotting.
        </Alert>
      )}
    </GlassPanel>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 2 — Review & edit
   ════════════════════════════════════════════════════════════════════ */
function StepReview({ extracted, onUpdate, onUpdateBearing, onAddBearing, onRemoveBearing, onApplyBearings, onBack, onNext }) {
  const confColor = extracted.confidence === 'high' ? '#16A34A' : extracted.confidence === 'medium' ? '#D97706' : '#DC2626'
  const canContinue = (extracted.bearings || []).length >= 3

  // Live closure + single-edit fix suggestions, recomputed as rows are edited
  const fix = useMemo(() => suggestClosureFixes(extracted.bearings || []), [extracted.bearings])
  const closureColor = fix.before < 1.5 ? '#16A34A' : fix.before < 5 ? '#D97706' : '#DC2626'

  // Per-field confidence tinting — amber/red outline on fields the AI was unsure about
  const fieldConf = extracted.field_confidence || {}
  const CONF_TINT = {
    medium: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D97706', borderWidth: 2 } },
    low:    { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DC2626', borderWidth: 2 } },
  }
  const confSx = (key) => CONF_TINT[fieldConf[key]] || {}
  const hasUnsureFields = Object.values(fieldConf).some(c => c === 'medium' || c === 'low')
  const rowTint = (conf) =>
    conf === 'low' ? 'rgba(220,38,38,0.08)' : conf === 'medium' ? 'rgba(217,119,6,0.08)' : undefined

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr' }, gap: 2.5 }}>
      {/* Property fields */}
      <GlassPanel sx={{ p: { xs: 2.5, md: 3 } }}>
        <PanelHeader
          kicker="STEP 2 · EXTRACTED"
          title="Property Information"
          icon={<FactCheckIcon sx={{ color: NAVY, fontSize: 22 }} />}
          action={
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: 'white !important' }} />}
              label={`${extracted.confidence?.toUpperCase()} confidence`}
              size="small"
              sx={{ bgcolor: confColor, color: 'white', fontWeight: 700, fontSize: '0.65rem' }}
            />
          }
        />
        <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mb: hasUnsureFields ? 0.5 : 2 }}>
          Review what the AI read. Edit any field if it misread something.
        </Typography>
        {hasUnsureFields && (
          <Typography sx={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <WarningAmberIcon sx={{ fontSize: 15 }} />
            Fields outlined in amber or red are ones the AI was less sure about — double-check those first.
          </Typography>
        )}

        <Stack spacing={1.5}>
          <TextField size="small" label="Title Number"        value={extracted.title_number || ''}       onChange={(e) => onUpdate('title_number', e.target.value)} fullWidth sx={confSx('title_number')} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" label="Lot Number"        value={extracted.lot_number || ''}         onChange={(e) => onUpdate('lot_number', e.target.value)} fullWidth sx={confSx('lot_number')} />
            <TextField size="small" label="Block"             value={extracted.block_number || ''}       onChange={(e) => onUpdate('block_number', e.target.value)} sx={{ width: 100, ...confSx('block_number') }} />
          </Box>
          <TextField size="small" label="Survey Plan Number"  value={extracted.survey_plan_number || ''} onChange={(e) => onUpdate('survey_plan_number', e.target.value)} fullWidth sx={confSx('survey_plan_number')} />
          <TextField size="small" label="Registered Owner"    value={extracted.registered_owner || ''}   onChange={(e) => onUpdate('registered_owner', e.target.value)} fullWidth sx={confSx('registered_owner')} />
          <TextField size="small" label="Land Area (sqm)"     type="number" value={extracted.land_area_sqm ?? ''}
                     onChange={(e) => onUpdate('land_area_sqm', e.target.value === '' ? null : Number(e.target.value))} fullWidth sx={confSx('land_area_sqm')} />
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" label="Barangay"          value={extracted.barangay || ''}          onChange={(e) => onUpdate('barangay', e.target.value)} fullWidth sx={confSx('barangay')} />
            <TextField size="small" label="City/Municipality" value={extracted.city_municipality || ''} onChange={(e) => onUpdate('city_municipality', e.target.value)} fullWidth sx={confSx('city_municipality')} />
          </Box>
          <TextField size="small" label="Province"            value={extracted.province || ''}          onChange={(e) => onUpdate('province', e.target.value)} fullWidth sx={confSx('province')} />
          {extracted.tie_line && (
            <TextField size="small" label="Tie Line" value={extracted.tie_line} onChange={(e) => onUpdate('tie_line', e.target.value)} fullWidth multiline minRows={2} />
          )}
        </Stack>
      </GlassPanel>

      {/* Bearings table */}
      <GlassPanel sx={{ p: { xs: 2.5, md: 3 } }} delay={0.08}>
        <PanelHeader
          kicker="TECHNICAL DESCRIPTION"
          title={`${extracted.bearings?.length || 0} Bearings`}
          icon={<TerrainIcon sx={{ color: NAVY, fontSize: 22 }} />}
          action={
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={onAddBearing} sx={{ fontWeight: 700 }}>
              Add row
            </Button>
          }
        />

        {(!extracted.bearings || extracted.bearings.length < 3) && (
          <Alert severity="warning" sx={{ mb: 1.5, fontSize: '0.76rem', borderRadius: 2 }}>
            A polygon needs at least 3 bearings. {extracted.bearings?.length === 0 && 'The AI didn\'t find any — add them manually or re-scan a clearer image.'}
          </Alert>
        )}

        <Box sx={{ maxHeight: 420, overflow: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow sx={{ '& th': { bgcolor: 'action.hover', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em' } }}>
                <TableCell sx={{ width: 70 }}>Line</TableCell>
                <TableCell sx={{ width: 60 }}>N/S</TableCell>
                <TableCell sx={{ width: 70 }}>Deg</TableCell>
                <TableCell sx={{ width: 70 }}>Min</TableCell>
                <TableCell sx={{ width: 60 }}>E/W</TableCell>
                <TableCell sx={{ width: 110 }}>Distance (m)</TableCell>
                <TableCell sx={{ width: 40 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(extracted.bearings || []).map((b, i) => (
                <TableRow key={i} hover sx={{ bgcolor: rowTint(b.conf) }}>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                      {b.point_from}-{b.point_to}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Select size="small" value={b.dir1} onChange={(e) => onUpdateBearing(i, 'dir1', e.target.value)}
                            sx={{ '& .MuiSelect-select': { py: 0.5, fontSize: '0.78rem' } }}>
                      <MenuItem value="N">N</MenuItem>
                      <MenuItem value="S">S</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={b.degrees}
                               onChange={(e) => onUpdateBearing(i, 'degrees', Number(e.target.value))}
                               inputProps={{ min: 0, max: 89, step: 1 }}
                               sx={{ '& .MuiOutlinedInput-input': { py: 0.5, fontSize: '0.78rem' } }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={b.minutes}
                               onChange={(e) => onUpdateBearing(i, 'minutes', Number(e.target.value))}
                               inputProps={{ min: 0, max: 59.99, step: 0.01 }}
                               sx={{ '& .MuiOutlinedInput-input': { py: 0.5, fontSize: '0.78rem' } }} />
                  </TableCell>
                  <TableCell>
                    <Select size="small" value={b.dir2} onChange={(e) => onUpdateBearing(i, 'dir2', e.target.value)}
                            sx={{ '& .MuiSelect-select': { py: 0.5, fontSize: '0.78rem' } }}>
                      <MenuItem value="E">E</MenuItem>
                      <MenuItem value="W">W</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={b.distance}
                               onChange={(e) => onUpdateBearing(i, 'distance', Number(e.target.value))}
                               inputProps={{ min: 0, step: 0.01 }}
                               sx={{ '& .MuiOutlinedInput-input': { py: 0.5, fontSize: '0.78rem' } }} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => onRemoveBearing(i)} sx={{ color: '#DC2626' }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Live shape preview — redraws as rows are edited, so OCR slips are
            visible before the lot is ever pinned on the real map */}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>Live Shape Preview</Typography>
          {(extracted.bearings?.length || 0) >= 3 && (
            <Chip
              size="small"
              label={`Closure: ${fix.before.toFixed(2)} m`}
              sx={{ bgcolor: closureColor, color: 'white', fontWeight: 700, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        <BearingsSketch bearings={extracted.bearings} height={170} />

        {fix.suggestions.length > 0 && (
          <Alert severity="info" icon={<AutoFixHighIcon sx={{ fontSize: 18 }} />} sx={{ mt: 1.5, fontSize: '0.76rem', borderRadius: 2 }}>
            <strong>The traverse doesn't close ({fix.before.toFixed(1)} m gap)</strong> — likely a transcription slip.
            Applying a suggestion updates the table:
            <Stack spacing={0.6} sx={{ mt: 1 }}>
              {fix.suggestions.map((s, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.74rem' }}>
                    Line <strong>{s.line}</strong>: {s.label} → closes to <strong>{s.after.toFixed(2)} m</strong>
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => onApplyBearings(s.bearings)}
                          sx={{ fontWeight: 700, flexShrink: 0, py: 0 }}>
                    Apply
                  </Button>
                </Box>
              ))}
            </Stack>
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
          <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>Back</Button>
          <Button variant="contained" color="secondary" disabled={!canContinue} onClick={onNext}
                  endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 800, borderRadius: 2.5 }}>
            Looks good · Pin start point
          </Button>
        </Box>
      </GlassPanel>
    </Box>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 3 — Pin the starting point
   ════════════════════════════════════════════════════════════════════ */
function StepPin({
  isLoaded, extracted, startPoint, setStartPoint, coordInput, setCoordInput, coordError, setCoordError,
  onCoordSubmit, onLocate, onMapClick, mapType, setMapType, mapRef, onBack, onNext,
}) {
  // Push map-type changes through to the live SDK instance — @react-google-maps
  // sometimes ignores the prop on re-render at higher zoom levels.
  useEffect(() => {
    if (mapRef.current && mapType) mapRef.current.setMapTypeId(mapType)
  }, [mapType, mapRef])

  // Tie line (BLLM monument → corner 1), when the AI extracted a parseable one.
  // In "bllm" mode the user pins the monument and the system walks the tie
  // line to compute corner 1 automatically.
  const tie = useMemo(() => parseTieLine(extracted?.tie_line), [extracted?.tie_line])
  const [pinMode, setPinMode] = useState('corner')   // 'corner' | 'bllm'
  const [monument, setMonument] = useState(null)

  // Auto-center the map on the title's address so the user starts near the
  // lot instead of a whole-country view.
  const [geoCenter, setGeoCenter] = useState(null)
  const [geoLabel, setGeoLabel] = useState(null)
  const geocodedRef = useRef(false)
  useEffect(() => {
    if (!isLoaded || startPoint || geocodedRef.current || !window.google?.maps?.Geocoder) return
    const address = [extracted?.barangay, extracted?.city_municipality, extracted?.province].filter(Boolean).join(', ')
    if (!address) return
    geocodedRef.current = true
    new window.google.maps.Geocoder().geocode({ address: `${address}, Philippines` }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) return
      const loc = results[0].geometry.location
      const pt = { lat: loc.lat(), lng: loc.lng() }
      setGeoCenter(pt)
      setGeoLabel(results[0].formatted_address)
      if (mapRef.current) {
        mapRef.current.panTo(pt)
        mapRef.current.setZoom(15)
      }
    })
  }, [isLoaded, startPoint, extracted, mapRef])

  const placePin = useCallback((latLng) => {
    const pt = { lat: latLng.lat(), lng: latLng.lng() }
    if (pinMode === 'bllm' && tie) {
      setMonument(pt)
      const brng = quadrantToTrueBearing(tie.dir1, tie.degrees, tie.minutes, tie.dir2)
      setStartPoint(destinationPoint(pt.lat, pt.lng, brng, tie.distance))
    } else {
      onMapClick({ latLng })
    }
  }, [pinMode, tie, onMapClick, setStartPoint])

  return (
    <GlassPanel sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <PanelHeader
        kicker="STEP 3"
        title="Pin Corner #1 — the starting point"
        icon={<PinDropIcon sx={{ color: NAVY, fontSize: 22 }} />}
        action={
          <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small">
            <ToggleButton value="satellite"><SatelliteAltIcon sx={{ fontSize: 16, mr: 0.5 }} /> Satellite</ToggleButton>
            <ToggleButton value="roadmap"><MapIcon sx={{ fontSize: 16, mr: 0.5 }} /> Map</ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: -1, mb: 2 }}>
        Click on the satellite map to drop a pin, or paste coordinates below. The system walks the bearings from this point to plot the lot.
      </Typography>

      {tie && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={pinMode}
            exclusive
            size="small"
            onChange={(_, v) => { if (v) { setPinMode(v); setMonument(null) } }}
          >
            <ToggleButton value="corner" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Pin Corner 1</ToggleButton>
            <ToggleButton value="bllm" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Pin BLLM Monument</ToggleButton>
          </ToggleButtonGroup>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
            Tie line on title:{' '}
            <strong style={{ fontFamily: 'monospace' }}>
              {tie.dir1} {tie.degrees}°{String(Math.floor(tie.minutes)).padStart(2, '0')}&apos; {tie.dir2} · {tie.distance.toLocaleString('en-PH')} m
            </strong>
            {pinMode === 'bllm' && ' — click the monument location and the system walks the tie line to Corner 1 for you.'}
          </Typography>
        </Box>
      )}

      {geoLabel && !startPoint && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1 }}>
          <PlaceIcon sx={{ fontSize: 15, color: GOLD }} />
          <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>
            Auto-centered on <strong>{geoLabel}</strong> (from the title&apos;s address) — zoom in and click the exact spot.
          </Typography>
        </Box>
      )}

      <Box sx={{
        display: 'flex', gap: 1, mb: 1.5, p: 1.5, borderRadius: 2.5,
        bgcolor: 'action.hover', alignItems: 'flex-start', flexWrap: 'wrap',
      }}>
        <GpsFixedIcon sx={{ fontSize: 18, color: GOLD, mt: 0.7 }} />
        <TextField
          size="small"
          placeholder={`e.g. 9°37'46.46"N 123°49'29.97"E   or   9.629572, 123.824992`}
          value={coordInput}
          onChange={(e) => { setCoordInput(e.target.value); if (coordError) setCoordError(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onCoordSubmit() } }}
          error={coordError}
          helperText={coordError ? 'Could not parse — check the format' : ' '}
          sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-input': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
        />
        <Button onClick={onCoordSubmit} variant="contained" color="secondary" disabled={!coordInput.trim()} sx={{ fontWeight: 700 }}>
          Go
        </Button>
        <Button onClick={onLocate} startIcon={<MyLocationIcon sx={{ fontSize: 16 }} />} variant="outlined" sx={{ fontWeight: 700 }}>
          My Location
        </Button>
      </Box>

      <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', height: { xs: 340, md: 520 } }}>
        {!isLoaded ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: GOLD }} />
          </Box>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={startPoint || geoCenter || PH_CENTER}
            zoom={startPoint ? 19 : geoCenter ? 15 : 6}
            mapTypeId={mapType}
            onClick={(e) => placePin(e.latLng)}
            onLoad={(map) => {
              mapRef.current = map
              // Force the type — @react-google-maps occasionally drops the prop on initial mount
              map.setMapTypeId(mapType)
            }}
            options={{
              streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true,
              mapTypeId: mapType,
            }}
          >
            {startPoint && (
              <Marker
                position={startPoint}
                draggable
                onDragEnd={(e) => { setMonument(null); onMapClick({ latLng: e.latLng }) }}
                label={{ text: '1', color: '#0A1628', fontWeight: '800', fontSize: '11px' }}
                animation={window.google?.maps?.Animation?.DROP}
              />
            )}
            {monument && (
              <Marker
                position={monument}
                draggable
                onDragEnd={(e) => placePin(e.latLng)}
                label={{ text: 'B', color: 'white', fontWeight: '800', fontSize: '11px' }}
              />
            )}
            {monument && startPoint && (
              <Polyline
                path={[monument, startPoint]}
                options={{
                  strokeColor: GOLD, strokeOpacity: 0, strokeWeight: 2,
                  icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: GOLD, scale: 2.5 }, offset: '0', repeat: '12px' }],
                }}
              />
            )}
          </GoogleMap>
        )}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Box>
          {startPoint && (
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontFamily: 'monospace' }}>
              Corner 1: {startPoint.lat.toFixed(6)}, {startPoint.lng.toFixed(6)} · {formatCoordsDMS(startPoint.lat, startPoint.lng)}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>Back</Button>
          <Button variant="contained" color="secondary" disabled={!startPoint} onClick={onNext}
                  endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 800, borderRadius: 2.5 }}>
            Plot the Lot
          </Button>
        </Box>
      </Box>
    </GlassPanel>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 4 — Plotted result
   ════════════════════════════════════════════════════════════════════ */
function StepResult({
  isLoaded, extracted, plotted, resultRef, syntheticMap,
  setStartPoint, rotation, setRotation, onApplyBearings, onBack,
}) {
  const closureSeverity = plotted.closure.meters < 1 ? 'good' : plotted.closure.meters < 5 ? 'ok' : 'warning'
  const closureColor = closureSeverity === 'good' ? '#16A34A' : closureSeverity === 'ok' ? '#D97706' : '#DC2626'
  const fmt = (n, d = 2) => n.toLocaleString('en-PH', { minimumFractionDigits: d, maximumFractionDigits: d })

  // Smart closure fixes — only computed when the traverse doesn't close cleanly
  const fix = useMemo(
    () => (closureSeverity === 'good' ? null : suggestClosureFixes(extracted.bearings || [])),
    [closureSeverity, extracted.bearings]
  )

  // Dragging the polygon moves the whole (rigid) traverse: the dropped
  // position of corner 1 becomes the new start point and everything replots.
  const polyRef = useRef(null)
  const handlePolyDragEnd = () => {
    const path = polyRef.current?.getPath()
    if (!path?.getLength()) return
    const first = path.getAt(0)
    setStartPoint({ lat: first.lat(), lng: first.lng() })
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 2.5 }}>
      {/* Map */}
      <GlassPanel sx={{ p: 1.5 }}>
        <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', height: { xs: 380, md: 560 } }}>
          {!isLoaded ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: GOLD }} />
            </Box>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={plotted.corners[0]}
              zoom={19}
              mapTypeId="satellite"
              onLoad={(map) => {
                resultRef.current = map
                // Belt-and-braces: force satellite via the SDK after mount so the
                // prop can't be silently dropped on first render.
                map.setMapTypeId('satellite')
              }}
              options={{
                streetViewControl: false, mapTypeControl: false, fullscreenControl: true, zoomControl: true,
                mapTypeId: 'satellite',
              }}
            >
              <Polygon
                paths={plotted.corners}
                onLoad={(poly) => { polyRef.current = poly }}
                onDragEnd={handlePolyDragEnd}
                options={{ fillColor: GOLD, fillOpacity: 0.35, strokeColor: GOLD, strokeWeight: 3, strokeOpacity: 1, draggable: true }}
              />
              {plotted.corners.slice(0, -1).map((c, i) => (
                <Marker
                  key={i}
                  position={c}
                  label={{ text: String(i + 1), color: NAVY, fontWeight: '800', fontSize: '11px' }}
                />
              ))}
            </GoogleMap>
          )}
        </Box>

        {/* Alignment controls — nudge the rigid polygon onto the imagery */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, px: 0.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mr: 'auto' }}>
            Drag the polygon to reposition · rotate to align with fences/roads in the imagery
          </Typography>
          <Tooltip title="Rotate 0.5° counter-clockwise">
            <IconButton size="small" onClick={() => setRotation(r => +(r - 0.5).toFixed(1))}>
              <RotateLeftIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
          <Typography sx={{ fontSize: '0.76rem', fontFamily: 'monospace', fontWeight: 700, minWidth: 48, textAlign: 'center' }}>
            {rotation > 0 ? '+' : ''}{rotation.toFixed(1)}°
          </Typography>
          <Tooltip title="Rotate 0.5° clockwise">
            <IconButton size="small" onClick={() => setRotation(r => +(r + 0.5).toFixed(1))}>
              <RotateRightIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Tooltip>
          {rotation !== 0 && (
            <Button size="small" onClick={() => setRotation(0)} sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
              Reset
            </Button>
          )}
        </Box>
      </GlassPanel>

      {/* Result panel */}
      <Stack spacing={2}>
        {/* Hero lot card */}
        <GlassPanel sx={{ overflow: 'hidden' }} delay={0.05}>
          <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${NAVY} 0%, #0B1A30 100%)`, color: 'white', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -30, right: -20, width: 160, height: 160, background: `radial-gradient(circle, ${GOLD}33, transparent 65%)`, pointerEvents: 'none' }} />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, letterSpacing: '0.16em' }}>
              PLOTTED LOT
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', mt: 0.3, lineHeight: 1.1 }}>
              {extracted.title_number || `LOT ${extracted.lot_number || ''}`}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', mt: 0.4 }}>
              {[extracted.barangay, extracted.city_municipality, extracted.province].filter(Boolean).join(', ') || '—'}
            </Typography>

            {/* Stat tiles */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mt: 2 }}>
              <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>AREA (COMPUTED)</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: GOLD }}>
                  <CountUp value={plotted.area} decimals={0} /> <Box component="span" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>sqm</Box>
                </Typography>
              </Box>
              <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>CLOSURE</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: closureColor }}>
                  <CountUp value={plotted.closure.meters} decimals={3} /> <Box component="span" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>m</Box>
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '0.82rem' }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Owner</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{extracted.registered_owner || '—'}</Typography>
              {Number.isFinite(extracted.land_area_sqm) && (
                <>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Area (on title)</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{fmt(extracted.land_area_sqm, 2)} sq. m.</Typography>
                </>
              )}
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Lot No.</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{extracted.lot_number || '—'}{extracted.survey_plan_number ? ` · ${extracted.survey_plan_number}` : ''}</Typography>
            </Box>
          </Box>
        </GlassPanel>

        <GlassPanel delay={0.1} sx={{ borderLeft: `4px solid ${closureColor}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {closureSeverity === 'good'
                ? <CheckCircleIcon sx={{ fontSize: 18, color: closureColor }} />
                : <WarningAmberIcon sx={{ fontSize: 18, color: closureColor }} />}
              <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>Closure Check</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              Distance from the last computed corner back to corner #1: <strong style={{ color: closureColor }}>{fmt(plotted.closure.meters, 3)} m</strong>
              {' '}({fmt(plotted.closure.ratio * 100, 4)}% of perimeter).
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mt: 0.6 }}>
              {closureSeverity === 'good' && 'Excellent — bearings transcribe cleanly back to the starting corner.'}
              {closureSeverity === 'ok'   && 'Acceptable — small drift, likely OCR rounding in the minutes column.'}
              {closureSeverity === 'warning' && 'Significant drift — re-check the bearings for transcription errors.'}
            </Typography>

            {fix?.suggestions?.length > 0 && (
              <Box sx={{ mt: 1.2, p: 1.2, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.6 }}>
                  <AutoFixHighIcon sx={{ fontSize: 15, color: GOLD_DARK }} />
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: 'text.primary' }}>
                    Smart fix — likely transcription slip found
                  </Typography>
                </Box>
                {fix.suggestions.slice(0, 2).map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.4 }}>
                    <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary' }}>
                      Line <strong>{s.line}</strong>: {s.label} → <strong style={{ color: '#16A34A' }}>{fmt(s.after, 2)} m</strong>
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => onApplyBearings(s.bearings)}
                            sx={{ fontWeight: 700, flexShrink: 0, py: 0, fontSize: '0.68rem' }}>
                      Apply
                    </Button>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </GlassPanel>

        <GlassPanel delay={0.15}>
          <CardContent>
            <Typography sx={{ fontWeight: 800, color: 'text.primary', mb: 1.2 }}>
              Preview & Download Survey PDFs
            </Typography>
            <SurveyPdfButton
              propertyMap={syntheticMap}
              transaction={null}
              size="medium"
              variant="contained"
              fullWidth
              label="Preview Survey PDFs"
            />
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 1.2 }}>
              You'll see a full-screen preview of each PDF before deciding to download. Both PDFs are branded with FilipinoTracks.
            </Typography>
          </CardContent>
        </GlassPanel>

        <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>
          Back to start point
        </Button>
      </Stack>
    </Box>
  )
}
