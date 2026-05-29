import { useEffect, useState } from 'react'
import {
  Dialog, DialogActions, Box, Typography, IconButton, Button, Stack,
  TextField, InputAdornment, Tooltip, Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import ShareRoundedIcon from '@mui/icons-material/ShareRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK } from '../../theme/theme'

const SHAREABLE_STATUSES = ['approved', 'released']

/**
 * Generates a QR code SVG via a free public API. We render an <img> rather
 * than pulling in a QR library — keeps the bundle small and works offline-
 * only when the user has internet, which is fine since they're about to share
 * the link over the internet anyway.
 */
function qrUrl(url) {
  const params = new URLSearchParams({
    data: url,
    size: '220x220',
    margin: '8',
    color: '0A1628',
    bgcolor: 'FFFFFF',
    qzone: '1',
  })
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`
}

export default function SharePropertyDialog({ open, onClose, property }) {
  const [copied, setCopied] = useState(false)

  const code = property?.transaction?.transaction_code
  const status = property?.transaction?.status
  const isShareable = !!code && SHAREABLE_STATUSES.includes(status)
  const shareUrl = isShareable
    ? `${window.location.origin}/p/${code}`
    : ''

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
    } catch {
      // Fallback: select the text
      const el = document.getElementById('share-url-input')
      if (el) { el.select(); document.execCommand('copy') }
      setCopied(true)
    }
  }

  const handleNativeShare = async () => {
    if (!shareUrl || !navigator.share) return
    try {
      await navigator.share({
        title: `${property?.registered_owner || 'Property'} · FilipinoTracks`,
        text: `View this verified property on FilipinoTracks: ${property?.registered_owner || ''}`,
        url: shareUrl,
      })
    } catch {
      // User cancelled — ignore
    }
  }

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' },
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.75,
        display: 'flex', alignItems: 'center', gap: 1.25,
        background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`,
        borderBottom: `2px solid ${GOLD}`,
        color: '#fff',
      }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: NAVY }}>
          <ShareRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_LIGHT, letterSpacing: '0.14em' }}>
            SHARE PROPERTY
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {property?.registered_owner || 'Property record'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close"
          sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {!isShareable ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            This property can only be shared once its transaction is{' '}
            <strong>approved</strong> or <strong>released</strong>. Current status:{' '}
            <strong>{status || 'unknown'}</strong>.
          </Alert>
        ) : (
          <>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', mb: 2 }}>
              Anyone with this link can view the property page (no login required) and send an inquiry to your team.
            </Typography>

            {/* URL field with copy */}
            <TextField
              id="share-url-input"
              fullWidth
              size="small"
              value={shareUrl}
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: '0.82rem' },
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                      <IconButton onClick={handleCopy} size="small" edge="end" sx={{ color: copied ? '#16A34A' : GOLD_DARK }}>
                        {copied
                          ? <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />
                          : <ContentCopyRoundedIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
              onFocus={(e) => e.target.select()}
            />

            {/* QR code */}
            <Box sx={{
              mt: 2.5,
              p: 1.5,
              display: 'flex', alignItems: 'center', gap: 2,
              borderRadius: 2, bgcolor: 'action.hover',
              border: 1, borderColor: 'divider',
            }}>
              <Box sx={{
                width: 110, height: 110, flexShrink: 0,
                borderRadius: 1.5, overflow: 'hidden',
                bgcolor: '#fff', p: 0.5,
                border: 1, borderColor: 'divider',
              }}>
                <Box
                  component="img"
                  src={qrUrl(shareUrl)}
                  alt="QR code"
                  sx={{ width: '100%', height: '100%', display: 'block' }}
                />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.1em' }}>
                  SCAN TO OPEN
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mt: 0.5, lineHeight: 1.5 }}>
                  Show this QR to a client on-site, or print it on a property flyer.
                </Typography>
              </Box>
            </Box>

            {/* Quick actions */}
            <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: 'wrap' }}>
              {hasNativeShare && (
                <Button
                  variant="outlined"
                  startIcon={<IosShareRoundedIcon />}
                  onClick={handleNativeShare}
                  sx={{ fontWeight: 700, flex: 1, borderColor: `${GOLD}66`, color: GOLD_DARK, '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}14` } }}
                >
                  Share…
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<OpenInNewRoundedIcon />}
                onClick={() => window.open(shareUrl, '_blank', 'noopener,noreferrer')}
                sx={{ fontWeight: 700, flex: 1, borderColor: `${GOLD}66`, color: GOLD_DARK, '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}14` } }}
              >
                Open page
              </Button>
            </Stack>
          </>
        )}
      </Box>

      <DialogActions sx={{ px: 2.5, pb: 2, pt: 0 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  )
}
