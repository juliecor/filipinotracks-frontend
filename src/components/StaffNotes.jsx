import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Avatar,
  CircularProgress, IconButton, Tooltip, Chip,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import EditIcon         from '@mui/icons-material/Edit'
import SaveIcon         from '@mui/icons-material/Save'
import CancelIcon       from '@mui/icons-material/Cancel'
import { GOLD, GOLD_DARK } from '../theme/theme'
import api from '../api/axios'
import { useToast } from '../context/ToastContext'

function relativeTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Internal Staff Notes card.
 *
 * Private notes per transaction — visible only to admin + assigned staff.
 * The notes never leak to clients (Transaction model strips them by role).
 *
 * Props:
 *  - transactionId: number
 *  - initialNotes: string|null
 *  - initialUpdatedBy: { id, name }|null
 *  - initialUpdatedAt: ISO date string|null
 *  - canEdit: boolean — whether the current user can edit
 */
export default function StaffNotes({
  transactionId,
  initialNotes = '',
  initialUpdatedBy = null,
  initialUpdatedAt = null,
  canEdit = false,
}) {
  const toast = useToast()
  const [notes, setNotes]             = useState(initialNotes || '')
  const [draft, setDraft]             = useState(initialNotes || '')
  const [updatedBy, setUpdatedBy]     = useState(initialUpdatedBy)
  const [updatedAt, setUpdatedAt]     = useState(initialUpdatedAt)
  const [editing, setEditing]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const textareaRef = useRef(null)

  // Sync when transaction reloads externally
  useEffect(() => {
    setNotes(initialNotes || '')
    setDraft(initialNotes || '')
    setUpdatedBy(initialUpdatedBy)
    setUpdatedAt(initialUpdatedAt)
  }, [initialNotes, initialUpdatedBy, initialUpdatedAt])

  const handleEdit = () => {
    setDraft(notes)
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleCancel = () => {
    setDraft(notes)
    setEditing(false)
  }

  const handleSave = useCallback(async () => {
    const next = draft.trim()
    if (next === (notes || '').trim()) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const { data } = await api.put(`/transactions/${transactionId}/staff-notes`, {
        staff_notes: next || null,
      })
      setNotes(data.staff_notes || '')
      setUpdatedBy(data.staff_notes_updated_by)
      setUpdatedAt(data.staff_notes_updated_at)
      setEditing(false)
      toast.success(next ? 'Notes saved.' : 'Notes cleared.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save notes.')
    } finally {
      setSaving(false)
    }
  }, [draft, notes, transactionId, toast])

  // ⌘/Ctrl+Enter to save, Esc to cancel
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const isEmpty = !notes && !editing

  return (
    <Card sx={{
      boxShadow: '0 2px 12px rgba(10,22,40,0.07)',
      border: '1.5px solid',
      borderColor: `${GOLD}55`,
      bgcolor: `${GOLD}06`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gold accent bar */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: GOLD }} />

      <Box sx={{
        px: 3, pt: 2.5, pb: 1.5,
        borderBottom: 1, borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockOutlinedIcon sx={{ fontSize: 18, color: GOLD_DARK }} />
          <Box>
            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.92rem', lineHeight: 1.2 }}>
              Internal Staff Notes
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
              Private to admin + staff · never shown to the client
            </Typography>
          </Box>
        </Box>

        {canEdit && !editing && (
          <Tooltip title={isEmpty ? 'Add notes' : 'Edit notes'}>
            <IconButton size="small" onClick={handleEdit}
              sx={{ bgcolor: `${GOLD}1A`, color: GOLD_DARK, '&:hover': { bgcolor: `${GOLD}33` } }}>
              <EditIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        {editing ? (
          <>
            <TextField
              inputRef={textareaRef}
              fullWidth
              multiline
              minRows={4}
              maxRows={12}
              placeholder="e.g. Title number does not match LRA records — verify Tuesday at the RD office…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={saving}
              inputProps={{ maxLength: 10000 }}
              helperText={`${draft.length} / 10000 · ⌘/Ctrl+Enter to save · Esc to cancel`}
              sx={{
                '& .MuiInputBase-root': { fontFamily: 'inherit', fontSize: '0.88rem', lineHeight: 1.7 },
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={handleCancel}
                disabled={saving}
                startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                sx={{ color: 'text.secondary', fontWeight: 600 }}
              >
                Cancel
              </Button> 
              <Button
                size="small"
                variant="contained"
                color="secondary"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={14} sx={{ color: '#0A1628' }} /> : <SaveIcon sx={{ fontSize: 16 }} />}
                sx={{ fontWeight: 800 }}
              >
                {saving ? 'Saving…' : 'Save Notes'}
              </Button>
            </Box>
          </>
        ) : isEmpty ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', mb: canEdit ? 1.5 : 0 }}>
              No internal notes yet.
            </Typography>
            {canEdit && (
              <Button
                size="small"
                onClick={handleEdit}
                startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                sx={{ color: GOLD_DARK, fontWeight: 700, '&:hover': { bgcolor: `${GOLD}10` } }}
              >
                Add notes
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Typography sx={{
              color: 'text.primary',
              fontSize: '0.88rem',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {notes}
            </Typography>

            {updatedBy && updatedAt && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: GOLD, color: '#0A1628', fontWeight: 800 }}>
                  {updatedBy.name?.charAt(0)}
                </Avatar>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Last edited by <strong style={{ color: 'inherit' }}>{updatedBy.name}</strong> · <span title={new Date(updatedAt).toLocaleString('en-PH')}>{relativeTime(updatedAt)}</span>
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
