import { useEffect, useRef, useState } from 'react'
import {
  Button, Menu, MenuItem, ListItemIcon, ListItemText, CircularProgress,
  Box, Typography, Dialog, IconButton, Tabs, Tab, Tooltip, Chip,
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import ArchitectureIcon from '@mui/icons-material/Architecture'
import DownloadIcon from '@mui/icons-material/Download'
import CloseIcon from '@mui/icons-material/Close'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { motion, AnimatePresence } from 'framer-motion'
import { GOLD, GOLD_DARK, NAVY } from '../theme/theme'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'
import { generateLandTitleMapPdf, generateTechnicalPlotPdf } from '../utils/surveyPdf'

/**
 * "Generate Survey PDF" button → opens a Preview Dialog that lets the user
 * inspect the PDF in-browser BEFORE downloading. The dialog supports tabs
 * so the user can flip between the satellite Land Title Map and the
 * AutoCAD-style Technical Plot.
 */
export default function SurveyPdfButton({
  transactionId,
  propertyMap = null,
  transaction = null,
  size = 'small',
  variant = 'contained',
  fullWidth = false,
  label = 'Generate Survey PDF',
}) {
  const toast = useToast()
  const [anchor, setAnchor] = useState(null)
  const [busy, setBusy]     = useState(null)         // 'satellite' | 'plot' | 'both' | null
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previews, setPreviews]   = useState([])     // [{ kind, label, blob, url, pdf, filename }]
  const [activeTab, setActiveTab] = useState(0)

  // Revoke blob URLs when the dialog closes / new previews replace old
  const previewsRef = useRef(previews)
  useEffect(() => { previewsRef.current = previews }, [previews])
  useEffect(() => () => {
    previewsRef.current.forEach(p => { try { URL.revokeObjectURL(p.url) } catch {} })
  }, [])

  const loadFullProperty = async () => {
    if (propertyMap && propertyMap.boundaries) return { map: propertyMap, tx: transaction }
    const { data } = await api.get(`/transactions/${transactionId}/property-map`)
    return { map: data, tx: transaction }
  }

  const buildFilename = (map, tx, suffix) => {
    const code = map.title_number || tx?.transaction_code || `lot-${map.id}`
    const safe = String(code).replace(/[^A-Za-z0-9._-]+/g, '-')
    return `${suffix}-${safe}.pdf`
  }

  const openPreviews = async (kind) => {
    setAnchor(null)
    setBusy(kind)
    // Revoke previous previews
    previewsRef.current.forEach(p => { try { URL.revokeObjectURL(p.url) } catch {} })
    try {
      const { map, tx } = await loadFullProperty()
      const items = []
      if (kind === 'satellite' || kind === 'both') {
        const pdf  = await generateLandTitleMapPdf(map, tx)
        const blob = pdf.output('blob')
        items.push({
          kind: 'satellite',
          label: 'Land Title Map',
          icon: <SatelliteAltIcon sx={{ fontSize: 16 }} />,
          blob,
          url: URL.createObjectURL(blob),
          pdf,
          filename: buildFilename(map, tx, 'Land-Title-Map'),
        })
      }
      if (kind === 'plot' || kind === 'both') {
        const pdf  = generateTechnicalPlotPdf(map, tx)
        const blob = pdf.output('blob')
        items.push({
          kind: 'plot',
          label: 'Technical Plot',
          icon: <ArchitectureIcon sx={{ fontSize: 16 }} />,
          blob,
          url: URL.createObjectURL(blob),
          pdf,
          filename: buildFilename(map, tx, 'Technical-Plot'),
        })
      }
      setPreviews(items)
      setActiveTab(0)
      setPreviewOpen(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate the survey PDF(s). Check the Google Maps key + network and try again.')
    } finally {
      setBusy(null)
    }
  }

  const handleDownloadActive = () => {
    const item = previews[activeTab]
    if (!item) return
    item.pdf.save(item.filename)
    toast.success(`${item.label} downloaded.`)
  }

  const handleDownloadAll = () => {
    previews.forEach((p, i) => {
      // Tiny stagger so browsers don't suppress the multi-download
      setTimeout(() => p.pdf.save(p.filename), i * 400)
    })
    toast.success(`${previews.length} PDF${previews.length === 1 ? '' : 's'} downloaded.`)
  }

  const handleClose = () => {
    setPreviewOpen(false)
    // Revoke after a beat so the iframe doesn't error on unmount
    setTimeout(() => {
      previews.forEach(p => { try { URL.revokeObjectURL(p.url) } catch {} })
      setPreviews([])
    }, 400)
  }

  const active = previews[activeTab]

  return (
    <>
      <Button
        size={size}
        variant={variant}
        color="secondary"
        fullWidth={fullWidth}
        onClick={(e) => setAnchor(e.currentTarget)}
        disabled={!!busy}
        startIcon={
          busy
            ? <CircularProgress size={14} sx={{ color: NAVY }} />
            : <PictureAsPdfIcon sx={{ fontSize: 16 }} />
        }
        sx={{ fontWeight: 800 }}
      >
        {busy ? 'Generating preview…' : label}
      </Button>

      {/* ── Picker menu ── */}
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top',    horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        PaperProps={{ sx: { mt: -1, minWidth: 280, borderRadius: 2, boxShadow: 6, border: 1, borderColor: 'divider' } }}
      >
        <Box sx={{ px: 2, py: 1.2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em' }}>
            SURVEYOR-STYLE PDFs
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 0.2 }}>
            Preview before downloading.
          </Typography>
        </Box>

        <MenuItem onClick={() => openPreviews('satellite')}>
          <ListItemIcon><SatelliteAltIcon sx={{ color: GOLD }} /></ListItemIcon>
          <ListItemText
            primary={<span style={{ fontWeight: 700 }}>Land Title Map</span>}
            secondary="Satellite · branded title block"
          />
        </MenuItem>

        <MenuItem onClick={() => openPreviews('plot')}>
          <ListItemIcon><ArchitectureIcon sx={{ color: NAVY }} /></ListItemIcon>
          <ListItemText
            primary={<span style={{ fontWeight: 700 }}>Technical Plot</span>}
            secondary="AutoCAD-style · bearings + distances"
          />
        </MenuItem>

        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <MenuItem onClick={() => openPreviews('both')} sx={{ bgcolor: `${GOLD}10` }}>
            <ListItemIcon><PictureAsPdfIcon sx={{ color: GOLD_DARK }} /></ListItemIcon>
            <ListItemText
              primary={<span style={{ fontWeight: 800, color: GOLD_DARK }}>Preview Both</span>}
              secondary="Full surveyor package"
            />
          </MenuItem>
        </Box>
      </Menu>

      {/* ── Preview dialog ── */}
      <Dialog
        fullScreen
        open={previewOpen}
        onClose={handleClose}
        PaperProps={{ sx: { bgcolor: 'background.default' } }}
      >
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{
            px: 2.5, py: 1.4,
            background: `linear-gradient(135deg, ${NAVY} 0%, #060E1A 100%)`,
            color: 'white',
            borderBottom: `2px solid ${GOLD}`,
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 1.2,
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Typography sx={{ color: NAVY, fontWeight: 900, fontSize: '0.78rem' }}>FT</Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: GOLD, letterSpacing: '0.18em' }}>
                FILIPINOTRACKS · SURVEY PREVIEW
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.2, color: 'white' }}>
                {active?.label || 'Survey PDF'}
              </Typography>
            </Box>

            <Chip
              icon={<DownloadIcon sx={{ fontSize: 14, color: 'white !important' }} />}
              label="Ready to download"
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 700, fontSize: '0.68rem' }}
            />

            <Tooltip title="Close preview">
              <IconButton onClick={handleClose} sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Tabs (only if both PDFs) */}
          {previews.length > 1 && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                textColor="inherit"
                TabIndicatorProps={{ sx: { bgcolor: GOLD, height: 3 } }}
              >
                {previews.map((p, i) => (
                  <Tab
                    key={p.kind}
                    icon={p.icon}
                    iconPosition="start"
                    label={p.label}
                    sx={{
                      fontWeight: 800, fontSize: '0.78rem',
                      color: activeTab === i ? NAVY : 'text.secondary',
                      minHeight: 48,
                    }}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Preview pane */}
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', bgcolor: '#1F2937' }}>
            <AnimatePresence mode="wait">
              {active && (
                <motion.div
                  key={active.kind}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{ width: '100%', height: '100%' }}
                >
                  <iframe
                    title={active.label}
                    src={active.url}
                    style={{
                      width: '100%', height: '100%',
                      border: 'none',
                      background: '#1F2937',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* Action bar */}
          <Box sx={{
            px: 2.5, py: 1.5,
            borderTop: 1, borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5,
            flexWrap: 'wrap',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>
                {previews.length === 1
                  ? <>📄 <strong style={{ color: 'inherit' }}>{active?.filename}</strong></>
                  : <>📄 <strong style={{ color: 'inherit' }}>{previews.length} PDFs ready</strong> — preview, then download one or both.</>}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="medium"
                onClick={handleClose}
                sx={{ fontWeight: 700, color: 'text.primary', borderColor: 'divider' }}
              >
                Cancel
              </Button>
              {active?.url && (
                <Tooltip title="Open this PDF in a new browser tab">
                  <Button
                    variant="outlined"
                    size="medium"
                    color="primary"
                    startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                    onClick={() => window.open(active.url, '_blank', 'noopener')}
                    sx={{ fontWeight: 700 }}
                  >
                    Open in tab
                  </Button>
                </Tooltip>
              )}
              {previews.length > 1 && (
                <Button
                  variant="outlined"
                  size="medium"
                  color="secondary"
                  startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                  onClick={handleDownloadAll}
                  sx={{ fontWeight: 700 }}
                >
                  Download both
                </Button>
              )}
              <Button
                variant="contained"
                size="medium"
                color="secondary"
                startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                onClick={handleDownloadActive}
                sx={{ fontWeight: 800 }}
              >
                Download
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>
    </>
  )
}
