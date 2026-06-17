/**
 * Scope-locked AI chat for property / zonal / market / tax questions. Can look
 * up any location on demand and gives general real-estate & business-use
 * guidance. Conversation is persisted to localStorage so it's remembered across
 * navigation and refreshes. Used standalone on the AI Zonal Assistant page (and
 * optionally fed a lot's context).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, TextField, IconButton, CircularProgress, Chip, CardContent, Tooltip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import SendIcon from '@mui/icons-material/Send'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import { askAssistant } from '../utils/zonalAssistant'
import { GOLD, GOLD_DARK, NAVY } from '../theme/theme'

const STORAGE = 'zonal-assistant-chat'

const SUGGEST_LOT = [
  "What's the best business use for this lot?",
  'How much tax if sold at ₱5M?',
  'Is this above or below market value?',
  'What about Lapu-Lapu City?',
]
const SUGGEST_GENERAL = [
  "What's the zonal value of Lahug, Cebu City?",
  'Best business use for a commercial lot in Mandaue?',
  'Estimate transfer taxes for a ₱3M lot',
  'Compare residential zonal values in Cebu vs Bohol',
]

export default function ZonalAssistant({ extracted, area, zonal, market, messagesMaxHeight = 300 }) {
  const hasLot = !!(extracted && (extracted.province || extracted.title_number))
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE)) || [] } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)

  const context = useMemo(() => (hasLot ? {
    title: extracted?.title_number,
    owner: extracted?.registered_owner,
    location: { province: extracted?.province, city: extracted?.city_municipality, barangay: extracted?.barangay },
    area_sqm: Math.round(area || 0),
    zonal: zonal ? { classification: zonal.classification, per_sqm: zonal.perSqm, total: zonal.total, matched_bir_zone: zonal.matchedZone } : null,
    market: market ? { per_sqm: market.perSqm, value: market.value, comparable_listings: market.count } : null,
  } : null), [hasLot, extracted, area, zonal, market])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, busy])
  useEffect(() => { try { localStorage.setItem(STORAGE, JSON.stringify(messages.slice(-30))) } catch { /* quota */ } }, [messages])

  const send = async (text) => {
    const q = (text ?? input).trim()
    if (!q || busy) return
    const next = [...messages, { role: 'user', content: q }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const reply = await askAssistant(next.map((m) => ({ role: m.role, content: m.content })), context)
      setMessages([...next, { role: 'assistant', content: reply || '…' }])
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Sorry — I had trouble answering. Please try again.'
      setMessages([...next, { role: 'assistant', content: `⚠️ ${msg}` }])
    } finally {
      setBusy(false)
    }
  }

  const clearChat = () => { setMessages([]); try { localStorage.removeItem(STORAGE) } catch { /* ignore */ } }

  const suggestions = hasLot ? SUGGEST_LOT : SUGGEST_GENERAL

  return (
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AutoAwesomeIcon sx={{ fontSize: 18, color: NAVY }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.58rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em' }}>ASK THE AI</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.98rem', color: 'text.primary', lineHeight: 1.1 }}>
            {hasLot ? 'Ask about this property' : 'Property & Zonal Assistant'}
          </Typography>
        </Box>
        {messages.length > 0 && (
          <Tooltip title="Clear conversation">
            <IconButton size="small" onClick={clearChat}><DeleteSweepIcon sx={{ fontSize: 19 }} /></IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ maxHeight: messagesMaxHeight, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1, py: 0.5 }}>
        {messages.length === 0 && (
          <Box>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1 }}>
              Ask about zonal value, market value, transfer taxes, classification, or the best use for a property — for this lot or any location in the Philippines.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
              {suggestions.map((s) => (
                <Chip key={s} label={s} size="small" onClick={() => send(s)} clickable
                      sx={{ fontSize: '0.68rem', fontWeight: 600, bgcolor: `${GOLD}1a`, '&:hover': { bgcolor: `${GOLD}33` } }} />
              ))}
            </Box>
          </Box>
        )}
        {messages.map((m, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <Box sx={{
              maxWidth: '85%', px: 1.3, py: 0.9, borderRadius: 2, whiteSpace: 'pre-wrap',
              fontSize: '0.8rem', lineHeight: 1.45,
              bgcolor: m.role === 'user' ? NAVY : 'action.hover',
              color: m.role === 'user' ? 'white' : 'text.primary',
              borderTopRightRadius: m.role === 'user' ? 4 : 16,
              borderTopLeftRadius: m.role === 'user' ? 16 : 4,
            }}>
              {m.content}
            </Box>
          </Box>
        ))}
        {busy && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CircularProgress size={14} sx={{ color: GOLD }} />
            <Typography sx={{ fontSize: '0.74rem' }}>Thinking…</Typography>
          </Box>
        )}
        <div ref={endRef} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'flex-end' }}>
        <TextField
          size="small" fullWidth multiline maxRows={4} placeholder="Ask a question…"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          sx={{ '& .MuiOutlinedInput-input': { fontSize: '0.82rem' } }}
        />
        <IconButton onClick={() => send()} disabled={busy || !input.trim()}
                    sx={{ bgcolor: GOLD, color: NAVY, '&:hover': { bgcolor: GOLD_DARK }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}>
          <SendIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <Typography sx={{ fontSize: '0.64rem', color: 'text.disabled', mt: 0.8 }}>
        AI can look up any location's zonal value. General guidance only — estimates, not a formal appraisal, financial, or legal advice.
      </Typography>
    </CardContent>
  )
}
