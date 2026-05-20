import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box, Container, Typography, Chip, Button, IconButton } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { useAuth } from '../context/AuthContext'
import ChatWidget from '../components/chat/ChatWidget'
import LandingNav from '../components/landing/LandingNav'
import Hero from '../components/landing/Hero'
import Services from '../components/landing/Services'
import Process from '../components/landing/Process'
import About from '../components/landing/About'
import Testimonials from '../components/landing/Testimonials'
import FAQ from '../components/landing/FAQ'
import Contact from '../components/landing/Contact'
import LandingFooter from '../components/landing/LandingFooter'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK } from '../theme/theme'

function CTASection() {
  const navigate = useNavigate()
  return (
    <Box sx={(theme) => ({
      py: { xs: 10, md: 14 },
      background: theme.palette.mode === 'dark'
        ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`
        : `linear-gradient(135deg, #F0F4FF 0%, #FFF8E8 100%)`,
    })}>
      <Container maxWidth="md">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label="GET STARTED TODAY"
              sx={{ mb: 3, bgcolor: `${GOLD}18`, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.7rem' }}
            />
            <Typography variant="h2" sx={{ color: 'text.primary', mb: 3, fontSize: { xs: '2rem', md: '3rem' } }}>
              Ready to Process Your<br />Property Documents?
            </Typography>
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, mb: 5, lineHeight: 1.7 }}>
              Join thousands of Filipinos who trust FilipinoTracks for their property documentation needs. Start your transaction today.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained" color="primary" size="large"
                onClick={() => navigate('/register')}
                sx={{ py: 1.8, px: 5, fontSize: '1rem', fontWeight: 700 }}
              >
                Create Free Account
              </Button>
              <Button
                variant="outlined" color="primary" size="large"
                onClick={() => navigate('/login')}
                sx={{ py: 1.8, px: 5, fontSize: '1rem' }}
              >
                Sign In
              </Button>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

function ScrollToTop({ offset = false }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 16 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ position: 'fixed', bottom: offset ? 92 : 36, right: 32, zIndex: 1200 }}
        >
          <IconButton
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
            sx={{
              width: 52, height: 52,
              background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, ${GOLD_DARK} 100%)`,
              color: NAVY,
              boxShadow: '0 6px 22px rgba(201,168,76,0.45)',
              border: `2px solid rgba(255,255,255,0.25)`,
              '&:hover': {
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                boxShadow: '0 10px 30px rgba(201,168,76,0.55)',
                transform: 'translateY(-3px)',
              },
              transition: 'all 0.25s ease',
            }}
          >
            <KeyboardArrowUpIcon sx={{ fontSize: 28, fontWeight: 900 }} />
          </IconButton>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function LandingPage() {
  const { user } = useAuth()
  const location = useLocation()

  // Scroll to hash when arriving from another route (e.g. /properties → /#process)
  useEffect(() => {
    if (!location.hash) return
    const id = setTimeout(() => {
      const el = document.querySelector(location.hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(id)
  }, [location.hash])

  return (
    <Box sx={{ width: '100%' }}>
      <LandingNav />
      <Hero />
      <Services />
      <Process />
      <About />
      <Testimonials />
      <CTASection />
      <FAQ />
      <Contact />
      <LandingFooter />
      <ScrollToTop offset={!!user} />
      {user && <ChatWidget />}
    </Box>
  )
}
