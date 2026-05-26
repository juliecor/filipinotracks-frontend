import { useMemo, useState } from 'react'
import { Box, Typography, Avatar, ToggleButton, ToggleButtonGroup, Chip } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
// Action icons
import EditIcon          from '@mui/icons-material/Edit'
import EmailIcon         from '@mui/icons-material/Email'
import AttachFileIcon    from '@mui/icons-material/AttachFile'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import MapIcon           from '@mui/icons-material/Map'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import CancelIcon        from '@mui/icons-material/Cancel'
import HistoryIcon       from '@mui/icons-material/History'
import ThumbUpIcon       from '@mui/icons-material/ThumbUp'
import PauseCircleIcon   from '@mui/icons-material/PauseCircle'
import { NAVY, GOLD, GOLD_DARK, INFO, SUCCESS, WARNING, DANGER } from '../theme/theme'
import { STATUS_META } from '../utils/propertyGeo'

/**
 * Classify a log entry into an event type so we can pick the right
 * icon + color. Pattern-matched on the action string (free-form text).
 */
function classify(log) {
  const action = (log.action || '').toLowerCase()
  const to     = (log.to_status || '').toLowerCase()

  if (action.includes('email')) {
    return { type: 'email', label: 'Email sent', icon: <EmailIcon />, color: GOLD }
  }
  if (action.includes('document uploaded') || action.includes('document added')) {
    return { type: 'upload', label: 'Document uploaded', icon: <AttachFileIcon />, color: INFO }
  }
  if (action.includes('document removed') || action.includes('document deleted')) {
    return { type: 'docdel', label: 'Document removed', icon: <DeleteOutlineIcon />, color: DANGER }
  }
  if (action.includes('property map')) {
    return { type: 'map', label: 'Property map edited', icon: <MapIcon />, color: GOLD_DARK }
  }
  if (action.includes('assigned')) {
    return { type: 'assign', label: 'Staff assigned', icon: <ThumbUpIcon />, color: INFO }
  }

  // Status-change events — pick color based on new status
  if (to === 'approved' || to === 'released') {
    return { type: 'status', label: log.action, icon: <CheckCircleIcon />, color: SUCCESS }
  }
  if (to === 'rejected') {
    return { type: 'status', label: log.action, icon: <CancelIcon />, color: DANGER }
  }
  if (to === 'pending approval') {
    return { type: 'status', label: log.action, icon: <PauseCircleIcon />, color: '#7C3AED' }
  }
  if (to === 'verification ongoing' || to === 'under review' || to === 'processing') {
    return { type: 'status', label: log.action, icon: <EditIcon />, color: INFO }
  }
  if (to === 'waiting for requirements') {
    return { type: 'status', label: log.action, icon: <PauseCircleIcon />, color: WARNING }
  }
  if (to === 'submitted') {
    return { type: 'status', label: log.action, icon: <HistoryIcon />, color: NAVY }
  }

  return { type: 'status', label: log.action, icon: <HistoryIcon />, color: NAVY }
}

/**
 * Convert a date string to a relative-time label, with a tooltip-style full date.
 */
function relativeTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now  = new Date()
  const diff = (now - date) / 1000  // seconds

  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)} hr ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fullDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

const FILTERS = [
  { value: 'all',    label: 'All' },
  { value: 'status', label: 'Status' },
  { value: 'email',  label: 'Emails' },
  { value: 'upload', label: 'Files' },
  { value: 'map',    label: 'Map' },
]

/**
 * Rich activity timeline for a transaction.
 *
 * Props:
 *  - logs: array of TransactionLog records (with `performed_by` user loaded)
 */
