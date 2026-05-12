import { Chip } from '@mui/material'

const colors = { pending: 'warning', processing: 'info', completed: 'success', rejected: 'error' }

export default function StatusChip({ status }) {
  return <Chip label={status} color={colors[status] || 'default'} size="small" />
}
