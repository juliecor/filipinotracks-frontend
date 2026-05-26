import { useState, useEffect, useCallback } from 'react'
import {
  Box, Dialog, IconButton, Typography, Tooltip, Button, CircularProgress, Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ImageIcon from '@mui/icons-material/Image'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { GOLD, NAVY } from '../theme/theme'

function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function getKind(doc) {
  const t = (doc?.file_type || '').toLowerCase()
  if (t.includes('pdf')) return 'pdf'
  if (t.startsWith('image/')) return 'image'
  return 'other'
}

function KindIcon({ kind, sx }) {
  if (kind === 'pdf')   return <PictureAsPdfIcon sx={{ color: '#DC2626', ...sx }} />
  if (kind === 'image') return <ImageIcon sx={{ color: '#2563EB', ...sx }} />
  return <InsertDriveFileIcon sx={{ color: '#64748B', ...sx }} />
}

/**
 * Inline document preview dialog.
 *
 * Supports:
 *  - PDFs (browser-native iframe)
 *  - Images (zoom-to-fit)
 *  - Other types (graceful "preview unavailable" fallback)
 *
 * Props:
 *  - documents: full list of documents (so we can navigate prev/next)
 *  - activeIndex: index of the document to show; null = closed
 *  - onClose(): closes the dialog
 *  - onChangeIndex(nextIndex): change which doc is shown
 */
export default function DocumentPreview({ documents = [], activeIndex, onClose, onChangeIndex }) {
  const open = activeIndex !== null && activeIndex !== undefined && documents[activeIndex]
  const doc  = open ? documents[activeIndex] : null
  const kind = doc ? getKind(doc) : null

  const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true) }, [activeIndex])

  const goPrev = useCallback(() => {
    if (activeIndex > 0) onChangeIndex(activeIndex - 1)
  }, [activeIndex, onChangeIndex])

  const goNext = useCallback(() => {
    if (activeIndex < documents.length - 1) onChangeIndex(activeIndex + 1)
  }, [activeIndex, documents.length, onChangeIndex])

  // Keyboard shortcuts: ← prev, → next, Esc handled by Dialog
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, goPrev, goNext])

  if (!open) return null

  return (
    <Dialog
      fullScreen
      open={!!open}
      onClose={onClose}
      PaperProps={{ sx: { bgcolor: '#0B1424', m: 0 } }}
    >
      {/* Top bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: { xs: 1.5, md: 2.5 }, py: 1.2,
        bgcolor: NAVY, color: 'white',
        borderBottom: `2px solid ${GOLD}`,
      }}>
        <Tooltip title="Close (Esc)">
          <IconButton onClick={onClose} aria-label="Close preview"
            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon />
          </IconButton>
        </Tooltip>

        <KindIcon kind={kind} sx={{ fontSize: 22, flexShrink: 0 }} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doc.original_name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
            <Chip
              size="small"
              label={kind.toUpperCase()}
              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: `${GOLD}22`, color: GOLD, letterSpacing: '0.1em' }}
            />
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>
              {fmtSize(doc.file_size)}
            </Typography>
            {documents.length > 1 && (
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                · {activeIndex + 1} of {documents.length}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Open in new tab">
            <IconButton component="a" href={doc.url} target="_blank" rel="noreferrer"
              aria-label="Open in new tab"
              sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <OpenInNewIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton component="a" href={doc.url} download={doc.original_name}
              aria-label="Download"
              sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              <DownloadIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Prev / next overlays */}
        {documents.length > 1 && (
          <>
            <Tooltip title="Previous (←)">
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                <IconButton
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  aria-label="Previous document"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    width: 44, height: 44,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                    '&.Mui-disabled': { opacity: 0.3, color: 'white' },
                  }}>
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Next (→)">
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 5 }}>
                <IconButton
                  onClick={goNext}
                  disabled={activeIndex === documents.length - 1}
                  aria-label="Next document"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(8px)',
                    color: 'white',
                    width: 44, height: 44,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                    '&.Mui-disabled': { opacity: 0.3, color: 'white' },
                  }}>
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}

        {/* Loading spinner */}
        {loading && kind !== 'other' && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
            <CircularProgress sx={{ color: GOLD }} />
          </Box>
        )}

        {/* PDF — browser-native iframe viewer */}
        {kind === 'pdf' && (
          <iframe
            key={doc.id}
            src={`${doc.url}#toolbar=1&navpanes=0`}
            title={doc.original_name}
            onLoad={() => setLoading(false)}
            style={{
              width: '100%', height: '100%',
              border: 'none', background: '#525659',
              zIndex: loading ? 0 : 2,
            }}
          />
        )}

        {/* Image — zoom to fit */}
        {kind === 'image' && (
          <Box sx={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            p: 3, overflow: 'auto',
          }}>
            <img
              key={doc.id}
              src={doc.url}
              alt={doc.original_name}
              onLoad={() => setLoading(false)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: 6,
                boxShadow: '0 10px 50px rgba(0,0,0,0.5)',
                opacity: loading ? 0 : 1,
                transition: 'opacity 0.2s',
              }}
            />
          </Box>
        )}

        {/* Fallback — generic file type */}
        {kind === 'other' && (
          <Box sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', px: 3 }}>
            <Box sx={{
              width: 100, height: 100, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2.5,
            }}>
              <InsertDriveFileIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.45)' }} />
            </Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
              Preview unavailable
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, maxWidth: 360, mx: 'auto', lineHeight: 1.7 }}>
              This file type can't be previewed in the browser. Download it to view on your device.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<DownloadIcon />}
              component="a"
              href={doc.url}
              download={doc.original_name}
              sx={{ fontWeight: 700 }}
            >
              Download {doc.original_name}
            </Button>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
