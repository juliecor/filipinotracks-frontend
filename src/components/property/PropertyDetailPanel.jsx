import { useState } from 'react'
import { Box, Typography, IconButton, Tooltip, Divider, Button, CircularProgress, Snackbar, Alert } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import VerifiedIcon from '@mui/icons-material/Verified'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { GOLD, GOLD_DARK, SUCCESS } from '../../theme/theme'
import {
  STATUS_META, getPolygonPoints, getCenter,
  computePolygonArea, formatArea,
} from '../../utils/propertyGeo'
import { buildPropertyPdfDoc } from '../../utils/propertyPdfReport'
import PdfPreviewDialog from './PdfPreviewDialog'

function DetailRow({ label, value, mono }) {
  if (!value && value !== 0) return null
  return (
    <Box sx={{ display: 'flex', py: 0.9, gap: 1.5, borderBottom: '1px dashed', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none' } }}>
      <Typography sx={{
        fontSize: '0.66rem', fontWeight: 700, color: 'text.disabled',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        flex: '0 0 38%',
        pt: 0.2,
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', flex: 1,
        fontFamily: mono ? 'monospace' : undefined,
        textTransform: mono ? 'none' : 'capitalize',
        wordBreak: 'break-word',
      }}>
        {value}
      </Typography>
    </Box>
  )
}

function SectionHeader({ children, icon }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, mt: 2 }}>
      {icon}
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: GOLD_DARK, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
        {children}
      </Typography>
    </Box>
  )
}

/**
 * Sliding detail panel for a property. Renders as a full-height column
 * meant to slot into the sidebar position when active.
 *
 * Props:
 *  - property: PropertyMap object
 *  - onBack: () => void               — show list again
 *  - onCenterOnMap: () => void        — re-fit map to this property
 *  - actions: ReactNode               — extra action buttons (View transaction, Delete, etc.)
 */
