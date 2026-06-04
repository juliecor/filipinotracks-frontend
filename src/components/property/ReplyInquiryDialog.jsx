import { useState, useEffect } from 'react'
import {
  Dialog, DialogActions, Box, Typography, IconButton, Button, Stack,
  TextField, Alert, CircularProgress, Divider, Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import api from '../../api/axios'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK, TEXT_MUTED } from '../../theme/theme'

function fmt(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/**
 * Compose + send an email reply to a buyer's inquiry, straight from the dashboard.
 *
 * Props:
 *  - open, onClose()
 *  - inquiry       — the inquiry object (with .replies array)
 *  - onReplied(updatedInquiry)
 */
export default function ReplyInquiryDialog({ open, onClose, inquiry, onReplied }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (open) { setMessage(''); setError('') }
  }, [open, inquiry?.id])

  if (!inquiry) return null

  const noEmail = !inquiry.email
  const replies = inquiry.replies || []

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    setError('')
    try {
      const { data } = await api.post(`/admin/inquiries/${inquiry.id}/reply`, { message: message.trim() })
      onReplied?.(data)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send reply.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={sending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 3, overflow: 'hidden' } }}
      BackdropProps={{ sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }}
    >
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.25,
        background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`,
        borderBottom: `2px solid ${GOLD}`, color: '#fff',
      }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: NAVY }}>
          <EmailOutlinedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_LIGHT, letterSpacing: '0.14em' }}>
            REPLY TO INQUIRY
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {inquiry.name}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={sending} aria-label="Close"
          sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {/* To + original message */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>To:</Typography>
          {inquiry.email
            ? <Chip size="small" label={inquiry.email} sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }} />
            : <Chip size="small" color="warning" label="No email on file" />}
        </Stack>

        <Box sx={{ p: 1.5, mb: 2, borderRadius: 1.5, bgcolor: 'action.hover', border: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.08em', mb: 0.5 }}>
            THEIR MESSAGE
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {inquiry.message}
          </Typography>
        </Box>

        {/* Previous replies */}
        {replies.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.08em', mb: 1 }}>
              PREVIOUS REPLIES ({replies.length})
            </Typography>
            <Stack spacing={1}>
              {replies.map((r) => (
                <Box key={r.id} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: `${GOLD}0E`, border: `1px solid ${GOLD}33` }}>
                  <Typography sx={{ fontSize: '0.84rem', color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {r.message}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.5 }}>
                    {r.user?.name || 'Staff'} · {fmt(r.created_at)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {noEmail ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            This buyer didn't leave an email — reach them via the <strong>Viber</strong> button on their card instead.
          </Alert>
        ) : (
          <>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.1em', mb: 0.75 }}>
              YOUR REPLY
            </Typography>
            <TextField
              fullWidth multiline rows={5} autoFocus
              placeholder="Hi! Thanks for your interest. Here are the details…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 0.75 }}>
              This will be emailed to {inquiry.name} and the inquiry will be marked as contacted.
            </Typography>
          </>
        )}
      </Box>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1 }}>
        <Button onClick={onClose} disabled={sending} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={sending || noEmail || !message.trim()}
          startIcon={sending ? <CircularProgress size={16} sx={{ color: NAVY }} /> : <SendRoundedIcon />}
          sx={{
            fontWeight: 800, px: 3,
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
            color: NAVY,
            '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
            '&.Mui-disabled': { background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.35)' },
          }}
        >
          {sending ? 'Sending…' : 'Send Reply'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
