import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Stepper, Step, StepLabel, TextField, MenuItem,
  Select, FormControl, InputLabel, Grid, IconButton, Paper, CircularProgress,
  Alert, Chip, Divider, Tooltip, Tabs, Tab,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import MapIcon from '@mui/icons-material/Map'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import TableChartIcon from '@mui/icons-material/TableChart'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PolylineIcon from '@mui/icons-material/Polyline'
import GestureIcon from '@mui/icons-material/Gesture'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ImageIcon from '@mui/icons-material/Image'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { useDropzone } from 'react-dropzone'
import { NAVY, GOLD, GOLD_DARK } from '../../theme/theme'
import api from '../../api/axios'
import PropertyMapPicker from '../../components/map/PropertyMapPicker'
import PropertyBoundaryDrawer from '../../components/map/PropertyBoundaryDrawer'
import PhLocationPicker from '../../components/PhLocationPicker'
import { boundariesToPolygon, pointsToGeoJSON } from '../../utils/bearingToPolygon'

const STEPS = ['Property Information', 'Supporting Documents', 'Map Location', 'Boundary', 'Review & Submit']

const ACCEPTED_DOC_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg':      ['.jpg', '.jpeg'],
  'image/png':       ['.png'],
}
const MAX_DOC_SIZE = 10 * 1024 * 1024 // 10 MB per file
const MAX_DOC_COUNT = 5

const PROPERTY_TYPES = [
  { value: 'residential',  label: 'Residential' },
  { value: 'commercial',   label: 'Commercial' },
  { value: 'agricultural', label: 'Agricultural' },
  { value: 'condominium',  label: 'Condominium' },
]

const EMPTY_BOUNDARY = { point_from: '', point_to: '', dir1: 'N', degrees: '', minutes: '', dir2: 'E', distance: '' }

function StepHeader({ icon, title, subtitle, optional }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY }}>{title}</Typography>
            {optional && <Chip label="Optional" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700, fontSize: '0.65rem' }} />}
          </Box>
          {subtitle && <Typography variant="body2" sx={{ color: '#64748B' }}>{subtitle}</Typography>}
        </Box>
      </Box>
    </Box>
  )
}

/* ──────────────────────────────────────────────────────────
   Documents dropzone — drag/drop or click to attach files
   ────────────────────────────────────────────────────────── */
