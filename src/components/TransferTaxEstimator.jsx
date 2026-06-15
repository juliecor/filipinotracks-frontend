/**
 * Estimated transfer taxes & fees for a lot, derived from its zonal value
 * (or a selling price you enter — BIR taxes the HIGHER of the two).
 *
 * Rates are editable because transfer tax and registration fees vary by
 * province / LGU. Figures are indicative estimates, not an official assessment.
 */
import { useState } from 'react'
import { Box, Typography, TextField, Divider, InputAdornment } from '@mui/material'
import { GOLD_DARK } from '../theme/theme'

const peso = (n) => '₱' + Math.round(n || 0).toLocaleString('en-PH')

function RateLine({ label, who, rate, onRate, amount }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 0.4 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: 'text.primary' }}>{label}</Typography>
        {who && <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>{who}</Typography>}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <TextField
          size="small" value={rate} onChange={(e) => onRate(e.target.value)} type="number"
          inputProps={{ min: 0, step: 0.05 }}
          sx={{ width: 74, '& .MuiOutlinedInput-input': { py: 0.4, fontSize: '0.74rem', textAlign: 'right' } }}
          InputProps={{ endAdornment: <InputAdornment position="end" sx={{ '& p': { fontSize: '0.7rem' } }}>%</InputAdornment> }}
        />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: 'text.primary', minWidth: 92, textAlign: 'right', fontFamily: 'monospace' }}>
          {peso(amount)}
        </Typography>
      </Box>
    </Box>
  )
}

export default function TransferTaxEstimator({ zonalValue = 0 }) {
  const [selling, setSelling] = useState('')
  const [cgt, setCgt] = useState('6')        // Capital Gains Tax (or CWT)
  const [dst, setDst] = useState('1.5')      // Documentary Stamp Tax
  const [transfer, setTransfer] = useState('0.75') // LGU transfer tax (varies)
  const [reg, setReg] = useState('0.25')     // Registration fee (approx of LRA schedule)

  const sellingNum = Number(selling) || 0
  const base = Math.max(zonalValue || 0, sellingNum)
  const amt = (r) => base * (Number(r) || 0) / 100
  const cgtA = amt(cgt), dstA = amt(dst), trA = amt(transfer), regA = amt(reg)
  const total = cgtA + dstA + trA + regA

  return (
    <Box sx={{ mt: 1.6, p: 1.4, borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
      <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'text.disabled', letterSpacing: '0.08em', mb: 0.8 }}>
        ESTIMATED TRANSFER TAXES & FEES
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Selling price (optional)</Typography>
        <TextField
          size="small" value={selling} onChange={(e) => setSelling(e.target.value)} type="number" placeholder="contract price"
          sx={{ width: 150, '& .MuiOutlinedInput-input': { py: 0.4, fontSize: '0.76rem', textAlign: 'right' } }}
          InputProps={{ startAdornment: <InputAdornment position="start" sx={{ '& p': { fontSize: '0.74rem' } }}>₱</InputAdornment> }}
        />
      </Box>
      <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mb: 0.4 }}>
        Tax base (higher of zonal vs selling): <strong style={{ color: GOLD_DARK }}>{peso(base)}</strong>
      </Typography>

      <Divider sx={{ my: 0.6 }} />
      <RateLine label="Capital Gains Tax" who="usually the seller" rate={cgt} onRate={setCgt} amount={cgtA} />
      <RateLine label="Documentary Stamp Tax" who="usually the buyer" rate={dst} onRate={setDst} amount={dstA} />
      <RateLine label="Transfer Tax (LGU)" who="buyer · varies by province/city" rate={transfer} onRate={setTransfer} amount={trA} />
      <RateLine label="Registration Fee" who="buyer · approx. LRA schedule" rate={reg} onRate={setReg} amount={regA} />
      <Divider sx={{ my: 0.6 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography sx={{ fontWeight: 800, color: 'text.primary' }}>Estimated total</Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: GOLD_DARK, fontFamily: 'monospace' }}>{peso(total)}</Typography>
      </Box>
      <Typography sx={{ fontSize: '0.66rem', color: 'text.disabled', mt: 0.6 }}>
        Estimates only. BIR computes on the higher of zonal value or selling price; transfer tax and registration fees vary by LGU —
        adjust the rates to match your area.
      </Typography>
    </Box>
  )
}