export default function PropertyDetailPanel({ property, onBack, onCenterOnMap, actions }) {
  const [exporting, setExporting]         = useState(false)
  const [exportError, setExportError]     = useState('')
  const [previewDoc, setPreviewDoc]       = useState(null)
  const [previewFilename, setPreviewFilename] = useState('')

  if (!property) return null
  const meta   = STATUS_META[property.transaction?.status]
  const pts    = getPolygonPoints(property)
  const hasGeo = !!getCenter(property)
  const computedAreaSqm = pts.length > 2 ? computePolygonArea(pts) : 0

  const handlePreviewPdf = async () => {
    if (exporting) return
    setExporting(true)
    setExportError('')
    try {
      const { doc, filename } = await buildPropertyPdfDoc(property)
      setPreviewDoc(doc)
      setPreviewFilename(filename)
    } catch (err) {
      setExportError(err?.message || 'Failed to generate PDF.')
    } finally {
      setExporting(false)
    }
  }

  const handleClosePreview = () => {
    setPreviewDoc(null)
    setPreviewFilename('')
  }

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      bgcolor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: { xs: 1.5, md: 2 }, py: 1.2,
        borderBottom: 1, borderColor: 'divider',
        bgcolor: 'action.hover',
      }}>
        <Tooltip title="Back to list">
          <IconButton onClick={onBack} size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>
          Property Details
        </Typography>
        {hasGeo && (
          <Tooltip title="Center on map">
            <IconButton onClick={onCenterOnMap} size="small" sx={{ bgcolor: `${GOLD}1A`, color: GOLD_DARK, '&:hover': { bgcolor: `${GOLD}30` } }}>
              <MyLocationIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Scrollable content */}
      <Box sx={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        px: { xs: 2, md: 2.5 }, py: 2,
        '&::-webkit-scrollbar': { width: 5 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 },
      }}>
        {/* Owner hero */}
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
          Registered Owner
        </Typography>
        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.15rem', lineHeight: 1.25, mb: 1.2 }}>
          {property.registered_owner || 'Unknown Owner'}
        </Typography>

        {/* Status + tags */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
          {meta && (
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              px: 1.2, py: 0.4, borderRadius: 1,
              bgcolor: `${meta.color}14`, border: `1px solid ${meta.color}33`,
            }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: meta.color, whiteSpace: 'nowrap' }}>{meta.label}</Typography>
            </Box>
          )}
          {property.latitude && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1.2, py: 0.4, borderRadius: 1, bgcolor: `${SUCCESS}14`, color: SUCCESS }}>
              <Typography sx={{ fontSize: '0.66rem', fontWeight: 800 }}>📍 Pinned</Typography>
            </Box>
          )}
          {pts.length > 2 && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 1.2, py: 0.4, borderRadius: 1, bgcolor: `${GOLD}1F`, color: GOLD_DARK }}>
              <Typography sx={{ fontSize: '0.66rem', fontWeight: 800 }}>🗺 Boundary mapped</Typography>
            </Box>
          )}
        </Box>

        {property.transaction?.transaction_code && (
          <Box sx={{ p: 1.5, mb: 2, borderRadius: 1.5, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.3 }}>
              Transaction
            </Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: 'text.primary' }}>
              {property.transaction.transaction_code}
            </Typography>
          </Box>
        )}

        {/* Property details */}
        <SectionHeader>Property Details</SectionHeader>
        <Box>
          <DetailRow label="Title Number"     value={property.title_number}                                                       mono />
          <DetailRow label="Lot / Block"      value={[property.lot_number, property.block_number].filter(Boolean).join(' / ')}    />
          <DetailRow label="Survey Plan"      value={property.survey_plan_number}                                                 mono />
          <DetailRow label="Tax Declaration"  value={property.tax_declaration_number}                                             mono />
          <DetailRow label="Property Type"    value={property.property_type}                                                      />
          <DetailRow label="Land Area"        value={property.land_area ? `${parseFloat(property.land_area).toLocaleString()} sqm` : null} />
          {computedAreaSqm > 0 && (
            <DetailRow
              label="Mapped Area"
              value={`${formatArea(computedAreaSqm)} (approx.)`}
            />
          )}
        </Box>

        {/* Location */}
        <SectionHeader icon={<LocationOnIcon sx={{ fontSize: 14, color: GOLD }} />}>Location</SectionHeader>
        <Box>
          <DetailRow label="Province"            value={property.province}            />
          <DetailRow label="City / Municipality" value={property.city_municipality}  />
          <DetailRow label="Barangay"            value={property.barangay}            />
          <DetailRow label="Full Address"        value={property.full_address}        />
          {property.latitude && property.longitude && (
            <DetailRow
              label="GPS Coordinates"
              value={`${parseFloat(property.latitude).toFixed(6)}, ${parseFloat(property.longitude).toFixed(6)}`}
              mono
            />
          )}
        </Box>

        {/* Verified info */}
        {property.verified_at && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: `${SUCCESS}14`, border: `1px solid ${SUCCESS}33`, borderRadius: 2 }}>
              <VerifiedIcon sx={{ color: SUCCESS, fontSize: 22 }} />
              <Box>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.82rem' }}>
                  Verified on {new Date(property.verified_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Typography>
                {(property.verifiedBy?.name || property.verified_by_name) && (
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                    By {property.verifiedBy?.name || property.verified_by_name}
                  </Typography>
                )}
              </Box>
            </Box>
          </>
        )}

        {property.staff_notes && (
          <>
            <SectionHeader>Staff Notes</SectionHeader>
            <Box sx={{ p: 1.5, bgcolor: 'warning.light', border: 1, borderColor: 'warning.main', borderRadius: 1.5 }}>
              <Typography sx={{ fontSize: '0.82rem', color: 'warning.dark', lineHeight: 1.6 }}>
                {property.staff_notes}
              </Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Action buttons */}
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {hasGeo && (
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            startIcon={<MyLocationIcon sx={{ fontSize: 18 }} />}
            onClick={onCenterOnMap}
            sx={{ fontWeight: 800, py: 1.1 }}
          >
            Center on Map
          </Button>
        )}
        <Button
          variant="outlined"
          fullWidth
          disabled={exporting}
          startIcon={exporting
            ? <CircularProgress size={16} sx={{ color: GOLD_DARK }} />
            : <PictureAsPdfOutlinedIcon sx={{ fontSize: 18 }} />}
          onClick={handlePreviewPdf}
          sx={{
            fontWeight: 700, py: 1,
            borderColor: `${GOLD}66`, color: GOLD_DARK,
            '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}14` },
          }}
        >
          {exporting ? 'Generating preview…' : 'Preview PDF Report'}
        </Button>
        {actions}
      </Box>

      <PdfPreviewDialog
        open={!!previewDoc}
        onClose={handleClosePreview}
        doc={previewDoc}
        filename={previewFilename}
        title={property.registered_owner}
      />

      <Snackbar
        open={!!exportError}
        autoHideDuration={5000}
        onClose={() => setExportError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setExportError('')}>
          {exportError}
        </Alert>
      </Snackbar>
    </Box>
  )
}
