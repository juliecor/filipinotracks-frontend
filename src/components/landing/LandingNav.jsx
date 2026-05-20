import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Box, Container, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemText, Avatar, Tooltip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import DashboardIcon from '@mui/icons-material/Dashboard'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { motion } from 'framer-motion'
import { NAVY, GOLD, GOLD_DARK } from '../../theme/theme'
import { useAuth } from '../../context/AuthContext'
import { useColorMode } from '../../context/ColorModeContext'

const navLinks = [
  { label: 'Services', href: '#services' },
  { label: 'Properties', path: '/properties' },
  { label: 'Process', href: '#process' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { mode, toggleMode } = useColorMode()

  const dashboardPath = user?.roles?.[0]?.name === 'admin'
    ? '/admin/dashboard'
    : user?.roles?.[0]?.name === 'staff'
    ? '/staff/dashboard'
    : '/portal/dashboard'

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

  const handleNavClick = (link) => {
    setDrawerOpen(false)
    if (link.path) {
      navigate(link.path)
    } else if (link.href) {
      // If we're on the landing page, just scroll. Otherwise navigate home
      // with the hash and let LandingPage scroll on mount.
      if (location.pathname === '/') scrollTo(link.href)
      else navigate('/' + link.href)
    }
  }

  const isDark = mode === 'dark'

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: isDark
          ? (scrolled ? 'rgba(11,20,36,0.96)' : 'rgba(11,20,36,0.85)')
          : (scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)'),
        backdropFilter: 'blur(20px)',
        borderBottom: 1,
        borderColor: 'divider',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
        boxShadow: scrolled
          ? (isDark ? '0 2px 20px rgba(0,0,0,0.5)' : '0 2px 20px rgba(10,22,40,0.08)')
          : 'none',
        borderRadius: 0,
        color: 'text.primary',
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
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', fontSize: '1.75rem' }}>
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
                  onClick={() => handleNavClick(link)}
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.92rem',
                    px: 2,
                    fontWeight: 500,
                    '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' },
                  }}
                >
                  {link.label}
                </Button>
              </motion.div>
            ))}

            <Box sx={{ width: 1, height: 22, bgcolor: 'divider', mx: 1.5 }} />

            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton
                onClick={toggleMode}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                sx={{
                  color: isDark ? GOLD : 'text.primary',
                  mr: 1,
                  bgcolor: isDark ? 'rgba(201,162,74,0.12)' : 'action.hover',
                  '&:hover': { bgcolor: isDark ? 'rgba(201,162,74,0.2)' : 'action.selected' },
                }}
              >
                {isDark
                  ? <LightModeIcon sx={{ fontSize: 20 }} />
                  : <DarkModeIcon  sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            {user ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar
                  src={user.profile_picture_url || undefined}
                  sx={{ width: 36, height: 36, bgcolor: GOLD, color: NAVY, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)' }}
                  onClick={() => navigate(dashboardPath)}
                >
                  {!user.profile_picture_url && user.name?.charAt(0)}
                </Avatar>
                <Button
                  variant="contained"
                  startIcon={<DashboardIcon sx={{ fontSize: '1rem !important' }} />}
                  onClick={() => navigate(dashboardPath)}
                  sx={{
                    background: `linear-gradient(135deg, #E8C96D 0%, ${GOLD} 50%, ${GOLD_DARK} 100%)`,
                    color: NAVY, fontWeight: 700, px: 2.5, fontSize: '0.88rem',
                    boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
                    '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, boxShadow: '0 6px 20px rgba(201,168,76,0.5)', transform: 'translateY(-1px)' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Dashboard
                </Button>
              </motion.div>
            ) : (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/login')}
                    sx={{
                      color: 'text.primary', borderColor: 'divider', borderWidth: '1.5px', mr: 1.5, px: 2.5,
                      '&:hover': { borderColor: 'text.primary', color: 'text.primary', borderWidth: '1.5px', bgcolor: 'action.hover' },
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
                      color: NAVY, fontWeight: 700, px: 3, fontSize: '0.92rem',
                      boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
                      '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`, boxShadow: '0 6px 20px rgba(201,168,76,0.5)', transform: 'translateY(-1px)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Get Started
                  </Button>
                </motion.div>
              </>
            )}
          </Box>

          {/* Mobile-only theme toggle + hamburger */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5, ml: 'auto' }}>
            <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <IconButton
                onClick={toggleMode}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                sx={{ color: isDark ? GOLD : 'text.primary' }}
              >
                {isDark
                  ? <LightModeIcon sx={{ fontSize: 22 }} />
                  : <DarkModeIcon  sx={{ fontSize: 22 }} />}
              </IconButton>
            </Tooltip>
            <IconButton
              aria-label="Open navigation menu"
              sx={{ color: 'text.primary' }}
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
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
            <IconButton sx={{ color: 'white' }} aria-label="Close navigation menu" onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List disablePadding>
            {navLinks.map((link) => (
              <ListItem key={link.label} disablePadding>
                <ListItemButton
                  onClick={() => handleNavClick(link)}
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
