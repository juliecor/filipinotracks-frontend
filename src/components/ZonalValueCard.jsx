/**
 * "Estimated Zonal Value" card for the AI Title Scanner result step.
 *
 * Pulls official BIR zonal values for the lot's location from the company's
 * zonal system (via our backend proxy) and computes value = ₱/sqm × area.
 * Lets the user pick the land classification, since the title rarely states it.
 */
import { useEffect, useMemo, useState } from 'react'
import { Box, Typography, Select, MenuItem, CircularProgress, Button, Chip, CardContent, Divider, Collapse } from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { fetchZonalValue, median, CLASSIFICATION_LABELS } from '../utils/zonalValue'
import { GOLD, GOLD_DARK, NAVY } from '../theme/theme'
import TransferTaxEstimator from './TransferTaxEstimator'

const peso = (n) => '₱' + Math.round(n || 0).toLocaleString('en-PH')

/** Order classifications so the common urban ones come first (not A50 agri). */
function rankClass(code) {
  const c = String(code || '').toUpperCase()
  if (/RESID|^RR/.test(c)) return 0
  if (/COMMER|^CR/.test(c)) return 1
  if (/CONDO|^RC|^CC/.test(c)) return 2
  if (/INDUS|^I\b|^I[0-9]/.test(c)) return 3
  if (/PARK/.test(c)) return 4
  if (/AGRI|^A/.test(c)) return 5
  if (/^GP|GOV/.test(c)) return 6
  return 7
}

/** Friendly label for cryptic codes like "A50" or "RR**"; full names pass through. */
function classLabel(code) {
  const c = String(code || '')
  const base = c.replace(/\*+$/, '').toUpperCase()
  if (CLASSIFICATION_LABELS[base]) return `${c} · ${CLASSIFICATION_LABELS[base]}`
  if (/[A-Z]{4,}/.test(base)) return c // already descriptive, e.g. "RESIDENTIAL REGULAR"
  if (base.startsWith('RR')) return `${c} · Residential`
  if (base.startsWith('RC')) return `${c} · Residential Condo`
  if (base.startsWith('CR')) return `${c} · Commercial`
  if (base.startsWith('CC')) return `${c} · Commercial Condo`
  if (base.startsWith('A')) return `${c} · Agricultural`
  if (base.startsWith('I')) return `${c} · Industrial`
  if (base.startsWith('GP')) return `${c} · Government`
  if (base.startsWith('X')) return `${c} · Special / Exempt`
  return c
}

const LEVEL_NOTE = {
  'barangay':      'Barangay-level match',
  'barangay-text': 'Barangay-level match',
  'city':          'City-level match — no exact barangay entry',
  'province':      'Province-level match — broad estimate only',
}

