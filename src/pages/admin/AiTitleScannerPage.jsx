import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { GoogleMap, Polygon, Marker, useJsApiLoader } from '@react-google-maps/api'
import {
  Box, Paper, Typography, Stepper, Step, StepLabel, Button, IconButton,
  TextField, Stack, Chip, Divider, Alert, CircularProgress, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, Card, CardContent,
  ToggleButtonGroup, ToggleButton, useTheme, useMediaQuery,
} from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import MapIcon from '@mui/icons-material/Map'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon   from '@mui/icons-material/ArrowBack'
import { motion, AnimatePresence } from 'framer-motion'
import { GOLD, GOLD_DARK, NAVY } from '../../theme/theme'
import { GOOGLE_MAPS_LIBRARIES as LIBRARIES } from '../../utils/mapsLibraries'
import { scanTitleImage } from '../../utils/openaiVision'
import { plotPolygonFromBearings, closureError, cornersToGeoJsonPolygon, quadrantToTrueBearing } from '../../utils/bearingsPlotter'
import { parseCoordinates, formatCoordsDMS } from '../../utils/coordinates'
import { polygonAreaSqm } from '../../utils/polygonGis'
import { useToast } from '../../context/ToastContext'
import SurveyPdfButton from '../../components/SurveyPdfButton'