function DocumentsDropzone({ documents, onAdd, onRemove }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_DOC_TYPES,
    maxSize: MAX_DOC_SIZE,
    maxFiles: MAX_DOC_COUNT,
    onDrop: onAdd,
  })

  const fileIcon = (file) => {
    if (file.type === 'application/pdf') return <PictureAsPdfIcon sx={{ color: '#DC2626' }} />
    if (file.type?.startsWith('image/'))  return <ImageIcon sx={{ color: '#2563EB' }} />
    return <InsertDriveFileIcon sx={{ color: '#64748B' }} />
  }
  const fmtSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <Box>
      {/* Dropzone */}
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? GOLD : 'divider',
          borderRadius: 3,
          py: 4, px: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? `${GOLD}10` : 'action.hover',
          transition: 'all 0.2s',
          '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}08` },
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: isDragActive ? GOLD : 'text.disabled', mb: 1 }} />
        <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          {isDragActive ? 'Drop files here…' : 'Drag and drop files, or click to browse'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          PDF · JPG · PNG · up to {MAX_DOC_SIZE / 1024 / 1024}MB per file
        </Typography>
      </Box>

      {/* File list */}
      {documents.length > 0 && (
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.2 }}>
            {documents.length} {documents.length === 1 ? 'file' : 'files'} ready to upload
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {documents.map((file, i) => (
              <Box key={i} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                p: 1.5, borderRadius: 2,
                border: 1, borderColor: 'divider',
                bgcolor: 'background.paper',
              }}>
                {fileIcon(file)}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                    {fmtSize(file.size)}
                  </Typography>
                </Box>
                <Tooltip title="Remove">
                  <IconButton size="small" onClick={() => onRemove(i)} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default function TitleVerificationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [info, setInfo] = useState({
    title_number: '', lot_number: '', block_number: '', survey_plan_number: '',
    tax_declaration_number: '', property_type: '', registered_owner: '',
    land_area: '', province: '', city_municipality: '', barangay: '',
    full_address: '', remarks: '',
  })
  const [location, setLocation] = useState({ lat: null, lng: null })
  const [boundaries, setBoundaries] = useState([{ ...EMPTY_BOUNDARY }])
  const [drawnPoints, setDrawnPoints] = useState([])
  const [boundaryMethod, setBoundaryMethod] = useState('draw') // 'draw' | 'bearings'
  const [fieldErrors, setFieldErrors] = useState({})
  const [documents, setDocuments] = useState([])  // File[] staged for upload at submit time

  // Setter that also clears the field's error once the user starts editing.
  const set = (k) => (e) => {
    setInfo(p => ({ ...p, [k]: e.target.value }))
    if (fieldErrors[k]) setFieldErrors(prev => ({ ...prev, [k]: undefined }))
  }

  // Required fields for Step 1 → cannot proceed without them.
  const REQUIRED_STEP_1 = {
    title_number:     'Title number is required',
    registered_owner: 'Registered owner name is required',
    property_type:    'Please choose a property type',
  }

  const validateStep1 = () => {
    const errs = {}
    for (const [k, msg] of Object.entries(REQUIRED_STEP_1)) {
      if (!String(info[k] || '').trim()) errs[k] = msg
    }
    return errs
  }

  const handleNext = () => {
    if (step === 0) {
      const errs = validateStep1()
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        setError('Please fill in the required fields highlighted below.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    if (step === 1 && documents.length === 0) {
      setError('Please upload at least one supporting document before continuing.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError('')
    setFieldErrors({})
    setStep(s => s + 1)
  }

  // Document upload handlers
  const handleAddDocs = (files) => {
    const filtered = files.filter(f => f.size <= MAX_DOC_SIZE)
    setDocuments(prev => [...prev, ...filtered].slice(0, MAX_DOC_COUNT))
    const rejected = files.length - filtered.length
    if (rejected > 0) setError(`${rejected} file(s) skipped — max size is ${MAX_DOC_SIZE / 1024 / 1024} MB each.`)
    else setError('')
  }
  const handleRemoveDoc = (i) => setDocuments(prev => prev.filter((_, idx) => idx !== i))

  // Compute polygon from currently-selected method
  const computedFromBearings = location.lat
    ? boundariesToPolygon(location.lat, location.lng, boundaries.map(b => ({ ...b })))
    : []
  const polygonPoints = boundaryMethod === 'draw' ? drawnPoints : computedFromBearings

  const handleAddRow = () => setBoundaries(p => [...p, { ...EMPTY_BOUNDARY }])
  const handleRemoveRow = (i) => setBoundaries(p => p.filter((_, idx) => idx !== i))
  const setRow = (i, k) => (e) => {
    setBoundaries(p => p.map((r, idx) => idx === i ? { ...r, [k]: e.target.value } : r))
  }

  const hasBearings   = boundaries.some(b => b.degrees && b.distance)
  const hasDrawn      = drawnPoints.length >= 3
  const hasBoundaries = boundaryMethod === 'draw' ? hasDrawn : hasBearings

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      // 1. Create transaction
      const { data: tx } = await api.post('/transactions', {
        service_type: 'title-verification',
        property_title_number: info.title_number,
        lot_number: info.lot_number,
        block_number: info.block_number,
        tax_declaration_number: info.tax_declaration_number,
        property_address: info.full_address,
        property_type: info.property_type,
        lot_area: info.land_area,
        registered_owner: info.registered_owner,
        remarks: info.remarks,
      })

      // 2. Compute GeoJSON polygon if boundaries exist
      const geoJson = polygonPoints.length > 2 ? pointsToGeoJSON(polygonPoints) : null

      // 3. Save property map
      // Only send bearing rows when user actually entered them via the bearings tab;
      // hand-drawn polygons store their shape entirely in geojson_polygon.
      await api.post(`/transactions/${tx.id}/property-map`, {
        ...info,
        latitude: location.lat,
        longitude: location.lng,
        geojson_polygon: geoJson,
        boundaries: boundaryMethod === 'bearings' && hasBearings ? boundaries : [],
      })

      // 4. Upload supporting documents (required) — sequential to keep error handling simple
      for (const file of documents) {
        const fd = new FormData()
        fd.append('file', file)
        try {
          await api.post(`/transactions/${tx.id}/documents`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch {
          // Continue uploading the rest — the transaction is already created
        }
      }

      navigate(`/portal/transactions/${tx.id}`, { state: { new: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero */}
      <Box sx={{ background: `linear-gradient(140deg, #1A3A6E 0%, #245AA0 100%)`, px: { xs: 3, md: 5 }, pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 6 } }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}
            sx={{ color: 'rgba(255,255,255,0.6)', mb: 2, fontWeight: 600, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 0.5 }}>Land / Title Verification Request</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem' }}>
            Submit your property details for professional title verification
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

        {/* Stepper */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)' }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label, i) => (
              <Step key={label} completed={step > i}>
                <StepLabel sx={{
                  '& .MuiStepLabel-label': { fontWeight: step === i ? 700 : 500, color: step === i ? NAVY : '#94A3B8', fontSize: '0.8rem' },
                  '& .MuiStepIcon-root.Mui-active': { color: GOLD },
                  '& .MuiStepIcon-root.Mui-completed': { color: '#22C55E' },
                }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>

            {/* ── STEP 1: Property Information ── */}
            {step === 0 && (
              <Paper sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)' }}>
                <StepHeader icon={<HomeWorkIcon sx={{ color: NAVY, fontSize: 20 }} />} title="Property Information" subtitle="Enter the details from your property title" />
                <Grid container spacing={2}>
                  {/* Row 1 — three title identifiers (3 cols at md+, 1-col on mobile) */}
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      label="Title Number"
                      required
                      fullWidth size="small"
                      value={info.title_number}
                      onChange={set('title_number')}
                      error={!!fieldErrors.title_number}
                      helperText={fieldErrors.title_number}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}><TextField label="Lot Number"   fullWidth size="small" value={info.lot_number}   onChange={set('lot_number')} /></Grid>
                  <Grid item xs={12} sm={6} md={4}><TextField label="Block Number" fullWidth size="small" value={info.block_number} onChange={set('block_number')} /></Grid>

                  {/* Row 2 — declarations & type */}
                  <Grid item xs={12} sm={6} md={4}><TextField label="Survey Plan Number"     fullWidth size="small" value={info.survey_plan_number}     onChange={set('survey_plan_number')} /></Grid>
                  <Grid item xs={12} sm={6} md={4}><TextField label="Tax Declaration Number" fullWidth size="small" value={info.tax_declaration_number} onChange={set('tax_declaration_number')} /></Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small" required error={!!fieldErrors.property_type}>
                      <InputLabel shrink>Property Type</InputLabel>
                      <Select
                        label="Property Type *"
                        notched
                        displayEmpty
                        value={info.property_type}
                        onChange={set('property_type')}
                        renderValue={(selected) => {
                          if (!selected) return <em style={{ color: '#94A3B8', fontStyle: 'normal' }}>Select type</em>
                          return PROPERTY_TYPES.find(t => t.value === selected)?.label || selected
                        }}
                      >
                        {PROPERTY_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                      </Select>
                      {fieldErrors.property_type && (
                        <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5 }}>
                          {fieldErrors.property_type}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Row 3 — owner & land area */}
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Registered Owner Name"
                      required
                      fullWidth size="small"
                      value={info.registered_owner}
                      onChange={set('registered_owner')}
                      error={!!fieldErrors.registered_owner}
                      helperText={fieldErrors.registered_owner}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}><TextField label="Land Area (sqm)" type="number" fullWidth size="small" value={info.land_area} onChange={set('land_area')} /></Grid>

                  {/* Row 4 — location (province / city / barangay, perfect 3-col fit) */}
                  <PhLocationPicker
                    onChange={({ province, city_municipality, barangay }) =>
                      setInfo(p => ({ ...p, province, city_municipality, barangay }))
                    }
                  />

                  {/* Row 5+ — addresses */}
                  <Grid item xs={12}><TextField label="Full Address" fullWidth size="small" multiline rows={2} value={info.full_address} onChange={set('full_address')} /></Grid>
                  <Grid item xs={12}><TextField label="Additional Remarks (optional)" fullWidth size="small" multiline rows={2} value={info.remarks} onChange={set('remarks')} /></Grid>
                </Grid>
              </Paper>
            )}

            {/* ── STEP 2: Map Location ── */}
            {/* ── STEP 2: Supporting Documents ── */}
            {step === 1 && (
              <Paper sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)' }}>
                <StepHeader
                  icon={<CloudUploadIcon sx={{ color: NAVY, fontSize: 20 }} />}
                  title="Supporting Documents"
                  subtitle="Attach a copy of the land title and any supporting documents"
                />
                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.82rem' }}>
                  <strong>Required.</strong> Upload at least one document (TCT/OCT/CCT, tax declaration, deed of sale, or any proof of ownership). Accepted formats: <strong>PDF, JPG, PNG</strong> · max <strong>10MB</strong> each · up to <strong>{MAX_DOC_COUNT}</strong> files.
                </Alert>

                <DocumentsDropzone documents={documents} onAdd={handleAddDocs} onRemove={handleRemoveDoc} />
              </Paper>
            )}

            {step === 2 && (
              <Paper sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)' }}>
                <StepHeader
                  icon={<MapIcon sx={{ color: NAVY, fontSize: 20 }} />}
                  title="Map Location"
                  subtitle="Pin the exact location of your property on the map"
                  optional
                />
                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.82rem' }}>
                  <strong>This step is optional.</strong> If you don't know the exact location, you can skip it and our staff will assist you. Click anywhere on the map to place a pin.
                </Alert>
                <PropertyMapPicker
                  lat={location.lat}
                  lng={location.lng}
                  polygonPoints={polygonPoints}
                  onChange={({ lat, lng }) => setLocation({ lat, lng })}
                />
                {location.lat && (
                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button size="small" onClick={() => setLocation({ lat: null, lng: null })} sx={{ color: '#EF4444', fontWeight: 600 }}>
                      Clear Pin
                    </Button>
                  </Box>
                )}
              </Paper>
            )}

            {/* ── STEP 3: Boundary Definition ── */}
            {step === 3 && (
              <Paper sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)' }}>
                <StepHeader
                  icon={<PolylineIcon sx={{ color: NAVY, fontSize: 20 }} />}
                  title="Boundary Definition"
                  subtitle="Define the property boundary — draw it on the map or enter the coordinates"
                  optional
                />
                <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.82rem' }}>
                  <strong>This step is optional.</strong> Choose the method that's easier for you. Both produce the same polygon on the map for our staff to verify.
                </Alert>

                {/* Method tabs */}
                <Tabs
                  value={boundaryMethod}
                  onChange={(_, v) => setBoundaryMethod(v)}
                  sx={{
                    mb: 3,
                    borderBottom: 1, borderColor: 'divider',
                    '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.88rem', minHeight: 44 },
                    '& .Mui-selected': { color: `${GOLD_DARK} !important` },
                    '& .MuiTabs-indicator': { backgroundColor: GOLD, height: 3, borderRadius: '3px 3px 0 0' },
                  }}
                >
                  <Tab
                    value="draw"
                    icon={<GestureIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Draw on Map"
                  />
                  <Tab
                    value="bearings"
                    icon={<TableChartIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Enter Coordinates"
                  />
                </Tabs>

                {/* ── DRAW MODE ── */}
                {boundaryMethod === 'draw' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
                      Click anywhere on the map to drop boundary vertices. After 3+ vertices the polygon will appear automatically. You can drag any numbered pin to adjust its position.
                    </Typography>
                    <PropertyBoundaryDrawer
                      centerLat={location.lat}
                      centerLng={location.lng}
                      points={drawnPoints}
                      onChange={setDrawnPoints}
                    />
                    {hasDrawn && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: `${GOLD}10`, border: `1px solid ${GOLD}40`, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: GOLD_DARK, mb: 0.5 }}>
                          ✓ Boundary drawn ({drawnPoints.length} vertices)
                        </Typography>
                        <Typography variant="caption" sx={{ color: GOLD_DARK }}>
                          Our staff will verify the boundary using your supporting documents.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* ── BEARINGS MODE ── */}
                {boundaryMethod === 'bearings' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
                      Enter bearings and distances exactly as shown on your property's Technical Description. The system computes the boundary starting from the pin you placed in Step 2.
                    </Typography>

                    {/* Column headers */}
                    <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '80px 80px 1fr 80px 80px 1fr 120px 44px', gap: 1, mb: 1, px: 0.5 }}>
                      {['Pt From', 'Pt To', 'Direction', '°Deg', "'Min", 'Direction', 'Distance (m)', ''].map(h => (
                        <Typography key={h} variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', fontSize: '0.62rem' }}>{h}</Typography>
                      ))}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {boundaries.map((row, i) => (
                        <Box key={i} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '80px 80px 1fr 80px 80px 1fr 120px 44px' }, gap: 1, alignItems: 'center', p: { xs: 1.5, md: 0 }, bgcolor: { xs: 'action.hover', md: 'transparent' }, borderRadius: { xs: 2, md: 0 }, border: { xs: 1, md: 'none' }, borderColor: { xs: 'divider', md: 'transparent' } }}>
                          <TextField size="small" placeholder="1" value={row.point_from} onChange={setRow(i, 'point_from')} inputProps={{ style: { textAlign: 'center' } }} />
                          <TextField size="small" placeholder="2" value={row.point_to} onChange={setRow(i, 'point_to')} inputProps={{ style: { textAlign: 'center' } }} />
                          <FormControl size="small">
                            <Select value={row.dir1} onChange={setRow(i, 'dir1')}>
                              <MenuItem value="N">N (North)</MenuItem>
                              <MenuItem value="S">S (South)</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField size="small" placeholder="45" type="number" value={row.degrees} onChange={setRow(i, 'degrees')} inputProps={{ min: 0, max: 89, style: { textAlign: 'center' } }} />
                          <TextField size="small" placeholder="30" type="number" value={row.minutes} onChange={setRow(i, 'minutes')} inputProps={{ min: 0, max: 59, style: { textAlign: 'center' } }} />
                          <FormControl size="small">
                            <Select value={row.dir2} onChange={setRow(i, 'dir2')}>
                              <MenuItem value="E">E (East)</MenuItem>
                              <MenuItem value="W">W (West)</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField size="small" placeholder="Meters" type="number" value={row.distance} onChange={setRow(i, 'distance')} />
                          <Tooltip title="Remove row">
                            <span>
                              <IconButton size="small" onClick={() => handleRemoveRow(i)} disabled={boundaries.length === 1}
                                sx={{ color: 'error.main', '&:disabled': { color: 'action.disabled' } }}>
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      ))}
                    </Box>

                    <Button startIcon={<AddIcon />} onClick={handleAddRow} sx={{ mt: 2, color: 'text.primary', fontWeight: 700, bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
                      Add Row
                    </Button>

                    {hasBearings && location.lat && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: `${GOLD}10`, border: `1px solid ${GOLD}40`, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: GOLD_DARK, mb: 0.5 }}>
                          ✓ Boundary will be drawn on map ({computedFromBearings.length} points computed)
                        </Typography>
                        <Typography variant="caption" sx={{ color: GOLD_DARK }}>
                          This is an approximate visualization only, not a legal cadastral plot.
                        </Typography>
                      </Box>
                    )}

                    {hasBearings && !location.lat && (
                      <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, fontSize: '0.82rem' }}>
                        Please go back and pin a starting location on the map to enable boundary drawing.
                      </Alert>
                    )}
                  </Box>
                )}
              </Paper>
            )}

            {/* ── STEP 4: Review & Submit ── */}
            {step === 4 && (
              <Paper sx={{ p: { xs: 2, md: 3.5 }, borderRadius: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)' }}>
                <StepHeader icon={<CheckCircleIcon sx={{ color: NAVY, fontSize: 20 }} />} title="Review & Submit" subtitle="Confirm your details before submitting" />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Property info summary */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: NAVY, mb: 1.5 }}>Property Details</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      {[
                        ['Registered Owner', info.registered_owner],
                        ['Title Number', info.title_number],
                        ['Lot Number', info.lot_number],
                        ['Block Number', info.block_number],
                        ['Property Type', info.property_type],
                        ['Land Area', info.land_area ? `${info.land_area} sqm` : null],
                        ['Province', info.province],
                        ['City/Municipality', info.city_municipality],
                        ['Barangay', info.barangay],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <Box key={label}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem' }}>{label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{value}</Typography>
                        </Box>
                      ))}
                    </Box>
                    {info.full_address && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.62rem' }}>Full Address</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{info.full_address}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Divider />

                  {/* Documents summary */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<CloudUploadIcon sx={{ fontSize: 14 }} />}
                      label={`✓ ${documents.length} ${documents.length === 1 ? 'document' : 'documents'} attached`}
                      size="small"
                      sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }}
                    />
                  </Box>

                  <Divider />

                  {/* Location summary */}
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {location.lat
                        ? <Chip label="✓ Location Pinned" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
                        : <Chip label="No Location" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700 }} />}
                    </Box>
                    {hasBoundaries
                      ? <Chip label={`✓ ${boundaries.filter(b => b.degrees && b.distance).length} Boundary Points`} size="small" sx={{ bgcolor: `${GOLD}20`, color: '#A8882A', fontWeight: 700 }} />
                      : <Chip label="No Technical Description" size="small" sx={{ bgcolor: '#F1F5F9', color: '#64748B', fontWeight: 700 }} />}
                  </Box>

                  <Box sx={{ p: 2.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ color: '#92400E', lineHeight: 1.7 }}>
                      By submitting, you confirm that all information provided is accurate and that you are authorized to submit this title verification request. Our team will review your submission within 1–3 business days.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            startIcon={<ArrowBackIcon />}
            sx={{ color: '#64748B', fontWeight: 600 }}
          >
            Back
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {step < 4 ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNext}
                sx={{ fontWeight: 700, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, color: NAVY, px: 3 }}
              >
                {step === 2 && !location.lat ? 'Skip Location' : step === 3 && !hasBoundaries ? 'Skip' : 'Next'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                sx={{ fontWeight: 700, background: `linear-gradient(135deg, #22C55E 0%, #16A34A 100%)`, color: 'white', px: 4 }}
              >
                {submitting ? 'Submitting…' : 'Submit Request'}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