export default function ZonalValueCard({ extracted, area }) {
  const province = extracted?.province || ''
  const city = extracted?.city_municipality || ''
  const barangay = extracted?.barangay || ''

  const [state, setState] = useState({ loading: true, data: null, error: null })
  const [cls, setCls] = useState('')
  const [showEntries, setShowEntries] = useState(false)

  const load = () => {
    setState({ loading: true, data: null, error: null })
    fetchZonalValue({ province, city, barangay })
      .then((data) => {
        setState({ loading: false, data, error: null })
        // Pre-select the top (highest-priority, usually Residential) classification;
        // the user can switch to another if it's not right.
        const codes = [...(data.classifications || [])].sort(
          (a, b) => rankClass(a) - rankClass(b) || String(a).localeCompare(String(b))
        )
        setCls(codes[0] || '')
      })
      .catch((err) => {
        const status = err.response?.status
        setState({ loading: false, data: null, error: { status, message: err.response?.data?.message || err.message } })
      })
  }
  useEffect(load, [province, city, barangay]) // eslint-disable-line react-hooks/exhaustive-deps

  const { rows = [], classifications = [], matched_level, count, message, domain, query } = state.data || {}
  const q = query || { province, city, barangay }
  const clsRows = useMemo(() => rows.filter((r) => r.classification_code === cls), [rows, cls])
  const perSqm = useMemo(() => median(clsRows.map((r) => r.value_per_sqm)), [clsRows])
  const values = clsRows.map((r) => r.value_per_sqm).filter(Number.isFinite)
  const lo = values.length ? Math.min(...values) : 0
  const hi = values.length ? Math.max(...values) : 0
  const total = perSqm * (area || 0)
  // The BIR zone(s) the rows actually live under (the sheet's "City" column)
  const matchedZone = useMemo(
    () => [...new Set(rows.map((r) => r.city_municipality).filter(Boolean))].join(', '),
    [rows]
  )
  const sortedClasses = useMemo(
    () => [...classifications].sort((a, b) => rankClass(a) - rankClass(b) || String(a).localeCompare(String(b))),
    [classifications]
  )

  const Header = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.4 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <AccountBalanceIcon sx={{ fontSize: 19, color: NAVY }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em' }}>BIR ZONAL BASIS</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: 'text.primary', lineHeight: 1.1 }}>Estimated Zonal Value</Typography>
      </Box>
    </Box>
  )

  if (state.loading) {
    return (
      <CardContent>
        {Header}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, py: 1 }}>
          <CircularProgress size={18} sx={{ color: GOLD }} />
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Checking zonal values for {[barangay, city, province].filter(Boolean).join(', ') || 'this area'}…</Typography>
        </Box>
      </CardContent>
    )
  }

  // Service not configured yet (no token) — show a quiet "connect" state
  if (state.error?.status === 503) {
    return (
      <CardContent>
        {Header}
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
          Zonal valuation isn't connected yet. Add <strong>ZONAL_API_TOKEN</strong> in the backend <code>.env</code> to switch it on.
        </Typography>
      </CardContent>
    )
  }

  if (state.error) {
    return (
      <CardContent>
        {Header}
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1 }}>
          Couldn't fetch zonal value{state.error.message ? ` — ${state.error.message}` : ''}.
        </Typography>
        <Button size="small" variant="outlined" onClick={load} sx={{ fontWeight: 700 }}>Retry</Button>
      </CardContent>
    )
  }

  if (!count) {
    return (
      <CardContent>
        {Header}
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
          {message || (
            <>
              No zonal-value entries found for <strong>{[barangay, city, province].filter(Boolean).join(', ') || 'this location'}</strong>.
              The location names may differ from the zonal records — try editing them on the review step.
            </>
          )}
        </Typography>
      </CardContent>
    )
  }

  const Row = ({ label, value }) => (
    <>
      <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.76rem', color: 'text.primary', fontWeight: 700 }}>{value || '—'}</Typography>
    </>
  )

  return (
    <CardContent>
      {Header}

      {/* Where this value came from — so you can verify it on the zonal website */}
      <Box sx={{ mb: 1.5, p: 1.3, borderRadius: 2, bgcolor: 'action.hover' }}>
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: 'text.disabled', letterSpacing: '0.1em', mb: 0.7 }}>
          ZONAL BASIS · WHERE THIS CAME FROM
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 12px' }}>
          <Row label="Province" value={q.province} />
          <Row label="City / Municipality" value={q.city} />
          <Row label="Barangay" value={q.barangay} />
          <Row label="Matched BIR zone" value={matchedZone} />
        </Box>
      </Box>

      {/* Classification — your choice */}
      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, mb: 0.5 }}>
        Land classification — pick the one matching the lot:
      </Typography>
      <Select
        size="small" value={cls} onChange={(e) => setCls(e.target.value)} fullWidth displayEmpty
        sx={{ mb: 1.4, '& .MuiSelect-select': { py: 0.7, fontSize: '0.8rem', fontWeight: 700 } }}
      >
        <MenuItem value="" disabled sx={{ fontSize: '0.8rem' }}>— Choose classification —</MenuItem>
        {sortedClasses.map((code) => (
          <MenuItem key={code} value={code} sx={{ fontSize: '0.8rem' }}>
            {classLabel(code)}
          </MenuItem>
        ))}
      </Select>

      <Box sx={{ p: 1.6, borderRadius: 2, bgcolor: 'action.hover', textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.08em' }}>
          ESTIMATED VALUE{cls ? ` · ${cls}` : ''}
        </Typography>
        {cls ? (
          <>
            <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', color: GOLD_DARK, lineHeight: 1.1 }}>{peso(total)}</Typography>
            <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 0.3 }}>
              {peso(perSqm)}/sqm × {Math.round(area || 0).toLocaleString('en-PH')} sqm
            </Typography>
          </>
        ) : (
          <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', py: 1 }}>Choose a classification above to see the value.</Typography>
        )}
      </Box>

      {cls && values.length > 1 && lo !== hi && (
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', mt: 1 }}>
          Range for {cls}: <strong>{peso(lo)}–{peso(hi)}/sqm</strong> across {values.length} entries.
        </Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.2, flexWrap: 'wrap' }}>
        <Chip size="small" label={LEVEL_NOTE[matched_level] || 'Matched'} sx={{ fontSize: '0.62rem', fontWeight: 700, bgcolor: matched_level === 'province' ? '#FEF3C7' : '#DCFCE7', color: '#166534' }} />
        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>{count} zonal record{count === 1 ? '' : 's'} found</Typography>
      </Box>

      {/* The actual matching entries — verify these against the website */}
      {cls && clsRows.length > 0 && (
        <>
          <Button onClick={() => setShowEntries((v) => !v)} size="small" sx={{ mt: 0.5, fontWeight: 700, textTransform: 'none', px: 0 }}
                  endIcon={<KeyboardArrowDownIcon sx={{ transform: showEntries ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}>
            {showEntries ? 'Hide' : 'Show'} matching entries ({clsRows.length})
          </Button>
          <Collapse in={showEntries}>
            <Box sx={{ maxHeight: 200, overflow: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 0.5 }}>
              {clsRows.map((r, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, px: 1.2, py: 0.7, borderBottom: i < clsRows.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.street_location || '—'}
                    </Typography>
                    {r.vicinity && <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.vicinity}</Typography>}
                  </Box>
                  <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: GOLD_DARK, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {peso(r.value_per_sqm)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Collapse>
        </>
      )}

      {/* Transfer taxes & fees, off the zonal value (or a selling price you enter) */}
      {cls && total > 0 && <TransferTaxEstimator zonalValue={total} />}

      <Divider sx={{ my: 1.2 }} />
      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
        Based on official <strong>BIR zonal values</strong> from your zonal system — the government tax basis, typically
        <em> below</em> open-market selling price. For indication only, not a formal appraisal.
      </Typography>
    </CardContent>
  )
}
