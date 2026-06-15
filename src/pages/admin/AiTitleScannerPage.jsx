import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { GoogleMap, Polygon, Polyline, Marker, Autocomplete, OverlayViewF, OverlayView, useJsApiLoader } from '@react-google-maps/api'
import {
  Box, Paper, Typography, Button, IconButton,
  TextField, Stack, Chip, Divider, Alert, CircularProgress, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select,
  Card, CardContent, ToggleButtonGroup, ToggleButton, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions, useTheme, useMediaQuery,
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
import CancelIcon from '@mui/icons-material/Cancel'
import VerifiedIcon from '@mui/icons-material/Verified'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon   from '@mui/icons-material/ArrowBack'
import ContentPasteIcon from '@mui/icons-material/ContentPaste'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import ScienceIcon from '@mui/icons-material/Science'
import SearchIcon from '@mui/icons-material/Search'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import StraightenIcon from '@mui/icons-material/Straighten'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import DownloadIcon from '@mui/icons-material/Download'
import CropRotateIcon from '@mui/icons-material/CropRotate'
import { motion, AnimatePresence } from 'framer-motion'
import { GOLD, GOLD_DARK, GOLD_LIGHT, NAVY } from '../../theme/theme'
import { GOOGLE_MAPS_LIBRARIES as LIBRARIES } from '../../utils/mapsLibraries'
import { scanTitleImage } from '../../utils/openaiVision'
import { plotPolygonFromBearings, closureError, cornersToGeoJsonPolygon, quadrantToTrueBearing, destinationPoint, parseTieLine } from '../../utils/bearingsPlotter'
import { suggestClosureFixes } from '../../utils/closureAutoFix'
import { parseBearingsText } from '../../utils/bearingsText'
import { runTitleChecks } from '../../utils/titleChecks'
import { surveyMetrics } from '../../utils/surveyMetrics'
import { parseCoordinates, formatCoordsDMS } from '../../utils/coordinates'
import { polygonAreaSqm } from '../../utils/polygonGis'
import { useToast } from '../../context/ToastContext'
import SurveyPdfButton from '../../components/SurveyPdfButton'
import BearingsSketch from '../../components/BearingsSketch'
import ImageZoomPanel from '../../components/ImageZoomPanel'
import ImageEditDialog from '../../components/ImageEditDialog'
import SuccessBurst from '../../components/SuccessBurst'
import CinematicReveal from '../../components/CinematicReveal'
import ZonalValueCard from '../../components/ZonalValueCard'

const PH_CENTER = { lat: 12.8797, lng: 121.7740 }
const GOLD_GRADIENT = `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`
const STORAGE_KEY = 'ai-title-scanner-progress-v1'

const STEP_META = [
  { label: 'Upload Title',    short: 'Upload',  icon: CloudUploadIcon },
  { label: 'Review Data',     short: 'Review',  icon: FactCheckIcon },
  { label: 'Pin Start Point', short: 'Pin',     icon: PinDropIcon },
  { label: 'Plotted Result',  short: 'Result',  icon: TerrainIcon },
]

/** A self-contained demo extraction (a closing parallelogram in Dauis, Bohol)
 *  so anyone can walk the whole flow without a file or an AI call. */
const DEMO_EXTRACTION = {
  title_number: '101-2018001839',
  lot_number: '4519',
  block_number: null,
  survey_plan_number: 'GSS-07-02-000031',
  registered_owner: 'JUAN A. DELA CRUZ',
  land_area_sqm: 1350,
  province: 'Bohol',
  city_municipality: 'Dauis',
  barangay: 'Tabalong',
  full_address: 'Tabalong, Dauis, Bohol',
  tie_line: "Beginning at a point marked '1' on plan being N. 69°11' E., 2877.81 m. from BLLM No. 7, Dauis Cadastre.",
  bearings: [
    { point_from: '1', point_to: '2', dir1: 'N', degrees: 80, minutes: 0, dir2: 'E', distance: 45, conf: 'high' },
    { point_from: '2', point_to: '3', dir1: 'S', degrees: 10, minutes: 0, dir2: 'E', distance: 30, conf: 'medium' },
    { point_from: '3', point_to: '4', dir1: 'S', degrees: 80, minutes: 0, dir2: 'W', distance: 45, conf: 'high' },
    { point_from: '4', point_to: '1', dir1: 'N', degrees: 10, minutes: 0, dir2: 'W', distance: 30, conf: 'high' },
  ],
  field_confidence: {
    title_number: 'high', lot_number: 'high', block_number: 'unknown', survey_plan_number: 'medium',
    registered_owner: 'high', land_area_sqm: 'high', province: 'high', city_municipality: 'high', barangay: 'medium',
  },
  confidence: 'high',
  notes: 'Demo data — no AI call was made.',
}

const AREA_UNITS = {
  sqm:  { label: 'sq m',     factor: 1,        dec: 0 },
  ha:   { label: 'hectares', factor: 1 / 10000, dec: 4 },
  sqft: { label: 'sq ft',    factor: 10.76391, dec: 0 },
}

// Fields the guided-review walkthrough can step through, in display order.
const REVIEW_ORDER = ['title_number', 'lot_number', 'block_number', 'survey_plan_number', 'registered_owner', 'land_area_sqm', 'barangay', 'city_municipality', 'province']
const FIELD_LABELS = {
  title_number: 'Title Number', lot_number: 'Lot Number', block_number: 'Block',
  survey_plan_number: 'Survey Plan Number', registered_owner: 'Registered Owner',
  land_area_sqm: 'Land Area', barangay: 'Barangay', city_municipality: 'City / Municipality', province: 'Province',
}

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
      <motion.div
        animate={{ x: ['-12%', '12%', '-12%'], y: ['-8%', '10%', '-8%'], rotate: [0, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: '-40%', right: '-10%', width: 520, height: 520,
          background: `radial-gradient(circle, ${GOLD}33 0%, transparent 62%)`,
          filter: 'blur(8px)', pointerEvents: 'none',
        }}
      />
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
  const [original, setOriginal] = useState(null)   // pristine AI output (for "edited" markers)
  const [startPoint, setStartPoint] = useState(null) // {lat, lng}
  const [coordInput, setCoordInput] = useState('')
  const [coordError, setCoordError] = useState(false)
  const [mapType, setMapType] = useState('satellite')
  const [rotation, setRotation] = useState(0)       // fine-tune rotation (deg) on the result map
  const [resume, setResume] = useState(null)        // restored-from-localStorage payload offer
  const [cinematic, setCinematic] = useState(false) // fullscreen boundary-reveal overlay

  const mapRef    = useRef(null)
  const resultRef = useRef(null)

  /* ─── Resume: offer to restore a previous in-progress scan ────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw)
        if (data?.extracted) setResume(data)
      }
    } catch { /* ignore */ }
  }, [])

  // Autosave extraction + plotting progress (images can't be serialized, so
  // a resumed session restarts at the Review step).
  useEffect(() => {
    if (!extracted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        extracted, original, startPoint, rotation, step: Math.max(step, 1),
      }))
    } catch { /* quota / serialization — non-fatal */ }
  }, [extracted, original, startPoint, rotation, step])

  const acceptResume = () => {
    setExtracted(resume.extracted)
    setOriginal(resume.original || resume.extracted)
    setStartPoint(resume.startPoint || null)
    setRotation(resume.rotation || 0)
    setStep(resume.startPoint ? (resume.step || 1) : 1)
    setResume(null)
  }
  const dismissResume = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setResume(null)
  }

  /* ─── Step 1: Upload + AI scan ────────────────────────────────────── */
  const onDrop = useCallback((accepted) => {
    if (!accepted?.length) return
    setFiles(prev => [...prev, ...accepted].slice(0, 2))   // cap at 2 (front + back)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize: 20 * 1024 * 1024,
    multiple: true,
  })

  // Paste an image straight from the clipboard while on the upload step.
  useEffect(() => {
    if (step !== 0) return
    const onPaste = (e) => {
      const imgs = []
      for (const item of e.clipboardData?.items || []) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile()
          if (f) imgs.push(f)
        }
      }
      if (imgs.length) { onDrop(imgs); toast.success('Image pasted from clipboard.') }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [step, onDrop, toast])

  const handleScan = async () => {
    if (!files.length) return
    setScanning(true)
    try {
      const result = await scanTitleImage(files)
      setExtracted(result)
      setOriginal(result)
      setStep(1)
      const found = (result.bearings || []).length
      toast.success(`AI extracted ${found} bearing${found === 1 ? '' : 's'} (${result.confidence} confidence).`)
    } catch (err) {
      toast.error(err.message || 'AI scan failed. Try a clearer image.')
    } finally {
      setScanning(false)
    }
  }

  const loadDemo = () => {
    setExtracted(DEMO_EXTRACTION)
    setOriginal(DEMO_EXTRACTION)
    setStep(1)
    toast.success('Loaded a demo title — no AI call used.')
  }

  // Focused re-scan: re-send the original image(s) asking the AI to concentrate
  // on the technical description, then swap in the freshly-read bearings.
  const [rescanning, setRescanning] = useState(false)
  const handleRescanBearings = async () => {
    if (!files.length) return
    setRescanning(true)
    try {
      const result = await scanTitleImage(files, { focus: 'bearings' })
      if (result?.bearings?.length) {
        setExtracted(prev => ({ ...prev, bearings: result.bearings }))
        toast.success(`Re-read ${result.bearings.length} bearing${result.bearings.length === 1 ? '' : 's'} from the title.`)
      } else {
        toast.error('Re-scan found no bearings. Try a clearer or straighter image.')
      }
    } catch (err) {
      toast.error(err.message || 'Re-scan failed. Try again in a moment.')
    } finally {
      setRescanning(false)
    }
  }

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))
  const replaceFile = (idx, newFile) => setFiles(prev => prev.map((f, i) => (i === idx ? newFile : f)))

  /* ─── Step 2: Editable extracted fields ──────────────────────────── */
  const updateField = (key, value) => setExtracted(prev => ({ ...prev, [key]: value }))
  const updateBearing = (idx, key, value) => setExtracted(prev => ({
    ...prev, bearings: prev.bearings.map((b, i) => i === idx ? { ...b, [key]: value } : b),
  }))
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
    ...prev, bearings: prev.bearings.filter((_, i) => i !== idx),
  }))
  /** Bulk-replace bearings — used by closure auto-fix + paste-text parser. */
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

  useEffect(() => {
    if (step !== 3 || !plotted || !resultRef.current || !window.google?.maps) return
    const bounds = new window.google.maps.LatLngBounds()
    plotted.corners.forEach(c => bounds.extend(c))
    setTimeout(() => resultRef.current.fitBounds(bounds, 80), 120)
  }, [step, plotted])

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

  // Advancing from "Pin" to "Result" kicks off the fullscreen cinematic reveal.
  const goToResult = () => { setStep(3); setCinematic(true) }

  const handleRestart = () => {
    setStep(0)
    setFiles([])
    setExtracted(null)
    setOriginal(null)
    setStartPoint(null)
    setCoordInput('')
    setRotation(0)
    setCinematic(false)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }

  /* ─── UI ──────────────────────────────────────────────────────────── */
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: 'calc(100vh - 56px)', position: 'relative' }}>
      <Box sx={{
        position: 'absolute', top: 0, right: 0, width: 480, height: 480, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(circle at 70% 20%, ${GOLD}14 0%, transparent 60%)`,
      }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <ScannerHero step={step} onRestart={handleRestart} />

        {resume && step === 0 && (
          <Alert
            severity="info" icon={<RestartAltIcon />} sx={{ mb: 2.5, borderRadius: 3 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={dismissResume} sx={{ fontWeight: 700, color: 'text.secondary' }}>Dismiss</Button>
                <Button size="small" variant="contained" color="secondary" onClick={acceptResume} sx={{ fontWeight: 800 }}>Resume</Button>
              </Box>
            }
          >
            You have an unfinished scan{resume.extracted?.title_number ? ` (${resume.extracted.title_number})` : ''}. Resume where you left off?
          </Alert>
        )}

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
                onReplace={replaceFile}
                onScan={handleScan}
                onDemo={loadDemo}
                scanning={scanning}
              />
            )}

            {step === 1 && extracted && (
              <StepReview
                extracted={extracted}
                original={original}
                files={files}
                onUpdate={updateField}
                onUpdateBearing={updateBearing}
                onAddBearing={addBearing}
                onRemoveBearing={removeBearing}
                onApplyBearings={applyBearings}
                onRescanBearings={handleRescanBearings}
                rescanning={rescanning}
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
                onNext={goToResult}
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
                initialRevealed={cinematic}
                onBack={() => setStep(2)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Fullscreen cinematic boundary reveal */}
      <AnimatePresence>
        {cinematic && step === 3 && plotted && extracted && isLoaded && (
          <CinematicReveal
            key="cinematic"
            plotted={plotted}
            extracted={extracted}
            onClose={() => setCinematic(false)}
          />
        )}
      </AnimatePresence>
    </Box>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 1 — Upload  (+ the headline document-scanner animation)
   ════════════════════════════════════════════════════════════════════ */
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

function ScanOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(5,8,15,0.55), rgba(5,8,15,0.35))' }} />
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
      <CornerBracket pos="tl" /><CornerBracket pos="tr" /><CornerBracket pos="bl" /><CornerBracket pos="br" />
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
      <Box sx={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 0.8, px: 1, py: 0.4, borderRadius: 1.5, bgcolor: 'rgba(5,8,15,0.6)', border: `1px solid ${GOLD}55` }}>
        <Box component={motion.div} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: GOLD }} />
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, letterSpacing: '0.14em' }}>SCANNING</Typography>
      </Box>
    </motion.div>
  )
}

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

function StepUpload({ files, getRootProps, getInputProps, isDragActive, onRemove, onReplace, onScan, onDemo, scanning }) {
  const [editIdx, setEditIdx] = useState(-1)        // image being edited
  const [lightbox, setLightbox] = useState(-1)      // image shown full-screen
  // Create object URLs in an effect (not useMemo) so StrictMode's
  // mount→cleanup→remount recreates them instead of leaving revoked URLs.
  const [urls, setUrls] = useState([])
  useEffect(() => {
    const next = files.map(f => URL.createObjectURL(f))
    setUrls(next)
    return () => next.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  return (
    <GlassPanel sx={{ p: { xs: 2.5, md: 3.5 } }}>
      <PanelHeader
        kicker="STEP 1"
        title="Upload the Land Title"
        icon={<CloudUploadIcon sx={{ color: NAVY, fontSize: 22 }} />}
        action={
          <Button onClick={onDemo} startIcon={<ScienceIcon />} variant="outlined" size="small" sx={{ fontWeight: 700, borderRadius: 2 }}>
            Try a demo
          </Button>
        }
      />
      <Typography sx={{ fontSize: '0.86rem', color: 'text.secondary', mb: 2.5 }}>
        A clear photo or scan of the title page works best. Upload both <strong>front and back</strong> for higher accuracy —
        or <strong>paste</strong> a screenshot with Ctrl/Cmd + V.
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
        <input {...getInputProps()} capture="environment" />
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
                {urls[i] && <img src={urls[i]} alt={f.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                <AnimatePresence>{scanning && <ScanOverlay key="scan" />}</AnimatePresence>
                {!scanning && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Zoom / view">
                      <IconButton size="small" onClick={() => setLightbox(i)} sx={{ bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: 'white' } }}>
                        <ZoomOutMapIcon sx={{ fontSize: 17, color: NAVY }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Rotate / crop">
                      <IconButton size="small" onClick={() => setEditIdx(i)} sx={{ bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: 'white' } }}>
                        <CropRotateIcon sx={{ fontSize: 17, color: NAVY }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => onRemove(i)} sx={{ bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: 'white' } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 17, color: '#DC2626' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
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

      {/* Editor + lightbox dialogs */}
      <ImageEditDialog
        open={editIdx >= 0}
        file={editIdx >= 0 ? files[editIdx] : null}
        onApply={(nf) => onReplace(editIdx, nf)}
        onClose={() => setEditIdx(-1)}
      />
      <Dialog open={lightbox >= 0} onClose={() => setLightbox(-1)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: '#05080F' } }}>
        {lightbox >= 0 && urls[lightbox] && <ImageZoomPanel src={urls[lightbox]} alt="title" height={Math.round(window.innerHeight * 0.8)} rounded={3} />}
      </Dialog>
    </GlassPanel>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 2 — Review & edit
   ════════════════════════════════════════════════════════════════════ */
function StepReview({ extracted, original, files, onUpdate, onUpdateBearing, onAddBearing, onRemoveBearing, onApplyBearings, onRescanBearings, rescanning, onBack, onNext }) {
  const confColor = extracted.confidence === 'high' ? '#16A34A' : extracted.confidence === 'medium' ? '#D97706' : '#DC2626'
  const canContinue = (extracted.bearings || []).length >= 3

  const fix = useMemo(() => suggestClosureFixes(extracted.bearings || []), [extracted.bearings])
  const closureColor = fix.before < 1.5 ? '#16A34A' : fix.before < 5 ? '#D97706' : '#DC2626'

  const fieldConf = extracted.field_confidence || {}
  const CONF_TINT = {
    medium: { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#D97706', borderWidth: 2 } },
    low:    { '& .MuiOutlinedInput-notchedOutline': { borderColor: '#DC2626', borderWidth: 2 } },
  }
  const rowTint = (conf) =>
    conf === 'low' ? 'rgba(220,38,38,0.08)' : conf === 'medium' ? 'rgba(217,119,6,0.08)' : undefined

  // Guided review — step through only the fields the AI was unsure about.
  const unsureKeys = REVIEW_ORDER.filter(k => fieldConf[k] === 'medium' || fieldConf[k] === 'low')
  const [guide, setGuide] = useState(-1)         // -1 = inactive; otherwise index into unsureKeys
  const activeKey = guide >= 0 ? unsureKeys[guide] : null
  const fieldRefs = useRef({})
  useEffect(() => {
    if (guide < 0) return
    const el = fieldRefs.current[unsureKeys[guide]]
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.focus?.(), 250) }
  }, [guide]) // eslint-disable-line react-hooks/exhaustive-deps

  const GLOW = { '& .MuiOutlinedInput-root': { boxShadow: `0 0 0 3px ${GOLD}66`, borderRadius: 1 } }
  // Per-field sx: confidence tint + active-guide glow
  const fieldSx = (key) => ({ ...(CONF_TINT[fieldConf[key]] || {}), ...(key === activeKey ? GLOW : {}) })
  const confSx = fieldSx
  const refFor = (key) => (el) => { fieldRefs.current[key] = el }

  // "Edited from AI" dot — shown when a field differs from the original scan.
  const editedAdornment = (key) => {
    if (!original) return undefined
    if ((extracted[key] ?? '') === (original[key] ?? '')) return undefined
    return {
      endAdornment: (
        <Tooltip title={`AI read: ${original[key] ?? '—'}`}>
          <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: GOLD, flexShrink: 0, ml: 0.5 }} />
        </Tooltip>
      ),
    }
  }

  // Source-image reference. Object URLs are created inside an effect (not
  // useMemo) so React StrictMode's mount→cleanup→remount can't leave the <img>
  // pointing at a revoked URL — the remount recreates fresh URLs.
  const [urls, setUrls] = useState([])
  useEffect(() => {
    const next = (files || []).map(f => URL.createObjectURL(f))
    setUrls(next)
    return () => next.forEach(u => URL.revokeObjectURL(u))
  }, [files])
  const hasImage = (files?.length || 0) > 0
  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  // Paste-a-technical-description parser
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const parsed = useMemo(() => parseBearingsText(pasteText), [pasteText])

  const fieldsCard = (
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
      <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mb: unsureKeys.length ? 1.5 : 2 }}>
        Review what the AI read. Edit any field if it misread something — a gold dot marks fields you've changed.
      </Typography>
      {unsureKeys.length > 0 && (
        <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: `${GOLD}14`, border: `1px solid ${GOLD}55` }}>
          {guide < 0 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <WarningAmberIcon sx={{ fontSize: 18, color: GOLD_DARK }} />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.primary', flex: 1, minWidth: 140 }}>
                {unsureKeys.length} field{unsureKeys.length > 1 ? 's' : ''} the AI was unsure about.
              </Typography>
              <Button size="small" variant="contained" color="secondary" onClick={() => setGuide(0)} endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 800 }}>
                Guided review
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip size="small" label={`${guide + 1} / ${unsureKeys.length}`} sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 800 }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', flex: 1, minWidth: 160 }}>
                Check the <strong>{FIELD_LABELS[activeKey]}</strong> against the title image.
              </Typography>
              <Button size="small" disabled={guide === 0} onClick={() => setGuide(g => g - 1)} sx={{ color: 'text.secondary' }}>Back</Button>
              {guide < unsureKeys.length - 1 ? (
                <Button size="small" variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={() => setGuide(g => g + 1)} sx={{ fontWeight: 800 }}>Looks right</Button>
              ) : (
                <Button size="small" variant="contained" color="secondary" endIcon={<CheckCircleIcon />} onClick={() => setGuide(-1)} sx={{ fontWeight: 800 }}>Done</Button>
              )}
            </Box>
          )}
        </Box>
      )}

      <Stack spacing={1.5}>
        <TextField size="small" label="Title Number" inputRef={refFor('title_number')} value={extracted.title_number || ''} onChange={(e) => onUpdate('title_number', e.target.value)} fullWidth sx={confSx('title_number')} InputProps={editedAdornment('title_number')} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" label="Lot Number" inputRef={refFor('lot_number')} value={extracted.lot_number || ''} onChange={(e) => onUpdate('lot_number', e.target.value)} fullWidth sx={confSx('lot_number')} InputProps={editedAdornment('lot_number')} />
          <TextField size="small" label="Block" inputRef={refFor('block_number')} value={extracted.block_number || ''} onChange={(e) => onUpdate('block_number', e.target.value)} sx={{ width: 110, ...confSx('block_number') }} InputProps={editedAdornment('block_number')} />
        </Box>
        <TextField size="small" label="Survey Plan Number" inputRef={refFor('survey_plan_number')} value={extracted.survey_plan_number || ''} onChange={(e) => onUpdate('survey_plan_number', e.target.value)} fullWidth sx={confSx('survey_plan_number')} InputProps={editedAdornment('survey_plan_number')} />
        <TextField size="small" label="Registered Owner" inputRef={refFor('registered_owner')} value={extracted.registered_owner || ''} onChange={(e) => onUpdate('registered_owner', e.target.value)} fullWidth sx={confSx('registered_owner')} InputProps={editedAdornment('registered_owner')} />
        <TextField size="small" label="Land Area (sqm)" type="number" inputRef={refFor('land_area_sqm')} value={extracted.land_area_sqm ?? ''}
                   onChange={(e) => onUpdate('land_area_sqm', e.target.value === '' ? null : Number(e.target.value))} fullWidth sx={confSx('land_area_sqm')} />
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" label="Barangay" inputRef={refFor('barangay')} value={extracted.barangay || ''} onChange={(e) => onUpdate('barangay', e.target.value)} fullWidth sx={confSx('barangay')} InputProps={editedAdornment('barangay')} />
          <TextField size="small" label="City/Municipality" inputRef={refFor('city_municipality')} value={extracted.city_municipality || ''} onChange={(e) => onUpdate('city_municipality', e.target.value)} fullWidth sx={confSx('city_municipality')} InputProps={editedAdornment('city_municipality')} />
        </Box>
        <TextField size="small" label="Province" inputRef={refFor('province')} value={extracted.province || ''} onChange={(e) => onUpdate('province', e.target.value)} fullWidth sx={confSx('province')} InputProps={editedAdornment('province')} />
        {extracted.tie_line && (
          <TextField size="small" label="Tie Line" value={extracted.tie_line} onChange={(e) => onUpdate('tie_line', e.target.value)} fullWidth multiline minRows={2} />
        )}
      </Stack>
    </GlassPanel>
  )

  const bearingsCard = (
    <GlassPanel sx={{ p: { xs: 2.5, md: 3 } }} delay={0.08}>
      <PanelHeader
        kicker="TECHNICAL DESCRIPTION"
        title={`${extracted.bearings?.length || 0} Bearings`}
        icon={<TerrainIcon sx={{ color: NAVY, fontSize: 22 }} />}
        action={
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {files?.length > 0 && (
              <Button
                size="small"
                startIcon={rescanning ? <CircularProgress size={13} sx={{ color: GOLD_DARK }} /> : <AutoFixHighIcon sx={{ fontSize: 15 }} />}
                onClick={onRescanBearings} disabled={rescanning}
                sx={{ fontWeight: 700 }}
              >
                {rescanning ? 'Re-reading…' : 'Re-scan bearings'}
              </Button>
            )}
            <Button size="small" startIcon={<ContentPasteIcon sx={{ fontSize: 15 }} />} onClick={() => setPasteOpen(true)} sx={{ fontWeight: 700 }}>
              Paste text
            </Button>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={onAddBearing} sx={{ fontWeight: 700 }}>
              Add row
            </Button>
          </Box>
        }
      />

      {(!extracted.bearings || extracted.bearings.length < 3) && (
        <Alert severity="warning" sx={{ mb: 1.5, fontSize: '0.76rem', borderRadius: 2 }}>
          A polygon needs at least 3 bearings. {extracted.bearings?.length === 0 && 'The AI didn\'t find any — add them manually, paste the description, or re-scan a clearer image.'}
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
            {(extracted.bearings || []).map((b, i) => {
              const isLast = i === extracted.bearings.length - 1
              return (
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
                               onKeyDown={(e) => { if (e.key === 'Enter' && isLast) { e.preventDefault(); onAddBearing() } }}
                               inputProps={{ min: 0, step: 0.01 }}
                               sx={{ '& .MuiOutlinedInput-input': { py: 0.5, fontSize: '0.78rem' } }} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => onRemoveBearing(i)} sx={{ color: '#DC2626' }}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.6 }}>
        Tip: press <strong>Enter</strong> in the last Distance cell to add another row.
      </Typography>

      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>Live Shape Preview</Typography>
        {(extracted.bearings?.length || 0) >= 3 && (
          <Chip size="small" label={`Closure: ${fix.before.toFixed(2)} m`} sx={{ bgcolor: closureColor, color: 'white', fontWeight: 700, fontSize: '0.65rem' }} />
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
                <Button size="small" variant="outlined" onClick={() => onApplyBearings(s.bearings)} sx={{ fontWeight: 700, flexShrink: 0, py: 0 }}>
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
  )

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: hasImage ? '0.85fr 1.15fr' : '1fr 1.2fr' }, gap: 2.5, alignItems: 'start' }}>
        {hasImage ? (
          <Box sx={{ position: { lg: 'sticky' }, top: 16 }}>
            <GlassPanel sx={{ p: 2 }}>
              <PanelHeader
                kicker="SOURCE"
                title="Title Image"
                icon={<ImageOutlinedIcon sx={{ color: NAVY, fontSize: 22 }} />}
                action={
                  <Tooltip title="Open full screen">
                    <IconButton size="small" onClick={() => setLightbox(true)}><ZoomOutMapIcon /></IconButton>
                  </Tooltip>
                }
              />
              {urls[imgIdx]
                ? <ImageZoomPanel src={urls[imgIdx]} alt="source title" height={460} />
                : <Box sx={{ height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#05080F', borderRadius: 2 }}><CircularProgress sx={{ color: GOLD }} /></Box>}
              {urls.length > 1 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1.2 }}>
                  {urls.map((u, i) => (
                    <Box
                      key={i} onClick={() => setImgIdx(i)}
                      sx={{
                        width: 64, height: 64, borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer',
                        border: '2px solid', borderColor: i === imgIdx ? GOLD : 'divider',
                      }}
                    >
                      <img src={u} alt={`page ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
              )}
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 1 }}>
                Scroll to zoom, drag to pan. Compare against the extracted fields to catch misreads.
              </Typography>
            </GlassPanel>
          </Box>
        ) : fieldsCard}

        {hasImage ? <Stack spacing={2.5}>{fieldsCard}{bearingsCard}</Stack> : bearingsCard}
      </Box>

      {/* Lightbox */}
      <Dialog open={lightbox} onClose={() => setLightbox(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: '#05080F' } }}>
        {urls[imgIdx] && <ImageZoomPanel src={urls[imgIdx]} alt="title" height={Math.round(window.innerHeight * 0.8)} rounded={3} />}
      </Dialog>

      {/* Paste technical description */}
      <Dialog open={pasteOpen} onClose={() => setPasteOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Paste a technical description</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1.5 }}>
            Paste the bearings text from the title. We'll read lines like <em>“N 45°30' E, 41.40 m.”</em> and build the table.
          </Typography>
          <TextField
            value={pasteText} onChange={(e) => setPasteText(e.target.value)}
            placeholder={"1. N 45°30' E , 41.40 m. to corner 2;\n2. S 12°05' E , 12.11 m. ..."}
            fullWidth multiline minRows={6}
            sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
          />
          <Typography sx={{ fontSize: '0.74rem', color: parsed.length >= 3 ? '#16A34A' : 'text.disabled', fontWeight: 700, mt: 1 }}>
            {parsed.length} bearing{parsed.length === 1 ? '' : 's'} detected{parsed.length > 0 && parsed.length < 3 ? ' — need at least 3' : ''}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasteOpen(false)} sx={{ color: 'text.secondary', mr: 'auto' }}>Cancel</Button>
          <Button disabled={!parsed.length} onClick={() => { onApplyBearings([...(extracted.bearings || []), ...parsed]); setPasteOpen(false); setPasteText('') }} sx={{ fontWeight: 700 }}>
            Append
          </Button>
          <Button variant="contained" color="secondary" disabled={parsed.length < 3} onClick={() => { onApplyBearings(parsed); setPasteOpen(false); setPasteText('') }} sx={{ fontWeight: 800 }}>
            Replace table
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

