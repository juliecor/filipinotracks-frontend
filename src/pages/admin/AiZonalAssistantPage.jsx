import { Box, Paper, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { motion } from 'framer-motion'
import { GOLD, GOLD_DARK, NAVY } from '../../theme/theme'
import ZonalAssistant from '../../components/ZonalAssistant'

const GOLD_GRADIENT = `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`

/**
 * Standalone AI assistant page — ask anything about Philippine zonal values,
 * market value, transfer taxes, land classification, and best/business use, for
 * any location. The conversation is remembered (localStorage).
 */
export default function AiZonalAssistantPage() {
  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default', minHeight: 'calc(100vh - 56px)', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: 420, height: 420, pointerEvents: 'none', zIndex: 0, background: `radial-gradient(circle at 70% 20%, ${GOLD}14 0%, transparent 60%)` }} />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 920, mx: 'auto' }}>
        {/* Hero */}
        <Paper elevation={0} sx={{
          p: { xs: 2.5, md: 3 }, mb: 3, borderRadius: 4, color: 'white', position: 'relative', overflow: 'hidden',
          background: `linear-gradient(135deg, ${NAVY} 0%, #0B1A30 45%, #05080F 100%)`, border: '1px solid rgba(201,162,74,0.22)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component={motion.div}
              animate={{ boxShadow: [`0 0 0 0 ${GOLD}55`, `0 0 0 14px ${GOLD}00`] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
              sx={{ width: 52, height: 52, borderRadius: 2.5, background: GOLD_GRADIENT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <AutoAwesomeIcon sx={{ color: NAVY, fontSize: 28 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: GOLD, letterSpacing: '0.2em' }}>AI ZONAL ASSISTANT</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.15, mt: 0.3 }}>
                Ask anything about property value, taxes & best use
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', mt: 0.4 }}>
                Zonal values nationwide · market estimates · transfer-tax math · suitable business use — for any location.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Assistant */}
        <Paper elevation={0} sx={(t) => ({
          borderRadius: 4, border: '1px solid', borderColor: t.palette.mode === 'dark' ? 'rgba(201,162,74,0.18)' : 'rgba(10,22,40,0.07)',
          bgcolor: t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'background.paper',
          boxShadow: t.palette.mode === 'dark' ? '0 18px 50px -28px rgba(0,0,0,0.8)' : '0 18px 50px -32px rgba(10,22,40,0.35)',
        })}>
          <ZonalAssistant messagesMaxHeight="min(60vh, 560px)" />
        </Paper>
      </Box>
    </Box>
  )
}
