/**
 * "Estimated Market Value" card — an indicative open-market figure derived from
 * the company's own priced listings near the lot (comparables / "comps").
 * Complements the BIR zonal value (tax basis) with a real-world price signal.
 */
import { useEffect, useState } from 'react'
import { Box, Typography, CircularProgress, CardContent } from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import { fetchMarketComps, COMP_LEVEL_NOTE } from '../utils/marketValue'
import { GOLD, GOLD_DARK, NAVY } from '../theme/theme'

const peso = (n) => '₱' + Math.round(n || 0).toLocaleString('en-PH')

export default function MarketValueCard({ extracted, area, onMarket }) {
  const province = extracted?.province || ''
  const city = extracted?.city_municipality || ''
  const barangay = extracted?.barangay || ''
  const [state, setState] = useState({ loading: true, data: null })

  useEffect(() => {
    let alive = true
    setState({ loading: true, data: null })
    fetchMarketComps({ province, city, barangay })
      .then((data) => { if (alive) setState({ loading: false, data }) })
      .catch(() => { if (alive) setState({ loading: false, data: null }) })
    return () => { alive = false }
  }, [province, city, barangay])

  const d = state.data
  const value = d ? (d.per_sqm || 0) * (area || 0) : 0

  // Report the snapshot upward for the Valuation Report
  useEffect(() => {
    if (onMarket) onMarket(d && d.count ? { perSqm: d.per_sqm, value, count: d.count, level: d.level } : null)
  }, [d, value]) // eslint-disable-line react-hooks/exhaustive-deps

  const Header = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <StorefrontIcon sx={{ fontSize: 18, color: NAVY }} />
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em' }}>FROM COMPARABLE LISTINGS</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: 'text.primary', lineHeight: 1.1 }}>Estimated Market Value</Typography>
      </Box>
    </Box>
  )

  if (state.loading) {
    return (
      <CardContent>
        {Header}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <CircularProgress size={16} sx={{ color: GOLD }} />
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Checking comparable listings…</Typography>
        </Box>
      </CardContent>
    )
  }

  if (!d || !d.count) {
    return (
      <CardContent>
        {Header}
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
          Not enough comparable listings near this lot to estimate a market value yet. Add more priced properties in your registry to improve this.
        </Typography>
      </CardContent>
    )
  }

  return (
    <CardContent>
      {Header}
      <Box sx={{ p: 1.6, borderRadius: 2, bgcolor: 'action.hover', textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled', letterSpacing: '0.08em' }}>ESTIMATED MARKET VALUE</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: GOLD_DARK, lineHeight: 1.1 }}>{peso(value)}</Typography>
        <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary', mt: 0.3 }}>
          {peso(d.per_sqm)}/sqm × {Math.round(area || 0).toLocaleString('en-PH')} sqm
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mt: 1 }}>
        Based on <strong>{d.count}</strong> comparable listing{d.count === 1 ? '' : 's'} {COMP_LEVEL_NOTE[d.level]}
        {d.low !== d.high ? <> · range <strong>{peso(d.low)}–{peso(d.high)}/sqm</strong></> : null}.
      </Typography>
      <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', mt: 0.8 }}>
        Indicative, from your own listing prices — accuracy depends on how many nearby priced properties you have. Not a formal appraisal.
      </Typography>
    </CardContent>
  )
}
