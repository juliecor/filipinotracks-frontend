import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Box, Container, Typography, Stack, Chip, Button, Alert, TextField,
  CircularProgress, Divider, Snackbar, Link as MuiLink,
} from '@mui/material'
import { GoogleMap, Polygon, useJsApiLoader } from '@react-google-maps/api'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined'
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import api from '../api/axios'
import {
  NAVY, NAVY_DEEP, NAVY_LINE, GOLD, GOLD_LIGHT, GOLD_DARK,
  TEXT_MUTED, BORDER,
} from '../theme/theme'
import {
  getPolygonPoints, computePolygonArea, computeSideMeasurements,
  formatArea, formatDistance,
} from '../utils/propertyGeo'
import { GOOGLE_MAPS_LIBRARIES } from '../utils/mapsLibraries'
import PolygonMeasurements from '../components/map/PolygonMeasurements'
import { buildPropertyPdfDoc } from '../utils/propertyPdfReport'
import PdfPreviewDialog from '../components/property/PdfPreviewDialog'
import PublicPropertyGallery from '../components/property/PublicPropertyGallery'

function DetailRow({ label, value, mono }) {
  if (!value && value !== 0) return null
  return (
    <Box sx={{ display: 'flex', py: 1, gap: 1.5, borderBottom: '1px dashed', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.08em', flex: '0 0 40%', pt: 0.2 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'text.primary', flex: 1, fontFamily: mono ? 'monospace' : undefined, textTransform: mono ? 'none' : 'capitalize', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  )
}

export default function PublicPropertyPage() {
  const { code } = useParams()

  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Inquiry form
  const [form,        setForm]        = useState({ name: '', email: '', phone: '', message: '' })
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitOk,    setSubmitOk]    = useState(false)

  // PDF preview
  const [previewDoc,      setPreviewDoc]      = useState(null)
  const [previewFilename, setPreviewFilename] = useState('')
  const [pdfBusy,         setPdfBusy]         = useState(false)
  const [pdfError,        setPdfError]        = useState('')

  const mapRef = useRef(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  useEffect(() => {
    setLoading(true)
    setError('')
    api.get(`/public/properties/${code}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Property not available.'))
      .finally(() => setLoading(false))
  }, [code])

  // Update tab title + meta tags for richer social previews (best-effort SPA fallback)
  useEffect(() => {
    if (!data) return
    const owner = data.property?.registered_owner || 'Property'
    document.title = `${owner} · FilipinoTracks`
    const desc = `${owner} — ${[data.property?.city_municipality, data.property?.province].filter(Boolean).join(', ')}. View boundary, area, and details on FilipinoTracks.`
    const setMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="description"]`)
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }
    setMeta('description', desc)
  }, [data])

  const property = data?.property
  const points   = useMemo(() => property ? getPolygonPoints(property) : [], [property])
  const center   = useMemo(() => {
    if (points.length < 3) return null
    return {
      lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
      lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
    }
  }, [points])

  // Fit map to polygon once it's ready
  useEffect(() => {
    if (!isLoaded || !mapRef.current || points.length < 3 || !window.google?.maps) return
    const bounds = new window.google.maps.LatLngBounds()
    points.forEach(p => bounds.extend(p))
    mapRef.current.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 })
  }, [isLoaded, points])

  const area      = useMemo(() => points.length >= 3 && window.google?.maps?.geometry ? computePolygonArea(points) : 0, [points, isLoaded])
  const sides     = useMemo(() => points.length >= 3 && window.google?.maps?.geometry ? computeSideMeasurements(points) : [], [points, isLoaded])
  const perimeter = useMemo(() => sides.reduce((s, x) => s + x.length, 0), [sides])

  const handleInquire = async (e) => {
    e.preventDefault()
    setSubmitError('')
    if (!form.name.trim() || !form.message.trim()) {
      setSubmitError('Please enter your name and a short message.')
      return
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setSubmitError('Please provide either an email or a phone number so we can reach you.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/public/properties/${code}/inquire`, form)
      setSubmitOk(true)
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePreviewPdf = async () => {
    if (!property || pdfBusy) return
    setPdfBusy(true)
    setPdfError('')
    try {
      // Adapt the public payload to the shape buildPropertyPdfDoc expects
      const adapted = {
        ...property,
        transaction: { transaction_code: data.transaction_code, status: data.status },
        verified_at: data.verified_at,
      }
      const { doc, filename } = await buildPropertyPdfDoc(adapted)
      setPreviewDoc(doc)
      setPreviewFilename(filename)
    } catch (err) {
      setPdfError(err?.message || 'Failed to generate PDF.')
    } finally {
      setPdfBusy(false)
    }
  }

  // ── States ─────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', px: 2 }}>
        <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
          <Box sx={{ width: 72, height: 72, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: `${GOLD}1A`, color: GOLD_DARK, display: 'grid', placeItems: 'center' }}>
            <LandscapeOutlinedIcon sx={{ fontSize: 36 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Property not available</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            {error || 'This property link may have expired or is no longer public.'}
          </Typography>
          <Button component={RouterLink} to="/" variant="contained" color="primary">
            Back to FilipinoTracks
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── App bar ── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${NAVY_LINE} 0%, ${NAVY} 60%, ${NAVY_DEEP} 100%)`,
        color: '#fff',
        borderBottom: `2px solid ${GOLD}`,
      }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: 1.5, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: NAVY, fontWeight: 800 }}>
              FT
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.1 }}>FilipinoTracks</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: GOLD_LIGHT, letterSpacing: '0.14em', fontWeight: 600 }}>
                SHARED PROPERTY PAGE
              </Typography>
            </Box>
            <MuiLink component={RouterLink} to="/" underline="none"
              sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'rgba(255,255,255,0.78)', fontSize: '0.85rem', fontWeight: 600, '&:hover': { color: GOLD_LIGHT } }}
            >
              <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} /> Home
            </MuiLink>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
        {/* ── Hero ── */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <VerifiedRoundedIcon sx={{ color: GOLD, fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.18em' }}>
            VERIFIED ON FILIPINOTRACKS
          </Typography>
        </Stack>

        <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.15, fontSize: { xs: '1.7rem', md: '2.6rem' }, letterSpacing: '-0.015em', mb: 1.5 }}>
          {property.registered_owner || 'Property record'}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3, color: 'text.secondary' }}>
          <LocationCityOutlinedIcon sx={{ fontSize: 18, color: GOLD_DARK }} />
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
            {[property.city_municipality, property.province].filter(Boolean).join(', ') || 'Philippines'}
          </Typography>
          <Chip
            label={String(data.status).toUpperCase()}
            size="small"
            sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.65rem', height: 22 }}
          />
          {data.views > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'text.secondary' }}>
              <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {data.views.toLocaleString()} {data.views === 1 ? 'view' : 'views'}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* ── Quick stats row ── */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
          {property.land_area && (
            <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: `${NAVY}14`, color: NAVY, display: 'grid', placeItems: 'center' }}>
                <StraightenOutlinedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.62rem', color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.08em' }}>OFFICIAL LAND AREA</Typography>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem' }}>
                  {parseFloat(property.land_area).toLocaleString()} sqm
                </Typography>
              </Box>
            </Box>
          )}
          {area > 0 && (
            <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: `${GOLD}1F`, color: GOLD_DARK, display: 'grid', placeItems: 'center' }}>
                <LandscapeOutlinedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.62rem', color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.08em' }}>MAPPED AREA (APPROX.)</Typography>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem' }}>
                  {formatArea(area)}
                </Typography>
              </Box>
            </Box>
          )}
          {perimeter > 0 && (
            <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: `${GOLD}1F`, color: GOLD_DARK, display: 'grid', placeItems: 'center' }}>
                <StraightenOutlinedIcon sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.62rem', color: TEXT_MUTED, fontWeight: 700, letterSpacing: '0.08em' }}>PERIMETER</Typography>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem' }}>
                  {formatDistance(perimeter)}
                </Typography>
              </Box>
            </Box>
          )}
        </Stack>

        {/* ── Photo Gallery ── */}
        {data.photos?.length > 0 && (
          <PublicPropertyGallery photos={data.photos} ownerName={property.registered_owner} />
        )}

        {/* ── Map ── */}
        <Box sx={{
          width: '100%', height: { xs: 320, md: 480 },
          borderRadius: 3, overflow: 'hidden',
          border: 1, borderColor: 'divider',
          mb: 4, bgcolor: '#0B1424',
          position: 'relative',
        }}>
          {!isLoaded || points.length < 3 ? (
            <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
              <CircularProgress sx={{ color: GOLD }} />
            </Box>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={center}
              zoom={18}
              mapTypeId="satellite"
              onLoad={(inst) => { mapRef.current = inst }}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: true,
                gestureHandling: 'cooperative',
              }}
            >
              <Polygon
                paths={points}
                options={{ fillColor: GOLD, fillOpacity: 0.28, strokeColor: GOLD, strokeOpacity: 1, strokeWeight: 3 }}
              />
              <PolygonMeasurements paths={points} />
            </GoogleMap>
          )}
        </Box>

        {/* ── Two columns: details / inquire ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, gap: { xs: 3, md: 4 } }}>
          {/* Details column */}
          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em', mb: 1.5 }}>
              PROPERTY DETAILS
            </Typography>
            <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
              <DetailRow label="Title Number"    value={property.title_number}                                                       mono />
              <DetailRow label="Lot / Block"     value={[property.lot_number, property.block_number].filter(Boolean).join(' / ')}    />
              <DetailRow label="Survey Plan"     value={property.survey_plan_number}                                                  mono />
              <DetailRow label="Property Type"   value={property.property_type}                                                       />
              <DetailRow label="Province"        value={property.province}                                                            />
              <DetailRow label="City / Mun."     value={property.city_municipality}                                                  />
              <DetailRow label="Reference Code"  value={data.transaction_code}                                                        mono />
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                disabled={pdfBusy}
                startIcon={pdfBusy
                  ? <CircularProgress size={16} sx={{ color: GOLD_DARK }} />
                  : <PictureAsPdfOutlinedIcon sx={{ fontSize: 18 }} />}
                onClick={handlePreviewPdf}
                sx={{
                  fontWeight: 700, px: 2.5, py: 1,
                  borderColor: `${GOLD}66`, color: GOLD_DARK,
                  '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}14` },
                }}
              >
                {pdfBusy ? 'Generating…' : 'Download PDF Report'}
              </Button>
            </Stack>
          </Box>

          {/* Inquiry form */}
          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em', mb: 1.5 }}>
              INTERESTED IN THIS PROPERTY?
            </Typography>
            <Box sx={{
              p: { xs: 2, md: 2.5 }, borderRadius: 2,
              bgcolor: 'background.paper',
              border: 1, borderColor: 'divider',
              boxShadow: '0 8px 24px rgba(10,22,40,0.06)',
            }}>
              {submitOk ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: '#16A34A22', color: '#16A34A', display: 'grid', placeItems: 'center' }}>
                    <SendRoundedIcon sx={{ fontSize: 30 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 1 }}>Inquiry sent!</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                    Our team will reach out to you shortly. Thank you.
                  </Typography>
                  <Button
                    sx={{ mt: 2, color: GOLD_DARK, fontWeight: 700 }}
                    onClick={() => setSubmitOk(false)}
                  >
                    Send another inquiry
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleInquire}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', mb: 2 }}>
                    Send a quick message and the team handling this property will get back to you.
                  </Typography>
                  {submitError && (
                    <Alert severity="error" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
                      {submitError}
                    </Alert>
                  )}
                  <Stack spacing={1.75}>
                    <TextField
                      label="Your name" required fullWidth size="small"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.75}>
                      <TextField
                        label="Email" type="email" fullWidth size="small"
                        value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                      <TextField
                        label="Phone" fullWidth size="small"
                        value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </Stack>
                    <TextField
                      label="Message" required fullWidth multiline rows={3} size="small"
                      value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Hi! I'm interested in this property…"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      disabled={submitting}
                      startIcon={submitting
                        ? <CircularProgress size={16} sx={{ color: NAVY }} />
                        : <SendRoundedIcon />}
                      sx={{
                        py: 1.2, fontWeight: 800,
                        background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                        color: NAVY,
                        '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
                      }}
                    >
                      {submitting ? 'Sending…' : 'Send Inquiry'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1.5, textAlign: 'center' }}>
              Your message goes directly to the FilipinoTracks team. We will not share your contact details publicly.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 5 }} />

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.disabled', mb: 1 }}>
          Mapped area and side lengths are computed from the plotted boundary points. Approximate — not for legal or surveyor-grade use.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.disabled' }}>
          © {new Date().getFullYear()} FilipinoTracks · Philippine Property Documentation & Land Transaction Platform
        </Typography>
      </Container>

      <PdfPreviewDialog
        open={!!previewDoc}
        onClose={() => { setPreviewDoc(null); setPreviewFilename('') }}
        doc={previewDoc}
        filename={previewFilename}
        title={property?.registered_owner}
      />

      <Snackbar
        open={!!pdfError}
        autoHideDuration={5000}
        onClose={() => setPdfError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setPdfError('')}>
          {pdfError}
        </Alert>
      </Snackbar>
    </Box>
  )
}
