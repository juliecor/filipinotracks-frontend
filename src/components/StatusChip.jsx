import { Box, Typography } from '@mui/material'
import {
  NAVY, GOLD_DARK, INFO, SUCCESS, WARNING, DANGER, TEXT_MUTED,
} from '../theme/theme'

const STATUS_META = {
  // Legacy short statuses (kept for backward compat)
  pending:    { label: 'Pending',    color: WARNING },
  processing: { label: 'Processing', color: WARNING },
  completed:  { label: 'Completed',  color: SUCCESS },
  rejected:   { label: 'Rejected',   color: DANGER  },

  // Unified transaction lifecycle (matches ClientDashboard)
  'submitted':                { label: 'Submitted',    color: NAVY      },
  'under review':             { label: 'Under Review', color: INFO      },
  'verification ongoing':     { label: 'Verifying',    color: INFO      },
  'waiting for requirements': { label: 'Waiting',      color: GOLD_DARK },
  'pending approval':         { label: 'Pending Approval', color: '#7C3AED' },
  'approved':                 { label: 'Approved',     color: SUCCESS   },
  'released':                 { label: 'Released',     color: SUCCESS   },
}

export default function StatusChip({ status }) {
  const key = (status || '').toLowerCase()
  const meta = STATUS_META[key] || { label: status, color: TEXT_MUTED }
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        px: 1.2,
        py: 0.4,
        bgcolor: `${meta.color}14`,
        borderRadius: '6px',
        border: `1px solid ${meta.color}28`,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
        {meta.label}
      </Typography>
    </Box>
  )
}