const STEPS = ['Upload Title', 'Review Data', 'Pin Start Point', 'Plotted Result']
const PH_CENTER = { lat: 12.8797, lng: 121.7740 }

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
        { point_from: fromN || '1', point_to: nextNo, dir1: 'N', degrees: 0, minutes: 0, dir2: 'E', distance: 0 },
      ],
    }
  })
  const removeBearing = (idx) => setExtracted(prev => ({
    ...prev,
    bearings: prev.bearings.filter((_, i) => i !== idx),
  }))

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
    const corners = plotPolygonFromBearings(startPoint, extracted.bearings)
    const closure = closureError(corners)
    const feature = cornersToGeoJsonPolygon(corners)
    const ring = feature?.geometry?.coordinates?.[0] || []
    const area = polygonAreaSqm(ring.slice(0, -1))  // omit closing duplicate
    return { corners, closure, feature, area }
  }, [startPoint, extracted])

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
  }

  /* ─── UI ──────────────────────────────────────────────────────────── */
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: 'calc(100vh - 56px)' }}>
      {/* Hero */}
      <Paper sx={{
        p: 2.5, mb: 2.5,
        background: `linear-gradient(135deg, ${NAVY} 0%, #060E1A 100%)`,
        color: 'white', borderRadius: 3, position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{
            width: 50, height: 50, borderRadius: 2,
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AutoAwesomeIcon sx={{ color: NAVY, fontSize: 26 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD, letterSpacing: '0.18em' }}>
              AI-POWERED · LAND TITLE SCANNER
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.15rem', md: '1.4rem' }, lineHeight: 1.15, mt: 0.3 }}>
              Upload a title → AI extracts the technical description → auto-plots the lot.
            </Typography>
          </Box>
          {step > 0 && (
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={handleRestart}
              sx={{ color: GOLD, borderColor: GOLD, fontWeight: 700, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.06)' } }}
            >
              Start Over
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Stepper activeStep={step} alternativeLabel={!isMobile}
            sx={{
              '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontSize: '0.74rem' },
              '& .MuiStepLabel-label.Mui-active':    { color: GOLD, fontWeight: 800 },
              '& .MuiStepLabel-label.Mui-completed': { color: 'rgba(255,255,255,0.85)' },
              '& .MuiStepIcon-root': { color: 'rgba(255,255,255,0.25)' },
              '& .MuiStepIcon-root.Mui-active':    { color: GOLD },
              '& .MuiStepIcon-root.Mui-completed': { color: GOLD_DARK },
              '& .MuiStepConnector-line': { borderColor: 'rgba(255,255,255,0.15)' },
            }}
          >
            {STEPS.map((s) => (
              <Step key={s}><StepLabel>{s}</StepLabel></Step>
            ))}
          </Stepper>
        </Box>
      </Paper>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {step === 0 && (
            <StepUpload
              files={files}
              onDrop={onDrop}
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
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <StepPin
              isLoaded={isLoaded}
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
              resultRef={resultRef}
              syntheticMap={syntheticMap}
              onBack={() => setStep(2)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}

/* ────────────────────────────────────────────────────────────────────
   STEP 1 — Upload
   ──────────────────────────────────────────────────────────────────── */
function StepUpload({ files, getRootProps, getInputProps, isDragActive, onRemove, onScan, scanning }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
        Upload the Land Title
      </Typography>
      <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary', mb: 2.5 }}>
        A clear photo or scan of the title page works best. You can upload both <strong>front and back</strong> for higher accuracy.
      </Typography>

      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed', borderColor: isDragActive ? GOLD : 'divider',
          borderRadius: 3, p: { xs: 3, md: 5 }, textAlign: 'center',
          cursor: 'pointer', bgcolor: isDragActive ? `${GOLD}10` : 'action.hover',
          transition: 'all 0.2s',
          '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}08` },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 56, color: GOLD, mb: 1.5 }} />
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary', mb: 0.6 }}>
          {isDragActive ? 'Drop the title image(s) here' : 'Drag a title image here, or click to browse'}
        </Typography>
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
          JPG / PNG / WEBP · up to 20 MB each · up to 2 files (front + back)
        </Typography>
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 2.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          {files.map((f, i) => (
            <Card key={i} sx={{ position: 'relative', overflow: 'hidden' }}>
              <Box sx={{ position: 'relative', height: 220, bgcolor: '#0F172A' }}>
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={() => onRemove(i)}
                    sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: 'white' } }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ px: 1.5, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
        <Button
          variant="contained"
          color="secondary"
          disabled={!files.length || scanning}
          onClick={onScan}
          startIcon={scanning ? <CircularProgress size={16} sx={{ color: NAVY }} /> : <AutoAwesomeIcon />}
          sx={{ fontWeight: 800, px: 3, py: 1.2 }}
        >
          {scanning ? 'AI is reading the title…' : 'Scan with AI'}
        </Button>
      </Box>

      <Alert severity="info" sx={{ mt: 2.5, fontSize: '0.78rem' }}>
        Powered by OpenAI Vision. The AI extracts the title number, lot number, registered owner, area, and the full bearings table.
        You'll get a chance to review and edit before plotting.
      </Alert>
    </Paper>
  )
}

/* ────────────────────────────────────────────────────────────────────
   STEP 2 — Review & edit
   ──────────────────────────────────────────────────────────────────── */
function StepReview({ extracted, onUpdate, onUpdateBearing, onAddBearing, onRemoveBearing, onBack, onNext }) {
  const confColor = extracted.confidence === 'high' ? '#16A34A' : extracted.confidence === 'medium' ? '#D97706' : '#DC2626'
  const canContinue = (extracted.bearings || []).length >= 3

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr' }, gap: 2.5 }}>
      {/* Property fields */}
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>Extracted Property Info</Typography>
          <Chip
            icon={<AutoAwesomeIcon sx={{ fontSize: 14, color: 'white !important' }} />}
            label={`${extracted.confidence?.toUpperCase()} confidence`}
            size="small"
            sx={{ bgcolor: confColor, color: 'white', fontWeight: 700, fontSize: '0.65rem' }}
          />
        </Box>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 2 }}>
          Review what the AI read. Edit any field if it misread something.
        </Typography>

        <Stack spacing={1.5}>
          <TextField size="small" label="Title Number"        value={extracted.title_number || ''}       onChange={(e) => onUpdate('title_number', e.target.value)} fullWidth />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" label="Lot Number"        value={extracted.lot_number || ''}         onChange={(e) => onUpdate('lot_number', e.target.value)} fullWidth />
            <TextField size="small" label="Block"             value={extracted.block_number || ''}       onChange={(e) => onUpdate('block_number', e.target.value)} sx={{ width: 100 }} />
          </Box>
          <TextField size="small" label="Survey Plan Number"  value={extracted.survey_plan_number || ''} onChange={(e) => onUpdate('survey_plan_number', e.target.value)} fullWidth />
          <TextField size="small" label="Registered Owner"    value={extracted.registered_owner || ''}   onChange={(e) => onUpdate('registered_owner', e.target.value)} fullWidth />
          <TextField size="small" label="Land Area (sqm)"     type="number" value={extracted.land_area_sqm ?? ''}
                     onChange={(e) => onUpdate('land_area_sqm', e.target.value === '' ? null : Number(e.target.value))} fullWidth />
          <Divider sx={{ my: 0.5 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" label="Barangay"          value={extracted.barangay || ''}          onChange={(e) => onUpdate('barangay', e.target.value)} fullWidth />
            <TextField size="small" label="City/Municipality" value={extracted.city_municipality || ''} onChange={(e) => onUpdate('city_municipality', e.target.value)} fullWidth />
          </Box>
          <TextField size="small" label="Province"            value={extracted.province || ''}          onChange={(e) => onUpdate('province', e.target.value)} fullWidth />
          {extracted.tie_line && (
            <TextField size="small" label="Tie Line" value={extracted.tie_line} onChange={(e) => onUpdate('tie_line', e.target.value)} fullWidth multiline minRows={2} />
          )}
        </Stack>
      </Paper>

      {/* Bearings table */}
      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>
            Technical Description ({extracted.bearings?.length || 0} bearings)
          </Typography>
          <Button size="small" startIcon={<AddIcon sx={{ fontSize: 16 }} />} onClick={onAddBearing} sx={{ fontWeight: 700 }}>
            Add row
          </Button>
        </Box>

        {(!extracted.bearings || extracted.bearings.length < 3) && (
          <Alert severity="warning" sx={{ mb: 1.5, fontSize: '0.76rem' }}>
            A polygon needs at least 3 bearings. {extracted.bearings?.length === 0 && 'The AI didn\'t find any — add them manually or re-scan a clearer image.'}
          </Alert>
        )}

        <Box sx={{ maxHeight: 460, overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
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
                <TableRow key={i} hover>
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 1 }}>
          <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>Back</Button>
          <Button variant="contained" color="secondary" disabled={!canContinue} onClick={onNext}
                  endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 800 }}>
            Looks good · Pin start point
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

/* ────────────────────────────────────────────────────────────────────
   STEP 3 — Pin the starting point
   ──────────────────────────────────────────────────────────────────── */
function StepPin({
  isLoaded, startPoint, coordInput, setCoordInput, coordError, setCoordError,
  onCoordSubmit, onLocate, onMapClick, mapType, setMapType, mapRef, onBack, onNext,
}) {
  // Push map-type changes through to the live SDK instance — @react-google-maps
  // sometimes ignores the prop on re-render at higher zoom levels.
  useEffect(() => {
    if (mapRef.current && mapType) mapRef.current.setMapTypeId(mapType)
  }, [mapType, mapRef])

  return (
    <Paper sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.05rem' }}>
            Pin Corner #1 — the starting point
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.4 }}>
            Click on the satellite map to drop a pin, or paste coordinates below. The system walks the bearings from this point to plot the lot.
          </Typography>
        </Box>
        <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small">
          <ToggleButton value="satellite"><SatelliteAltIcon sx={{ fontSize: 16, mr: 0.5 }} /> Satellite</ToggleButton>
          <ToggleButton value="roadmap"><MapIcon sx={{ fontSize: 16, mr: 0.5 }} /> Map</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{
        display: 'flex', gap: 1, mb: 1.5, p: 1.5, borderRadius: 2,
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

      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', height: { xs: 340, md: 520 } }}>
        {!isLoaded ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress sx={{ color: GOLD }} />
          </Box>
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={startPoint || PH_CENTER}
            zoom={startPoint ? 19 : 6}
            mapTypeId={mapType}
            onClick={onMapClick}
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
                onDragEnd={(e) => onMapClick({ latLng: e.latLng })}
                label={{ text: '1', color: '#0A1628', fontWeight: '800', fontSize: '11px' }}
                animation={window.google?.maps?.Animation?.DROP}
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
                  endIcon={<ArrowForwardIcon />} sx={{ fontWeight: 800 }}>
            Plot the Lot
          </Button>
        </Box>
      </Box>
    </Paper>
  )
}

/* ────────────────────────────────────────────────────────────────────
   STEP 4 — Plotted result
   ──────────────────────────────────────────────────────────────────── */
function StepResult({ isLoaded, extracted, plotted, resultRef, syntheticMap, onBack }) {
  const closureSeverity = plotted.closure.meters < 1 ? 'good' : plotted.closure.meters < 5 ? 'ok' : 'warning'
  const closureColor = closureSeverity === 'good' ? '#16A34A' : closureSeverity === 'ok' ? '#D97706' : '#DC2626'
  const fmt = (n, d = 2) => n.toLocaleString('en-PH', { minimumFractionDigits: d, maximumFractionDigits: d })

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' }, gap: 2.5 }}>
      {/* Map */}
      <Paper sx={{ p: 1.5, borderRadius: 3 }}>
        <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', height: { xs: 380, md: 560 } }}>
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
                options={{ fillColor: GOLD, fillOpacity: 0.35, strokeColor: GOLD, strokeWeight: 3, strokeOpacity: 1 }}
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
      </Paper>

      {/* Result panel */}
      <Stack spacing={2}>
        <Card sx={{ borderTop: `4px solid ${GOLD}` }}>
          <CardContent>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em' }}>
              PLOTTED LOT
            </Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary', mt: 0.2 }}>
              {extracted.title_number || `LOT ${extracted.lot_number || ''}`}
            </Typography>
            <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: '0.82rem' }}>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Owner</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{extracted.registered_owner || '—'}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Area (computed)</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{fmt(plotted.area, 2)} sq. m.</Typography>
              {Number.isFinite(extracted.land_area_sqm) && (
                <>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Area (on title)</Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{fmt(extracted.land_area_sqm, 2)} sq. m.</Typography>
                </>
              )}
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Lot No.</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>{extracted.lot_number || '—'}{extracted.survey_plan_number ? ` · ${extracted.survey_plan_number}` : ''}</Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>Location</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 700 }}>
                {[extracted.barangay, extracted.city_municipality, extracted.province].filter(Boolean).join(', ') || '—'}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ borderLeft: `4px solid ${closureColor}` }}>
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
          </CardContent>
        </Card>

        <Card>
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
        </Card>

        <Button onClick={onBack} startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>
          Back to start point
        </Button>
      </Stack>
    </Box>
  )
}
