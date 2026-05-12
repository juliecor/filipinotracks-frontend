import { Box, Typography, Card } from '@mui/material'
import { motion } from 'framer-motion'
import ChatIcon from '@mui/icons-material/Chat'
import ConstructionIcon from '@mui/icons-material/Construction'
import { NAVY, GOLD } from '../../theme/theme'

export default function MessagesPage() {
  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, #0F2744 55%, #153250 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <ChatIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Messages</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Messages
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              Communicate with your assigned staff and support team
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 800, mx: 'auto' }}>
        <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', overflow: 'hidden', minHeight: 400,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <Box sx={{ display: 'flex', gap: -1, justifyContent: 'center', mb: 3 }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: `${NAVY}10`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChatIcon sx={{ fontSize: 34, color: NAVY }} />
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: NAVY, mb: 1 }}>
              Messaging Coming Soon
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B', maxWidth: 420, mx: 'auto', lineHeight: 1.7 }}>
              Real-time messaging between clients and staff is currently under development.
              You'll be able to chat directly with your assigned staff member in a future update.
            </Typography>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, mt: 3, px: 2, py: 1,
              bgcolor: `${GOLD}12`, borderRadius: 2, border: `1px solid ${GOLD}25` }}>
              <ConstructionIcon sx={{ fontSize: 16, color: GOLD }} />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#A8882A' }}>In Development</Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  )
}
