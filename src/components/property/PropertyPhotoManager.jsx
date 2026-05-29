import { useEffect, useState, useRef } from 'react'
import {
  Dialog, DialogActions, Box, Typography, IconButton, Button, Stack,
  Alert, CircularProgress, Tooltip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded'
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import api from '../../api/axios'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK } from '../../theme/theme'

const MAX_PHOTOS = 8
const MAX_FILE_MB = 8

/**
 * Admin/staff dialog for managing property photos.
 *
 * Props:
 *  - open
 *  - onClose()
 *  - propertyMap   — the PropertyMap object (must have .id)
 *  - onChanged(photos)   — fired after upload / delete / reorder so the
 *                          parent can refresh its in-memory copy
 */
export default function PropertyPhotoManager({ open, onClose, propertyMap, onChanged }) {
  const [photos, setPhotos]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState('')
  const [busyId, setBusyId]     = useState(null)
  const fileInput = useRef(null)

  // Reset + fetch when opening
  useEffect(() => {
    if (!open || !propertyMap?.id) return
    setError('')
    setLoading(true)
    api.get(`/property-maps/${propertyMap.id}/photos`)
      .then(({ data }) => setPhotos(data))
      .catch(() => setError('Failed to load photos.'))
      .finally(() => setLoading(false))
  }, [open, propertyMap?.id])

  const notifyParent = (next) => {
    onChanged?.(next)
  }

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return
    const files = Array.from(fileList)

    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos per property. Remove some first.`)
      return
    }
    const tooBig = files.find(f => f.size > MAX_FILE_MB * 1024 * 1024)
    if (tooBig) {
      setError(`"${tooBig.name}" exceeds ${MAX_FILE_MB} MB.`)
      return
    }
    const wrongType = files.find(f => !/^image\/(jpeg|png|webp)$/.test(f.type))
    if (wrongType) {
      setError(`"${wrongType.name}" is not a supported image (JPG, PNG, or WebP).`)
      return
    }

    setError('')
    setUploading(true)
    const form = new FormData()
    files.forEach(f => form.append('photos[]', f))

    try {
      const { data } = await api.post(`/property-maps/${propertyMap.id}/photos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const next = [...photos, ...data]
      setPhotos(next)
      notifyParent(next)
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleDelete = async (photo) => {
    if (!window.confirm('Remove this photo? This cannot be undone.')) return
    setBusyId(photo.id)
    try {
      await api.delete(`/property-photos/${photo.id}`)
      const next = photos.filter(p => p.id !== photo.id)
      setPhotos(next)
      notifyParent(next)
    } catch {
      setError('Failed to remove photo.')
    } finally {
      setBusyId(null)
    }
  }

  const move = async (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= photos.length) return
    const next = [...photos]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setPhotos(next)

    try {
      const { data } = await api.put(`/property-maps/${propertyMap.id}/photos/reorder`, {
        order: next.map(p => p.id),
      })
      setPhotos(data)
      notifyParent(data)
    } catch {
      setError('Failed to reorder. Refresh to see the saved order.')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={uploading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': { borderRadius: 3, overflow: 'hidden' },
      }}
      BackdropProps={{ sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }}
    >
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.75,
        display: 'flex', alignItems: 'center', gap: 1.25,
        background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`,
        borderBottom: `2px solid ${GOLD}`,
        color: '#fff',
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5,
          display: 'grid', placeItems: 'center',
          background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
          color: NAVY,
        }}>
          <PhotoLibraryRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_LIGHT, letterSpacing: '0.14em' }}>
            PROPERTY PHOTOS
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {propertyMap?.registered_owner || 'Property'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={uploading} aria-label="Close"
          sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Drop / upload zone */}
        <Box
          onDragOver={(e) => { e.preventDefault() }}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInput.current?.click()}
          sx={{
            cursor: 'pointer',
            border: `2px dashed ${GOLD}66`,
            borderRadius: 2,
            bgcolor: `${GOLD}0A`,
            p: 3,
            textAlign: 'center',
            transition: 'border-color 0.15s, background-color 0.15s',
            '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}14` },
          }}
        >
          {uploading ? (
            <Stack alignItems="center" spacing={1}>
              <CircularProgress size={28} sx={{ color: GOLD_DARK }} />
              <Typography sx={{ fontWeight: 700, color: GOLD_DARK, fontSize: '0.9rem' }}>
                Uploading…
              </Typography>
            </Stack>
          ) : (
            <>
              <AddPhotoAlternateRoundedIcon sx={{ fontSize: 36, color: GOLD_DARK, mb: 1 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'text.primary' }}>
                Drop photos here or click to browse
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.5 }}>
                JPG, PNG, or WebP · up to {MAX_FILE_MB} MB each · max {MAX_PHOTOS} per property
              </Typography>
            </>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </Box>

        {/* Gallery grid */}
        <Typography sx={{ mt: 3, mb: 1.25, fontSize: '0.7rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.12em' }}>
          {photos.length} / {MAX_PHOTOS} PHOTO{photos.length === 1 ? '' : 'S'} · FIRST IS THE COVER
        </Typography>

        {loading ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress sx={{ color: GOLD }} />
          </Box>
        ) : photos.length === 0 ? (
          <Box sx={{
            py: 4, textAlign: 'center', borderRadius: 2,
            bgcolor: 'action.hover', border: 1, borderColor: 'divider',
          }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem' }}>
              No photos yet. Upload the first one above.
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}>
            {photos.map((photo, idx) => (
              <Box key={photo.id} sx={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: 2,
                overflow: 'hidden',
                border: 1, borderColor: 'divider',
                bgcolor: '#000',
                boxShadow: '0 4px 12px rgba(10,22,40,0.10)',
              }}>
                <Box
                  component="img"
                  src={photo.url}
                  alt={photo.caption || `Photo ${idx + 1}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* Cover badge */}
                {idx === 0 && (
                  <Box sx={{
                    position: 'absolute', top: 6, left: 6,
                    bgcolor: GOLD, color: NAVY,
                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em',
                    px: 0.75, py: 0.3, borderRadius: 0.75,
                  }}>
                    COVER
                  </Box>
                )}
                {/* Hover toolbar */}
                <Box sx={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(10,22,40,0.7) 0%, rgba(10,22,40,0) 50%)',
                  opacity: 0, transition: 'opacity 0.15s',
                  '&:hover': { opacity: 1 },
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                  p: 0.75,
                }}>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Move left">
                      <span>
                        <IconButton
                          size="small"
                          disabled={idx === 0 || busyId === photo.id}
                          onClick={() => move(idx, -1)}
                          sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', width: 26, height: 26, '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                        >
                          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move right">
                      <span>
                        <IconButton
                          size="small"
                          disabled={idx === photos.length - 1 || busyId === photo.id}
                          onClick={() => move(idx, +1)}
                          sx={{ color: '#fff', bgcolor: 'rgba(0,0,0,0.4)', width: 26, height: 26, '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }, '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
                        >
                          <ArrowForwardIosRoundedIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                  <Tooltip title="Remove photo">
                    <IconButton
                      size="small"
                      disabled={busyId === photo.id}
                      onClick={() => handleDelete(photo)}
                      sx={{ color: '#fff', bgcolor: 'rgba(220,38,38,0.85)', width: 26, height: 26, '&:hover': { bgcolor: 'rgba(220,38,38,1)' } }}
                    >
                      {busyId === photo.id
                        ? <CircularProgress size={13} sx={{ color: '#fff' }} />
                        : <DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <DialogActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={uploading} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
