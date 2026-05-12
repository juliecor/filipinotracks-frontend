import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Box, Container, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemText,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import { motion } from 'framer-motion'
import { NAVY, GOLD, GOLD_DARK } from '../../theme/theme'

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (href) => {
    setDrawerOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: scrolled ? 'rgba(10,22,40,0.97)' : 'rgba(10,22,40,0.82)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.3s ease',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.25)' : 'none',
        borderRadius: 0,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ py: 1.2, px: { xs: 0 }, minHeight: { xs: 64, md: 72 } }} disableGutters>

          {/* Logo */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
              onClick={() => navigate('/')}
            >
              <Box sx={{
                width: 42, height: 42, borderRadius: '10px',
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 900, fontSize: '1rem', lineHeight: 1 }}>FT</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', fontSize: '1.05rem' }}>
                  FilipinoTracks
                </Typography>
                <Typography variant="caption" sx={{ color: GOLD, letterSpacing: '0.14em', fontSize: '0.58rem', fontWeight: 700 }}>
                  PROPERTY SOLUTIONS
                </Typography>
              </Box>
            </Box>
          </motion.div>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.5 }}>
            {navLinks.map((link, i) => (
              <motion.div key={link.label} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                <Button
                  onClick={() => scrollTo(link.href)}
                  sx={{
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: '0.92rem',
                    px: 2,
                    fontWeight: 500,
                    '&:hover': { color: GOLD, backgroundColor: 'rgba(201,168,76,0.1)' },
                  }}
                >
                  {link.label}
                </Button>
              </motion.div>
            ))}

            <Box sx={{ width: 1, height: 22, bgcolor: 'rgba(255,255,255,0.18)', mx: 1.5 }} />

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{
                  color: 'rgba(255,255,255,0.9)',
                  borderColor: 'rgba(255,255,255,0.35)',
                  borderWidth: '1.5px',
                  mr: 1.5,
                  px: 2.5,
                  '&:hover': { borderColor: GOLD, color: GOLD, borderWidth: '1.5px', bgcolor: 'rgba(201,168,76,0.08)' },
                }}
              >
                Login
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  background: `linear-gradient(135deg, #E8C96D 0%, ${GOLD} 50%, ${GOLD_DARK} 100%)`,
                  color: NAVY,
                  fontWeight: 700,
                  px: 3,
                  fontSize: '0.92rem',
                  boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                    boxShadow: '0 6px 20px rgba(201,168,76,0.5)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Get Started
              </Button>
            </motion.div>
          </Box>

          {/* Mobile hamburger */}
          <IconButton
            sx={{ display: { md: 'none' }, color: 'white', ml: 1 }}
            onClick={() => setDrawerOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ style: { backgroundColor: NAVY, color: 'white', borderRadius: 0, width: 280 } }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h6" sx={{ color: GOLD, fontWeight: 700 }}>FilipinoTracks</Typography>
            <IconButton sx={{ color: 'white' }} onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List disablePadding>
            {navLinks.map((link) => (
              <ListItem key={link.label} disablePadding>
                <ListItemButton
                  onClick={() => scrollTo(link.href)}
                  sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: 'rgba(201,168,76,0.12)' } }}
                >
                  <ListItemText
                    primary={link.label}
                    sx={{ '& .MuiListItemText-primary': { color: 'rgba(255,255,255,0.88)', fontWeight: 500 } }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 4 }}>
            <Button
              fullWidth variant="outlined"
              onClick={() => { setDrawerOpen(false); navigate('/login') }}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: GOLD, color: GOLD } }}
            >
              Login
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  )
}
