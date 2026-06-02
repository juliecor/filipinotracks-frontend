import { useState, useMemo } from 'react'
import { Box, Typography, TextField, InputAdornment, Stack, Divider } from '@mui/material'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK, TEXT_MUTED } from '../../theme/theme'

const peso = (n) =>
  '₱' + Math.round(n).toLocaleString('en-PH')

/**
 * Simple mortgage amortization estimator for a property's asking price.
 * All math is client-side; figures are estimates only.
 */
export default function AmortizationCalculator({ price }) {
  const [downPct, setDownPct] = useState(20)
  const [rate, setRate]       = useState(6)
  const [years, setYears]     = useState(15)

  const { loan, monthly, totalInterest } = useMemo(() => {
    const p = Number(price) || 0
    const dp = Math.min(Math.max(Number(downPct) || 0, 0), 100)
    const loanAmt = p * (1 - dp / 100)
    const n = (Number(years) || 0) * 12
    const r = (Number(rate) || 0) / 100 / 12

    if (loanAmt <= 0 || n <= 0) {
      return { loan: loanAmt, monthly: 0, totalInterest: 0 }
    }
    const m = r === 0 ? loanAmt / n : loanAmt * r / (1 - Math.pow(1 + r, -n))
    return { loan: loanAmt, monthly: m, totalInterest: m * n - loanAmt }
  }, [price, downPct, rate, years])

  if (!price || Number(price) <= 0) return null

  const field = (label, value, setValue, adornment, max) => (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.06em', mb: 0.5 }}>
        {label}
      </Typography>
      <TextField
        fullWidth size="small" type="number"
        value={value}
        onChange={(e) => setValue(e.target.value === '' ? '' : Math.min(Number(e.target.value), max))}
        InputProps={{ endAdornment: <InputAdornment position="end">{adornment}</InputAdornment> }}
      />
    </Box>
  )

  return (
    <Box sx={{
      borderRadius: 3, overflow: 'hidden',
      border: 1, borderColor: 'divider',
      bgcolor: 'background.paper',
    }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1,
        background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`, color: '#fff',
      }}>
        <CalculateOutlinedIcon sx={{ fontSize: 20, color: GOLD_LIGHT }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>Monthly Payment Estimate</Typography>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {/* Big monthly number */}
        <Box sx={{ textAlign: 'center', mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.12em' }}>
            ESTIMATED MONTHLY
          </Typography>
          <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1.1 }}>
            {peso(monthly)}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.5 }}>
            for {years} years · {peso(loan)} financed
          </Typography>
        </Box>

        {/* Inputs */}
        <Stack direction="row" spacing={1.5}>
          {field('Down Payment', downPct, setDownPct, '%', 100)}
          {field('Interest / yr', rate, setRate, '%', 30)}
          {field('Term', years, setYears, 'yrs', 40)}
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Breakdown */}
        <Stack spacing={0.75}>
          <Row label="Asking price" value={peso(price)} />
          <Row label={`Down payment (${downPct || 0}%)`} value={peso((Number(price) || 0) * (Number(downPct) || 0) / 100)} />
          <Row label="Loan amount" value={peso(loan)} />
          <Row label="Total interest" value={peso(totalInterest)} />
        </Stack>

        <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 2, textAlign: 'center', lineHeight: 1.5 }}>
          Estimate only. Actual terms depend on the lender, your credit standing, and current rates.
        </Typography>
      </Box>
    </Box>
  )
}

function Row({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }}>{value}</Typography>
    </Box>
  )
}