export default function ActivityTimeline({ logs = [] }) {
  const [filter, setFilter] = useState('all')

  // Sort latest first (defensive — backend may already do this)
  const sorted = useMemo(
    () => [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [logs]
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return sorted
    if (filter === 'upload') return sorted.filter(l => {
      const t = classify(l).type
      return t === 'upload' || t === 'docdel'
    })
    return sorted.filter(l => classify(l).type === filter)
  }, [sorted, filter])

  if (logs.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mx: 'auto', mb: 1.5,
        }}>
          <HistoryIcon sx={{ fontSize: 28, color: 'text.disabled' }} />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          No activity yet
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          Updates will appear here as they happen.
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Filter chips */}
      {logs.length > 3 && (
        <Box sx={{ mb: 2, mx: -0.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => v && setFilter(v)}
            size="small"
            sx={{
              gap: 0.5,
              flexWrap: 'nowrap',
              '& .MuiToggleButton-root': {
                border: 1, borderColor: 'divider', borderRadius: '999px !important',
                px: 1.5, py: 0.4, fontSize: '0.72rem', fontWeight: 700,
                color: 'text.secondary',
                '&.Mui-selected': { bgcolor: `${GOLD}1F`, color: GOLD_DARK, borderColor: GOLD },
              },
            }}
          >
            {FILTERS.map(f => (
              <ToggleButton key={f.value} value={f.value}>{f.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}

      <Box sx={{ position: 'relative' }}>
        <AnimatePresence initial={false}>
          {filtered.map((log, i) => {
            const isLast = i === filtered.length - 1
            const meta = classify(log)
            const performer = log.performed_by

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
                  {/* Vertical connector */}
                  {!isLast && (
                    <Box sx={{
                      position: 'absolute',
                      left: 17, top: 36, bottom: -4,
                      width: '2px',
                      bgcolor: 'divider',
                      zIndex: 0,
                    }} />
                  )}

                  {/* Icon bubble */}
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '50%',
                    flexShrink: 0, zIndex: 1,
                    bgcolor: `${meta.color}1A`,
                    border: `2px solid ${meta.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: meta.color,
                    '& svg': { fontSize: 18 },
                  }}>
                    {meta.icon}
                  </Box>

                  {/* Body */}
                  <Box sx={{ pb: isLast ? 0 : 2.5, flex: 1, minWidth: 0, mt: 0.3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.88rem' }}>
                        {meta.label}
                      </Typography>
                      <Typography
                        title={fullDate(log.created_at)}
                        sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 600 }}
                      >
                        · {relativeTime(log.created_at)}
                      </Typography>
                    </Box>

                    {/* Status badges for status changes */}
                    {log.to_status && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.6, flexWrap: 'wrap' }}>
                        {log.from_status && (
                          <>
                            <StatusPill status={log.from_status} subtle />
                            <Typography sx={{ color: 'text.disabled', fontWeight: 700 }}>→</Typography>
                          </>
                        )}
                        <StatusPill status={log.to_status} />
                      </Box>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <Box sx={{
                        mt: 0.8, p: 1, borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        borderLeft: '3px solid', borderLeftColor: meta.color,
                      }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                          {log.notes}
                        </Typography>
                      </Box>
                    )}

                    {/* Performer */}
                    {performer && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
                        <Avatar
                          src={performer.profile_picture_url || undefined}
                          sx={{ width: 18, height: 18, fontSize: '0.6rem', bgcolor: meta.color, color: 'white', fontWeight: 800 }}
                        >
                          {!performer.profile_picture_url && performer.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          by <strong style={{ color: 'inherit' }}>{performer.name}</strong>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              No events match the selected filter.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

function StatusPill({ status, subtle = false }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748B' }
  return (
    <Chip
      label={meta.label}
      size="small"
      sx={{
        height: 18,
        fontSize: '0.62rem',
        fontWeight: 800,
        bgcolor: subtle ? 'transparent' : `${meta.color}1F`,
        color: meta.color,
        border: `1px solid ${meta.color}${subtle ? '55' : '00'}`,
        opacity: subtle ? 0.7 : 1,
      }}
    />
  )
}