/* ════════════════════════════════════════════════════════════════════
   STEP 3 — Pin the starting point
   ════════════════════════════════════════════════════════════════════ */
function StepPin({
  isLoaded, extracted, startPoint, setStartPoint, coordInput, setCoordInput, coordError, setCoordError,
  onCoordSubmit, onLocate, onMapClick, mapType, setMapType, mapRef, onBack, onNext,
}) {
  useEffect(() => {
    if (mapRef.current && mapType) mapRef.current.setMapTypeId(mapType)
  }, [mapType, mapRef])

  const tie = useMemo(() => parseTieLine(extracted?.tie_line), [extracted?.tie_line])
  const [pinMode, setPinMode] = useState('corner')
  const [monument, setMonument] = useState(null)
  const acRef = useRef(null)

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

  const onPlaceChanged = () => {
    const place = acRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const loc = place.geometry.location
    mapRef.current?.panTo({ lat: loc.lat(), lng: loc.lng() })
    mapRef.current?.setZoom(18)
  }

  const dropAtCenter = () => {
    const c = mapRef.current?.getCenter()
    if (c) placePin(c)
  }

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
        Search for the area, click the map to drop a pin, or use the center crosshair. The system walks the bearings from this point to plot the lot.
      </Typography>

      {tie && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
          <ToggleButtonGroup value={pinMode} exclusive size="small" onChange={(_, v) => { if (v) { setPinMode(v); setMonument(null) } }}>
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

      {/* Search + coordinate input */}
      <Stack spacing={1} sx={{ mb: 1.5 }}>
        {isLoaded && (
          <Autocomplete onLoad={(ac) => { acRef.current = ac }} onPlaceChanged={onPlaceChanged}
            options={{ componentRestrictions: { country: 'ph' }, fields: ['geometry'] }}>
            <TextField
              size="small" fullWidth placeholder="Search a place, barangay, or landmark…"
              InputProps={{ startAdornment: <SearchIcon sx={{ fontSize: 18, color: 'text.disabled', mr: 1 }} /> }}
            />
          </Autocomplete>
        )}
        <Box sx={{ display: 'flex', gap: 1, p: 1.5, borderRadius: 2.5, bgcolor: 'action.hover', alignItems: 'flex-start', flexWrap: 'wrap' }}>
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
          <Button onClick={onCoordSubmit} variant="contained" color="secondary" disabled={!coordInput.trim()} sx={{ fontWeight: 700 }}>Go</Button>
          <Button onClick={onLocate} startIcon={<MyLocationIcon sx={{ fontSize: 16 }} />} variant="outlined" sx={{ fontWeight: 700 }}>My Location</Button>
        </Box>
      </Stack>

      <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', height: { xs: 340, md: 520 } }}>
        {!isLoaded ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: GOLD }} />
          </Box>
        ) : (
          <>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={startPoint || geoCenter || PH_CENTER}
              zoom={startPoint ? 19 : geoCenter ? 15 : 6}
              mapTypeId={mapType}
              onClick={(e) => placePin(e.latLng)}
              onLoad={(map) => { mapRef.current = map; map.setMapTypeId(mapType) }}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true, mapTypeId: mapType }}
            >
              {startPoint && (
                <Marker position={startPoint} draggable
                  onDragEnd={(e) => { setMonument(null); onMapClick({ latLng: e.latLng }) }}
                  label={{ text: '1', color: '#0A1628', fontWeight: '800', fontSize: '11px' }}
                  animation={window.google?.maps?.Animation?.DROP} />
              )}
              {monument && (
                <Marker position={monument} draggable onDragEnd={(e) => placePin(e.latLng)}
                  label={{ text: 'B', color: 'white', fontWeight: '800', fontSize: '11px' }} />
              )}
              {monument && startPoint && (
                <Polyline path={[monument, startPoint]} options={{
                  strokeColor: GOLD, strokeOpacity: 0, strokeWeight: 2,
                  icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: GOLD, scale: 2.5 }, offset: '0', repeat: '12px' }],
                }} />
              )}
            </GoogleMap>

            {/* Center crosshair targeting overlay */}
            {!startPoint && (
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Box sx={{ position: 'relative', width: 40, height: 40 }}>
                  <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', bgcolor: GOLD, transform: 'translateY(-50%)', boxShadow: '0 0 4px rgba(0,0,0,0.6)' }} />
                  <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', bgcolor: GOLD, transform: 'translateX(-50%)', boxShadow: '0 0 4px rgba(0,0,0,0.6)' }} />
                  <Box sx={{ position: 'absolute', inset: 8, border: `2px solid ${GOLD}`, borderRadius: '50%' }} />
                </Box>
              </Box>
            )}
            {!startPoint && (
              <Button
                onClick={dropAtCenter} size="small" variant="contained" color="secondary"
                startIcon={<PinDropIcon sx={{ fontSize: 16 }} />}
                sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontWeight: 800, borderRadius: 5, boxShadow: 3 }}
              >
                Drop pin at center
              </Button>
            )}
          </>
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
  setStartPoint, rotation, setRotation, onApplyBearings, onBack, initialRevealed = false,
}) {
  const closureSeverity = plotted.closure.meters < 1 ? 'good' : plotted.closure.meters < 5 ? 'ok' : 'warning'
  const closureColor = closureSeverity === 'good' ? '#16A34A' : closureSeverity === 'ok' ? '#D97706' : '#DC2626'
  const fmt = (n, d = 2) => n.toLocaleString('en-PH', { minimumFractionDigits: d, maximumFractionDigits: d })

  const fix = useMemo(
    () => (closureSeverity === 'good' ? null : suggestClosureFixes(extracted.bearings || [])),
    [closureSeverity, extracted.bearings]
  )

  const [unit, setUnit] = useState('sqm')
  const [showLabels, setShowLabels] = useState(true)
  const [showVertices, setShowVertices] = useState(false)
  const [showSurvey, setShowSurvey] = useState(false)
  const [burst, setBurst] = useState(false)

  const survey = useMemo(() => surveyMetrics(plotted.corners, extracted.bearings), [plotted.corners, extracted.bearings])
  const mapWrapRef = useRef(null)
  const polyRef = useRef(null)
  // Captured once: did the cinematic overlay handle the reveal? (prop flips
  // false when the overlay closes, but this must stay stable.)
  const cinematicHandledRef = useRef(initialRevealed)

  // Instant Verify — automated checklist verdict
  const verify = useMemo(() => runTitleChecks(extracted, plotted), [extracted, plotted])

  /* ── Animated boundary reveal ──
   * On entering this screen the lot traces itself out edge-by-edge before the
   * final draggable polygon takes over. `reveal` runs 0 → nEdges; `revealed`
   * flips true when the trace finishes. Runs once per mount. */
  // When the fullscreen cinematic handled the reveal, start already settled.
  const [reveal, setReveal] = useState(initialRevealed ? plotted.corners.length - 1 : 0)
  const [revealed, setRevealed] = useState(initialRevealed)
  useEffect(() => {
    if (initialRevealed) return   // cinematic overlay already traced the boundary
    const nEdges = plotted.corners.length - 1
    if (nEdges < 1) { setRevealed(true); return }
    let raf, start
    const total = Math.min(2200, Math.max(900, nEdges * 320))
    const tick = (t) => {
      if (start === undefined) start = t
      const p = Math.min(1, (t - start) / total)
      setReveal((1 - Math.pow(1 - p, 2)) * nEdges)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setRevealed(true)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Partial path traced so far (while animating)
  const drawn = useMemo(() => {
    if (revealed) return null
    const cs = plotted.corners
    const full = Math.floor(reveal)
    const frac = reveal - full
    const pts = cs.slice(0, full + 1)
    if (full < cs.length - 1 && frac > 0) {
      const a = cs[full], b = cs[full + 1]
      pts.push({ lat: a.lat + (b.lat - a.lat) * frac, lng: a.lng + (b.lng - a.lng) * frac })
    }
    return pts
  }, [revealed, reveal, plotted.corners])

  // Confetti once the inline reveal finishes on a clean closure. Skipped when
  // the cinematic overlay ran — it fires its own burst so we don't double up.
  useEffect(() => {
    if (!cinematicHandledRef.current && revealed && closureSeverity === 'good') {
      setBurst(true)
      const t = setTimeout(() => setBurst(false), 1900)
      return () => clearTimeout(t)
    }
  }, [revealed, closureSeverity])

  const handlePolyDragEnd = () => {
    const path = polyRef.current?.getPath()
    if (!path?.getLength()) return
    const first = path.getAt(0)
    setStartPoint({ lat: first.lat(), lng: first.lng() })
  }

  // Edge labels (bearing + distance) at each segment midpoint
  const edgeLabels = useMemo(() => {
    if (!showLabels) return []
    const cs = plotted.corners
    return (extracted.bearings || []).map((b, i) => {
      const a = cs[i], c = cs[i + 1]
      if (!a || !c) return null
      return {
        key: i,
        pos: { lat: (a.lat + c.lat) / 2, lng: (a.lng + c.lng) / 2 },
        text: `${b.dir1} ${b.degrees}°${String(Math.floor(b.minutes)).padStart(2, '0')}' ${b.dir2} · ${(+b.distance).toLocaleString('en-PH')} m`,
      }
    }).filter(Boolean)
  }, [showLabels, plotted.corners, extracted.bearings])

  const u = AREA_UNITS[unit]

  const toggleFullscreen = () => {
    const el = mapWrapRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.()
  }

  const openStaticMap = () => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    const pathPts = plotted.corners.map(c => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`).join('|')
    const path = `fillcolor:0xC9A24A55|color:0xC9A24Aff|weight:3|${pathPts}`
    const markers = plotted.corners.slice(0, -1)
      .map((c, i) => `&markers=size:mid|label:${i + 1}|color:0xC9A24A|${c.lat.toFixed(6)},${c.lng.toFixed(6)}`).join('')
    const url = `https://maps.googleapis.com/maps/api/staticmap?size=640x640&scale=2&maptype=satellite&path=${path}${markers}&key=${key}`
    window.open(url, '_blank', 'noopener')
  }

  const copyVertices = () => {
    const lines = ['corner,lat,lng,dms']
    plotted.corners.slice(0, -1).forEach((c, i) => {
      lines.push(`${i + 1},${c.lat.toFixed(6)},${c.lng.toFixed(6)},"${formatCoordsDMS(c.lat, c.lng)}"`)
    })
    navigator.clipboard?.writeText(lines.join('\n'))
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 2.5, alignItems: 'start' }}>
      {/* Map — sticky on desktop so it stays in view while scrolling the panel */}
      <GlassPanel sx={{ p: 1.5, position: { lg: 'sticky' }, top: 16, alignSelf: 'start', zIndex: 1 }}>
        <Box ref={mapWrapRef} sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', height: { xs: 380, md: 560 }, bgcolor: '#05080F' }}>
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
              onLoad={(map) => { resultRef.current = map; map.setMapTypeId('satellite') }}
              options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true, mapTypeId: 'satellite' }}
            >
              {/* While animating: trace the boundary edge-by-edge */}
              {!revealed && drawn && (
                <>
                  <Polyline path={drawn} options={{ strokeColor: GOLD, strokeWeight: 4, strokeOpacity: 1 }} />
                  {plotted.corners.slice(0, Math.min(Math.floor(reveal) + 1, plotted.corners.length - 1)).map((c, i) => (
                    <Marker key={i} position={c} label={{ text: String(i + 1), color: NAVY, fontWeight: '800', fontSize: '11px' }} />
                  ))}
                  {drawn.length > 1 && (
                    <Marker
                      position={drawn[drawn.length - 1]}
                      icon={{ path: window.google?.maps?.SymbolPath?.CIRCLE, scale: 6, fillColor: '#FFF7E0', fillOpacity: 1, strokeColor: GOLD, strokeWeight: 3 }}
                    />
                  )}
                </>
              )}

              {/* After the reveal: the final draggable polygon + labels */}
              {revealed && (
                <>
                  <Polygon
                    paths={plotted.corners}
                    onLoad={(poly) => { polyRef.current = poly }}
                    onDragEnd={handlePolyDragEnd}
                    options={{ fillColor: GOLD, fillOpacity: 0.35, strokeColor: GOLD, strokeWeight: 3, strokeOpacity: 1, draggable: true }}
                  />
                  {plotted.corners.slice(0, -1).map((c, i) => (
                    <Marker key={i} position={c} label={{ text: String(i + 1), color: NAVY, fontWeight: '800', fontSize: '11px' }} />
                  ))}
                  {edgeLabels.map((e) => (
                    <OverlayViewF key={e.key} position={e.pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}>
                      <Box sx={{ px: 0.8, py: 0.2, borderRadius: 1, bgcolor: 'rgba(10,22,40,0.85)', border: `1px solid ${GOLD}88`, whiteSpace: 'nowrap' }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: GOLD_LIGHT, fontFamily: 'monospace' }}>{e.text}</Typography>
                      </Box>
                    </OverlayViewF>
                  ))}
                </>
              )}
            </GoogleMap>
          )}

          {/* Map overlay controls */}
          {isLoaded && (
            <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 0.5 }}>
              <Tooltip title={showLabels ? 'Hide edge labels' : 'Show edge labels'}>
                <IconButton size="small" onClick={() => setShowLabels(v => !v)} sx={{ bgcolor: showLabels ? GOLD : 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: showLabels ? GOLD_LIGHT : 'white' } }}>
                  <LabelOutlinedIcon sx={{ fontSize: 18, color: NAVY }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Fullscreen">
                <IconButton size="small" onClick={toggleFullscreen} sx={{ bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: 'white' } }}>
                  <FullscreenIcon sx={{ fontSize: 18, color: NAVY }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          {!revealed && (
            <Box sx={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 0.6, borderRadius: 5, bgcolor: 'rgba(5,8,15,0.75)', border: `1px solid ${GOLD}66` }}>
              <Box component={motion.div} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: GOLD }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: GOLD, letterSpacing: '0.08em' }}>TRACING BOUNDARY…</Typography>
            </Box>
          )}

          {burst && <SuccessBurst />}
        </Box>

        {/* Alignment controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, px: 0.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mr: 'auto' }}>
            Drag the polygon to reposition · rotate to align with fences/roads in the imagery
          </Typography>
          <Tooltip title="Rotate 0.5° counter-clockwise">
            <IconButton size="small" onClick={() => setRotation(r => +(r - 0.5).toFixed(1))}><RotateLeftIcon sx={{ fontSize: 19 }} /></IconButton>
          </Tooltip>
          <Typography sx={{ fontSize: '0.76rem', fontFamily: 'monospace', fontWeight: 700, minWidth: 48, textAlign: 'center' }}>
            {rotation > 0 ? '+' : ''}{rotation.toFixed(1)}°
          </Typography>
          <Tooltip title="Rotate 0.5° clockwise">
            <IconButton size="small" onClick={() => setRotation(r => +(r + 0.5).toFixed(1))}><RotateRightIcon sx={{ fontSize: 19 }} /></IconButton>
          </Tooltip>
          {rotation !== 0 && (
            <Button size="small" onClick={() => setRotation(0)} sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Reset</Button>
          )}
        </Box>
      </GlassPanel>

      {/* Result panel */}
      <Stack spacing={2}>
        {/* Hero lot card */}
        <GlassPanel sx={{ overflow: 'hidden' }} delay={0.05}>
          <Box sx={{ p: 2.5, background: `linear-gradient(135deg, ${NAVY} 0%, #0B1A30 100%)`, color: 'white', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -30, right: -20, width: 160, height: 160, background: `radial-gradient(circle, ${GOLD}33, transparent 65%)`, pointerEvents: 'none' }} />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, letterSpacing: '0.16em' }}>PLOTTED LOT</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', mt: 0.3, lineHeight: 1.1 }}>
              {extracted.title_number || `LOT ${extracted.lot_number || ''}`}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', mt: 0.4 }}>
              {[extracted.barangay, extracted.city_municipality, extracted.province].filter(Boolean).join(', ') || '—'}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mt: 2 }}>
              <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>AREA (COMPUTED)</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: GOLD }}>
                  <CountUp value={plotted.area * u.factor} decimals={u.dec} /> <Box component="span" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>{u.label}</Box>
                </Typography>
              </Box>
              <Box sx={{ p: 1.4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em' }}>CLOSURE</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: closureColor }}>
                  <CountUp value={plotted.closure.meters} decimals={3} /> <Box component="span" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>m</Box>
                </Typography>
              </Box>
            </Box>

            <ToggleButtonGroup
              value={unit} exclusive size="small" onChange={(_, v) => v && setUnit(v)}
              sx={{ mt: 1.2, '& .MuiToggleButton-root': { color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', py: 0.2, fontSize: '0.66rem', fontWeight: 700 }, '& .Mui-selected': { color: `${NAVY} !important`, bgcolor: `${GOLD} !important` } }}
            >
              <ToggleButton value="sqm">sq m</ToggleButton>
              <ToggleButton value="ha">hectares</ToggleButton>
              <ToggleButton value="sqft">sq ft</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: '0.82rem' }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Owner</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{extracted.registered_owner || '—'}</Typography>
              {Number.isFinite(extracted.land_area_sqm) && (
                <>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Area (on title)</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>
                    {fmt(extracted.land_area_sqm, 2)} sq. m.
                    {plotted.area > 0 && (() => {
                      const delta = Math.abs(plotted.area - extracted.land_area_sqm) / extracted.land_area_sqm * 100
                      const c = delta < 2 ? '#16A34A' : delta < 10 ? '#D97706' : '#DC2626'
                      return <Box component="span" sx={{ ml: 1, px: 0.7, py: 0.1, borderRadius: 1, fontSize: '0.62rem', fontWeight: 800, color: 'white', bgcolor: c }}>±{delta.toFixed(1)}%</Box>
                    })()}
                  </Typography>
                </>
              )}
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Lot No.</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{extracted.lot_number || '—'}{extracted.survey_plan_number ? ` · ${extracted.survey_plan_number}` : ''}</Typography>
            </Box>
          </Box>
        </GlassPanel>

        {/* Instant Verify — automated checklist */}
        {(() => {
          const vColor = verify.verdict === 'pass' ? '#16A34A' : verify.verdict === 'warn' ? '#D97706' : '#DC2626'
          const statusIcon = (s) => s === 'pass'
            ? <CheckCircleIcon sx={{ fontSize: 17, color: '#16A34A' }} />
            : s === 'warn'
              ? <WarningAmberIcon sx={{ fontSize: 17, color: '#D97706' }} />
              : <CancelIcon sx={{ fontSize: 17, color: '#DC2626' }} />
          return (
            <GlassPanel delay={0.08} sx={{ overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 1.6, display: 'flex', alignItems: 'center', gap: 1.2, bgcolor: `${vColor}14`, borderBottom: '1px solid', borderColor: 'divider' }}>
                <VerifiedIcon sx={{ color: vColor }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: vColor, letterSpacing: '0.14em' }}>INSTANT VERIFY</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: 'text.primary' }}>
                    {verify.verdict === 'pass' ? 'All checks passed' : verify.verdict === 'warn' ? 'Passed with cautions' : 'Needs attention'}
                  </Typography>
                </Box>
                <Chip size="small" label={`${verify.passed}/${verify.total}`} sx={{ bgcolor: vColor, color: 'white', fontWeight: 800 }} />
              </Box>
              <CardContent sx={{ py: 1.5 }}>
                <Stack spacing={1}>
                  {verify.checks.map((c, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ mt: 0.2 }}>{statusIcon(c.status)}</Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.primary' }}>{c.label}</Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{c.detail}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </GlassPanel>
          )
        })()}

        {/* Estimated Zonal Value (BIR) */}
        <GlassPanel delay={0.085}>
          <ZonalValueCard extracted={extracted} area={plotted.area} />
        </GlassPanel>

        {/* Survey Summary */}
        {survey && (() => {
          const angleClosed = Math.abs(survey.angleSum - survey.expectedAngleSum) < 2
          return (
            <GlassPanel delay={0.09}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.2 }}>
                  <StraightenIcon sx={{ fontSize: 18, color: GOLD_DARK }} />
                  <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>Survey Summary</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  {[
                    ['Perimeter', `${fmt(survey.perimeter, 2)} m`],
                    ['Corners', survey.corners],
                    ['Longest side', `${fmt(survey.longest, 2)} m`],
                    ['Shortest side', `${fmt(survey.shortest, 2)} m`],
                  ].map(([k, v]) => (
                    <Box key={k} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: 'text.primary' }}>{v}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1.2 }}>
                  {angleClosed ? <CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A' }} /> : <WarningAmberIcon sx={{ fontSize: 16, color: '#D97706' }} />}
                  <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>
                    Interior angles sum to <strong>{fmt(survey.angleSum, 1)}°</strong> (expected {survey.expectedAngleSum}° for {survey.corners} corners).
                  </Typography>
                </Box>
                <Button onClick={() => setShowSurvey(v => !v)} size="small" sx={{ mt: 0.5, fontWeight: 700, textTransform: 'none', px: 0 }}
                        endIcon={<KeyboardArrowDownIcon sx={{ transform: showSurvey ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}>
                  {showSurvey ? 'Hide' : 'Show'} side lengths & angles
                </Button>
                <Collapse in={showSurvey}>
                  <Box sx={{ maxHeight: 240, overflow: 'auto', mt: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ '& th': { bgcolor: 'action.hover', fontWeight: 800, fontSize: '0.66rem' } }}>
                          <TableCell>Side</TableCell><TableCell align="right">Length (m)</TableCell>
                          <TableCell>Corner</TableCell><TableCell align="right">Angle</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {survey.sides.map((s, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{s.label}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{fmt(s.length, 2)}</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.72rem' }}>{survey.angles[i]?.corner}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{survey.angles[i] ? `${fmt(survey.angles[i].deg, 1)}°` : '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Collapse>
              </CardContent>
            </GlassPanel>
          )
        })()}

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
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: 'text.primary' }}>Smart fix — likely transcription slip found</Typography>
                </Box>
                {fix.suggestions.slice(0, 2).map((s, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.4 }}>
                    <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary' }}>
                      Line <strong>{s.line}</strong>: {s.label} → <strong style={{ color: '#16A34A' }}>{fmt(s.after, 2)} m</strong>
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => onApplyBearings(s.bearings)} sx={{ fontWeight: 700, flexShrink: 0, py: 0, fontSize: '0.68rem' }}>Apply</Button>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </GlassPanel>

        {/* Corner coordinates */}
        <GlassPanel delay={0.13}>
          <CardContent sx={{ pb: showVertices ? 2 : '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Button onClick={() => setShowVertices(v => !v)} sx={{ fontWeight: 800, color: 'text.primary', textTransform: 'none', px: 0 }}
                      endIcon={<KeyboardArrowDownIcon sx={{ transform: showVertices ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}>
                Corner Coordinates ({plotted.corners.length - 1})
              </Button>
              <Tooltip title="Copy all as CSV">
                <IconButton size="small" onClick={copyVertices}><ContentCopyIcon sx={{ fontSize: 17 }} /></IconButton>
              </Tooltip>
            </Box>
            <Collapse in={showVertices}>
              <Box sx={{ maxHeight: 220, overflow: 'auto', mt: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { bgcolor: 'action.hover', fontWeight: 800, fontSize: '0.66rem' } }}>
                      <TableCell>#</TableCell><TableCell>Latitude</TableCell><TableCell>Longitude</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plotted.corners.slice(0, -1).map((c, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{c.lat.toFixed(6)}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{c.lng.toFixed(6)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </CardContent>
        </GlassPanel>

        <GlassPanel delay={0.16}>
          <CardContent>
            <Typography sx={{ fontWeight: 800, color: 'text.primary', mb: 1.2 }}>Export & Download</Typography>
            <SurveyPdfButton propertyMap={syntheticMap} transaction={null} size="medium" variant="contained" fullWidth label="Preview Survey PDFs" />
            <Button onClick={openStaticMap} startIcon={<DownloadIcon />} variant="outlined" fullWidth sx={{ mt: 1, fontWeight: 700 }}>
              Open map image (satellite + lot)
            </Button>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 1.2 }}>
              The PDFs are branded with FilipinoTracks. The map image opens in a new tab — right-click to save it.
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
