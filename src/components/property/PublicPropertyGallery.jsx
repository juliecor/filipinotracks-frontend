import { useEffect, useState, useCallback } from 'react'
import { Box, IconButton, Typography, Modal, Backdrop } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded'
import { GOLD, GOLD_LIGHT } from '../../theme/theme'

/**
 * Public property photo gallery:
 *  - Hero with the cover photo (first in array)
 *  - Side strip showing up to 4 more thumbnails (responsive)
 *  - Click any → lightbox with keyboard arrows + swipe
 */
export default function PublicPropertyGallery({ photos = [], ownerName, compact = false }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const open = lightboxIdx !== null

  const next = useCallback(
    () => setLightboxIdx(i => (i + 1) % photos.length),
    [photos.length]
  )
  const prev = useCallback(
    () => setLightboxIdx(i => (i - 1 + photos.length) % photos.length),
    [photos.length]
  )
  const close = () => setLightboxIdx(null)

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, next, prev])

  if (!photos.length) return null

  const cover = photos[0]
  const rest  = photos.slice(1, 5) // up to 4 thumbnails on the side
  const extra = Math.max(0, photos.length - 5)

  return (
    <>
      <Box sx={{ mb: compact ? 2 : 4 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : { xs: '1fr', md: '2fr 1fr' },
          gridTemplateRows:    compact ? 'auto' : { xs: 'auto', md: '480px' },
          gap: 1.5,
          borderRadius: compact ? 2 : 3, overflow: 'hidden',
        }}>
          {/* Cover */}
          <Box
            onClick={() => setLightboxIdx(0)}
            sx={{
              cursor: 'zoom-in',
              height: compact ? 180 : { xs: 280, sm: 360, md: '100%' },
              borderRadius: compact ? 2 : 3,
              overflow: 'hidden',
              position: 'relative',
              bgcolor: '#000',
              '&:hover img': { transform: 'scale(1.03)' },
            }}
          >
            <Box
              component="img"
              src={cover.url}
              alt={cover.caption || ownerName || 'Property photo'}
              loading="eager"
              sx={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block', transition: 'transform 0.5s ease',
              }}
            />
            <Box sx={{
              position: 'absolute', left: 10, bottom: 10,
              display: 'inline-flex', alignItems: 'center', gap: 0.6,
              px: 1, py: 0.4, borderRadius: 1.25,
              bgcolor: 'rgba(10,22,40,0.78)',
              color: '#fff', backdropFilter: 'blur(6px)',
            }}>
              <PhotoLibraryRoundedIcon sx={{ fontSize: 13, color: GOLD_LIGHT }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700 }}>
                {photos.length} photo{photos.length === 1 ? '' : 's'}
              </Typography>
            </Box>
          </Box>

          {/* Desktop 2×2 thumbnail strip — large-mode only */}
          {!compact && rest.length > 0 && (
            <Box sx={{
              display: { xs: 'none', md: 'grid' },
              gridTemplateColumns: '1fr 1fr',
              gridTemplateRows: '1fr 1fr',
              gap: 1.5,
              height: '100%',
            }}>
              {rest.map((photo, idx) => {
                const realIdx = idx + 1
                const isLast = idx === rest.length - 1 && extra > 0
                return (
                  <Box
                    key={photo.id}
                    onClick={() => setLightboxIdx(realIdx)}
                    sx={{
                      cursor: 'zoom-in',
                      position: 'relative',
                      borderRadius: 2, overflow: 'hidden',
                      bgcolor: '#000',
                      '&:hover img': { transform: 'scale(1.05)' },
                    }}
                  >
                    <Box
                      component="img"
                      src={photo.url}
                      alt={photo.caption || `Photo ${realIdx + 1}`}
                      loading="lazy"
                      sx={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        display: 'block', transition: 'transform 0.4s ease',
                      }}
                    />
                    {isLast && (
                      <Box sx={{
                        position: 'absolute', inset: 0,
                        bgcolor: 'rgba(10,22,40,0.55)',
                        display: 'grid', placeItems: 'center',
                        color: '#fff',
                      }}>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800 }}>
                          +{extra} more
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>

        {/* Horizontal thumbnail strip — always on in compact mode, mobile-only otherwise */}
        {photos.length > 1 && (
          <Box sx={{
            mt: 1.25,
            display: compact ? 'flex' : { xs: 'flex', md: 'none' },
            gap: 0.75, overflowX: 'auto',
            pb: 0.5,
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 6 },
          }}>
            {photos.slice(1).map((photo, idx) => (
              <Box
                key={photo.id}
                onClick={() => setLightboxIdx(idx + 1)}
                sx={{
                  flexShrink: 0,
                  width:  compact ? 64 : 96,
                  height: compact ? 64 : 96,
                  borderRadius: 1.25, overflow: 'hidden',
                  bgcolor: '#000', cursor: 'zoom-in',
                  '&:hover img': { transform: 'scale(1.05)' },
                }}
              >
                <Box component="img" src={photo.url} alt={`Photo ${idx + 2}`} loading="lazy"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Lightbox */}
      <Modal
        open={open}
        onClose={close}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { sx: { bgcolor: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)' } } }}
      >
        <Box
          onClick={close}
          sx={{
            position: 'fixed', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            outline: 'none',
            p: { xs: 1, md: 4 },
          }}
        >
          {/* Close button */}
          <IconButton
            onClick={close}
            sx={{ position: 'fixed', top: 12, right: 12, color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' } }}
          >
            <CloseRoundedIcon />
          </IconButton>

          {/* Counter */}
          {photos.length > 1 && (
            <Box sx={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
              color: '#fff', fontSize: '0.8rem', fontWeight: 600,
              bgcolor: 'rgba(255,255,255,0.08)', px: 1.5, py: 0.5, borderRadius: 1.5,
            }}>
              {lightboxIdx + 1} / {photos.length}
            </Box>
          )}

          {/* Prev */}
          {photos.length > 1 && (
            <IconButton
              onClick={(e) => { e.stopPropagation(); prev() }}
              sx={{
                position: 'fixed', left: { xs: 4, md: 24 }, top: '50%', transform: 'translateY(-50%)',
                color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                width: { xs: 40, md: 52 }, height: { xs: 40, md: 52 },
              }}
            >
              <ArrowBackIosNewRoundedIcon />
            </IconButton>
          )}

          {/* Image */}
          <AnimatePresence mode="wait" initial={false}>
            {open && (
              <motion.img
                key={photos[lightboxIdx].id}
                src={photos[lightboxIdx].url}
                alt={photos[lightboxIdx].caption || `Photo ${lightboxIdx + 1}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: '92vw',
                  maxHeight: '88vh',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: 8,
                  boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                }}
              />
            )}
          </AnimatePresence>

          {/* Next */}
          {photos.length > 1 && (
            <IconButton
              onClick={(e) => { e.stopPropagation(); next() }}
              sx={{
                position: 'fixed', right: { xs: 4, md: 24 }, top: '50%', transform: 'translateY(-50%)',
                color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                width: { xs: 40, md: 52 }, height: { xs: 40, md: 52 },
              }}
            >
              <ArrowForwardIosRoundedIcon />
            </IconButton>
          )}

          {/* Caption */}
          {photos[lightboxIdx]?.caption && (
            <Box sx={{
              position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
              maxWidth: '85vw',
              px: 2, py: 1, borderRadius: 1.5,
              bgcolor: 'rgba(10,22,40,0.85)', color: '#fff',
              fontSize: '0.85rem', textAlign: 'center',
            }}>
              {photos[lightboxIdx].caption}
            </Box>
          )}
        </Box>
      </Modal>
    </>
  )
}
