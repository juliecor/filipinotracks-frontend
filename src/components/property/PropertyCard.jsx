import { Box, Typography, Chip } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { GOLD, INFO } from '../../theme/theme'
import { STATUS_META, getPolygonPoints, getCenter } from '../../utils/propertyGeo'

export default function PropertyCard({ m, isActive, onClick }) {
  const status = m.transaction?.status
  const meta   = STATUS_META[status]
  const pts    = getPolygonPoints(m)
  const hasGeo = !!getCenter(m)

  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      sx={{
        p: 1.75,
        borderRadius: 2,
        cursor: 'pointer',
        border: '1.5px solid',
        borderColor: isActive ? GOLD : 'divider',
        bgcolor: isActive ? `${GOLD}0E` : 'background.paper',
        transition: 'border-color 0.15s, background 0.15s, transform 0.15s',
        '&:hover': {
          borderColor: isActive ? GOLD : 'action.disabled',
          bgcolor: isActive ? `${GOLD}14` : 'action.hover',
          transform: 'translateX(2px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.875rem', lineHeight: 1.3, flex: 1 }}>
          {m.registered_owner || 'Unknown Owner'}
        </Typography>
        <ChevronRightIcon sx={{ fontSize: 18, color: isActive ? GOLD : 'action.disabled', flexShrink: 0, mt: 0.2 }} />
      </Box>

      {m.title_number && (
        <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'text.secondary', mb: 0.8 }}>
          {m.title_number}
        </Typography>
      )}

      {(m.city_municipality || m.province) && (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3, fontSize: '0.7rem', color: 'text.secondary', mb: 0.8 }}>
          <LocationOnIcon sx={{ fontSize: 12 }} />
          {[m.city_municipality, m.province].filter(Boolean).join(', ')}
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap' }}>
          {m.land_area && (
            <Chip
              label={`${parseFloat(m.land_area).toLocaleString()} sqm`}
              size="small"
              sx={{ fontSize: '0.62rem', fontWeight: 700, height: 18, bgcolor: `${INFO}1F`, color: INFO }}
            />
          )}
          {m.property_type && (
            <Chip
              label={m.property_type}
              size="small"
              sx={{ fontSize: '0.62rem', fontWeight: 700, height: 18, bgcolor: 'action.hover', color: 'text.secondary', textTransform: 'capitalize' }}
            />
          )}
          {!hasGeo && (
            <Chip
              label="No location"
              size="small"
              sx={{ fontSize: '0.6rem', fontWeight: 700, height: 18, bgcolor: 'action.hover', color: 'text.disabled' }}
            />
          )}
        </Box>
        {meta && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: meta.color }} />
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
