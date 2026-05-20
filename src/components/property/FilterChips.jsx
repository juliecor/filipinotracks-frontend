import { useState, useMemo } from 'react'
import { Box, Chip, Menu, MenuItem, Typography } from '@mui/material'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PolylineIcon from '@mui/icons-material/Polyline'
import ApartmentIcon from '@mui/icons-material/Apartment'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { GOLD, GOLD_DARK } from '../../theme/theme'

/**
 * Quick-filter chip row. Filters combine (AND).
 *
 * Props:
 *  - filters: { hasPin: bool, hasBoundary: bool, province: string|null }
 *  - onChange: (newFilters) => void
 *  - provinces: string[]  (unique province options derived from data)
 */
export default function FilterChips({ filters, onChange, provinces }) {
  const [provinceAnchor, setProvinceAnchor] = useState(null)

  const provinceList = useMemo(
    () => [...new Set(provinces.filter(Boolean))].sort(),
    [provinces]
  )

  const toggle = (key) => onChange({ ...filters, [key]: !filters[key] })
  const setProvince = (value) => { onChange({ ...filters, province: value }); setProvinceAnchor(null) }
  const clearAll = () => onChange({ hasPin: false, hasBoundary: false, province: null })

  const anyActive = filters.hasPin || filters.hasBoundary || filters.province

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
      <FilterChip
        label="Has Pin"
        icon={<LocationOnIcon sx={{ fontSize: 13 }} />}
        active={filters.hasPin}
        onClick={() => toggle('hasPin')}
      />
      <FilterChip
        label="Boundary"
        icon={<PolylineIcon sx={{ fontSize: 13 }} />}
        active={filters.hasBoundary}
        onClick={() => toggle('hasBoundary')}
      />
      <FilterChip
        label={filters.province || 'Province'}
        icon={<ApartmentIcon sx={{ fontSize: 13 }} />}
        active={!!filters.province}
        onClick={(e) => setProvinceAnchor(e.currentTarget)}
        endAdornment={<KeyboardArrowDownIcon sx={{ fontSize: 14, ml: 0.2 }} />}
      />
      {anyActive && (
        <Chip
          label="Clear"
          size="small"
          onClick={clearAll}
          onDelete={clearAll}
          deleteIcon={<CloseIcon sx={{ fontSize: 13 }} />}
          sx={{
            height: 26,
            fontSize: '0.7rem',
            fontWeight: 700,
            bgcolor: 'transparent',
            color: 'text.secondary',
            border: '1px dashed',
            borderColor: 'divider',
            '& .MuiChip-deleteIcon': { color: 'text.secondary', '&:hover': { color: 'text.primary' } },
          }}
        />
      )}

      {/* Province menu */}
      <Menu
        anchorEl={provinceAnchor}
        open={Boolean(provinceAnchor)}
        onClose={() => setProvinceAnchor(null)}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        PaperProps={{ sx: { mt: 0.5, minWidth: 200, maxHeight: 320, borderRadius: 2, boxShadow: 4 } }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Filter by Province
          </Typography>
        </Box>
        <MenuItem
          selected={!filters.province}
          onClick={() => setProvince(null)}
          sx={{ fontSize: '0.85rem', fontWeight: !filters.province ? 700 : 500, color: 'text.primary', py: 1 }}
        >
          All provinces
        </MenuItem>
        {provinceList.length === 0 && (
          <MenuItem disabled sx={{ fontSize: '0.8rem' }}>No provinces available</MenuItem>
        )}
        {provinceList.map(p => (
          <MenuItem
            key={p}
            selected={filters.province === p}
            onClick={() => setProvince(p)}
            sx={{ fontSize: '0.85rem', fontWeight: filters.province === p ? 700 : 500, color: 'text.primary', py: 1 }}
          >
            {p}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  )
}

function FilterChip({ label, icon, active, onClick, endAdornment }) {
  return (
    <Box
      onClick={onClick}
      role="button"
      tabIndex={0}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.1,
        height: 26,
        borderRadius: '999px',
        cursor: 'pointer',
        userSelect: 'none',
        fontSize: '0.72rem',
        fontWeight: 700,
        transition: 'all 0.15s',
        bgcolor: active ? `${GOLD}1F` : 'background.paper',
        color: active ? GOLD_DARK : 'text.secondary',
        border: '1px solid',
        borderColor: active ? GOLD : 'divider',
        '&:hover': {
          bgcolor: active ? `${GOLD}2E` : 'action.hover',
          borderColor: active ? GOLD : 'action.disabled',
        },
      }}
    >
      {icon}
      <Box sx={{ lineHeight: 1 }}>{label}</Box>
      {endAdornment}
    </Box>
  )
}

/**
 * Apply filters to property list. Used by both pages.
 */
export function applyFilters(properties, { hasPin, hasBoundary, province }) {
  return properties.filter(m => {
    if (hasPin && !(m.latitude && m.longitude)) return false
    if (hasBoundary && !m.geojson_polygon) return false
    if (province && m.province !== province) return false
    return true
  })
}
