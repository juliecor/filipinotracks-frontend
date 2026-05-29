import { useEffect, useMemo } from 'react'
import {
  Dialog, DialogActions, Box, Typography, IconButton, Button, Stack,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK } from '../../theme/theme'

/**
 * Full-screen preview of a generated jsPDF document.
 *
 * Props:
 *  - open: boolean
 *  - onClose(): close dialog
 *  - doc: jsPDF instance (or null when closed)
 *  - filename: suggested filename for the Download button
 *  - title: small label shown above filename (e.g. "Anthony Leuterio")
 */
export default function PdfPreviewDialog({ open, onClose, doc, filename, title }) {
  // Generate a blob URL once per `doc` and revoke it when the dialog is
  // unmounted or the doc changes — otherwise we leak the underlying Blob.
  const blobUrl = useMemo(() => (doc ? doc.output('bloburl') : null), [doc])
  useEffect(() => () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }, [blobUrl])

  const handleDownload = () => {
    if (doc && filename) doc.save(filename)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          overflow: 'hidden',
          m: { xs: 1, sm: 2 },
          width: 'calc(100% - 16px)',
          maxWidth: '1100px',
          maxHeight: 'calc(100% - 16px)',
        },
      }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5, py: 1.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
          background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`,
          borderBottom: `2px solid ${GOLD}`,
          color: '#fff',
        }}
      >
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 1.5,
            display: 'grid', placeItems: 'center',
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
            color: NAVY, flexShrink: 0,
          }}
        >
          <PictureAsPdfOutlinedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_LIGHT, letterSpacing: '0.14em' }}>
            PDF REPORT PREVIEW
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title || filename || 'Property Report'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close preview"
          sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* PDF viewer */}
      <Box sx={{ bgcolor: '#525659', height: '78vh', display: 'flex' }}>
        {blobUrl ? (
          <iframe
            key={blobUrl}
            src={blobUrl}
            title="Property report preview"
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
        ) : (
          <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <Typography>Preparing preview…</Typography>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <DialogActions
        sx={{
          px: 2.5, py: 1.5, gap: 1,
          borderTop: 1, borderColor: 'divider',
          bgcolor: 'background.paper',
          flexDirection: { xs: 'column-reverse', sm: 'row' },
        }}
      >
        <Stack direction="row" sx={{ flex: 1, color: 'text.secondary', fontSize: '0.78rem' }} alignItems="center" spacing={0.8}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {filename}
          </Typography>
        </Stack>
        <Button
          onClick={onClose}
          sx={{ color: 'text.secondary', fontWeight: 600 }}
        >
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<DownloadRoundedIcon />}
          onClick={handleDownload}
          disabled={!doc}
          sx={{
            fontWeight: 800,
            px: 3, py: 1,
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
            color: NAVY,
            boxShadow: `0 6px 16px ${GOLD}44`,
            '&:hover': {
              background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
              boxShadow: `0 8px 20px ${GOLD}55`,
            },
          }}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  )
}
