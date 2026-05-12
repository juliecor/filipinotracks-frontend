import { useNavigate } from 'react-router-dom'
import { Box, Typography, Button, Container, Chip, Stack } from '@mui/material'
import { motion } from 'framer-motion'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import VerifiedIcon from '@mui/icons-material/Verified'
import SpeedIcon from '@mui/icons-material/Speed'
import SecurityIcon from '@mui/icons-material/Security'
import DescriptionIcon from '@mui/icons-material/Description'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import { NAVY, GOLD, GOLD_LIGHT, NAVY_MID } from '../../theme/theme'

const heroServices = [
  { icon: <DescriptionIcon />, title: 'Title Verification', desc: 'Check title records and ownership details before moving forward.' },
  { icon: <AssignmentTurnedInIcon />, title: 'Title Transfer', desc: 'Prepare, submit, and track transfer requirements in one flow.' },
  { icon: <AccountBalanceIcon />, title: 'Tax & Registration', desc: 'Handle declarations, registration papers, and local requirements.' },
  { icon: <SupportAgentIcon />, title: 'Document Support', desc: 'Get guided help for property paperwork and follow-ups.' },
]

export default function Hero() {
  const navigate = useNavigate()

  return (
    <Box sx={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NAVY} 0%, #0D2045 40%, ${NAVY_MID} 100%)`,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Animated background orbs */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }}>
          <Box sx={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)` }} />
        </motion.div>
        <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}>
          <Box sx={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, #3B82F622 0%, transparent 70%)` }} />
        </motion.div>
        {/* Grid pattern */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </Box>

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: 12, pb: 8 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 680px) minmax(360px, 480px)' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: { xs: 6, lg: 10 },
        }}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Chip
                label="🇵🇭  Philippine Property Documentation Platform"
                sx={{ mb: 3, bgcolor: 'rgba(201,168,76,0.15)', color: GOLD_LIGHT, border: '1px solid rgba(201,168,76,0.3)', fontWeight: 600, fontSize: '0.8rem', px: 1 }}
              />
              <Typography variant="h1" sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                color: 'white', mb: 3, lineHeight: 1.1,
              }}>
                Your Property.{' '}
                <Box component="span" sx={{ color: GOLD }}>Documented.</Box>{' '}
                <Box component="span" sx={{ color: 'rgba(255,255,255,0.9)' }}>Secured.</Box>
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 5, fontWeight: 400, lineHeight: 1.8, maxWidth: 520 }}>
                The Philippines' most trusted land documentation platform. Verify titles, process transfers, and manage your property transactions — all in one place.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={6}>
                <Button
                  variant="contained" color="secondary" size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/register')}
                  sx={{ fontSize: '1rem', py: 1.5, px: 4, fontWeight: 700 }}
                >
                  Start Your Transaction
                </Button>
                <Button
                  variant="outlined" size="large"
                  onClick={() => document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', fontSize: '1rem', py: 1.5, px: 4, '&:hover': { borderColor: GOLD, color: GOLD } }}
                >
                  View Services
                </Button>
              </Stack>

              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                {[
                  { icon: <VerifiedIcon />, text: 'LRA Accredited' },
                  { icon: <SpeedIcon />, text: 'Fast Processing' },
                  { icon: <SecurityIcon />, text: 'Secure & Trusted' },
                ].map((item) => (
                  <Box key={item.text} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.7)' }}>
                    <Box sx={{ color: GOLD, display: 'flex', fontSize: '1rem' }}>{item.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.text}</Typography>
                  </Box>
                ))}
              </Stack>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 36 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            <Box sx={{
              width: '100%',
              borderRadius: 2.5,
              p: { xs: 2.5, md: 3 },
              background: 'rgba(255,255,255,0.065)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 70px rgba(0,0,0,0.22)',
              backdropFilter: 'blur(14px)',
            }}>
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: GOLD_LIGHT, fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1 }}>
                  What We Handle
                </Typography>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1.55rem', md: '1.8rem' }, lineHeight: 1.25 }}>
                  Property paperwork, organized from request to release.
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {heroServices.map((service) => (
                  <Box key={service.title} sx={{
                    display: 'grid',
                    gridTemplateColumns: '42px 1fr',
                    gap: 1.5,
                    alignItems: 'start',
                    p: 1.5,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.055)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <Box sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: GOLD,
                      background: 'rgba(201,168,76,0.14)',
                    }}>
                      {service.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 700, mb: 0.4, fontSize: '0.95rem' }}>{service.title}</Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.62)', lineHeight: 1.6, fontSize: '0.82rem' }}>{service.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Container>
    </Box>
  )
}
