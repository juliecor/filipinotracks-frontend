import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Stack, Divider, Link as MuiLink,
} from '@mui/material'
import { motion } from 'framer-motion'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import { useAuth } from '../context/AuthContext'
import { NAVY, NAVY_DEEP, NAVY_LINE, GOLD, GOLD_LIGHT } from '../theme/theme'

const MotionBox = motion(Box)

const BRAND_HIGHLIGHTS = [
  { icon: <LandscapeOutlinedIcon fontSize="small" />, text: 'Land titles & boundary mapping' },
  { icon: <ShieldOutlinedIcon fontSize="small" />, text: 'Bank-grade document security' },
  { icon: <VerifiedRoundedIcon fontSize="small" />, text: 'Verified registry of properties' },
]

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#F4F6FB',
        position: 'relative',
        overflow: 'hidden',
      })}
    >
      {/* Subtle ambient background blobs */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage:
            `radial-gradient(60% 50% at 15% 10%, ${GOLD}10 0%, transparent 60%),` +
            `radial-gradient(50% 40% at 85% 90%, ${NAVY}12 0%, transparent 60%)`,
        }}
      />

      {/* ───── Left: brand panel ───── */}
      <MotionBox
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1.05,
          position: 'relative',
          color: '#fff',
          background: `linear-gradient(155deg, ${NAVY_LINE} 0%, ${NAVY} 45%, ${NAVY_DEEP} 100%)`,
          p: { md: 6, lg: 8 },
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }}
      >
        {/* Decorative grid + glow */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'radial-gradient(ellipse at 30% 30%, #000 40%, transparent 75%)',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -120, right: -120, width: 360, height: 360,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}40 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: -160, left: -80, width: 420, height: 420,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${NAVY_LINE}80 0%, transparent 70%)`,
            filter: 'blur(10px)',
          }}
        />

        {/* Top: logo + back link */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 42, height: 42, borderRadius: 2,
                display: 'grid', placeItems: 'center',
                background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                color: NAVY, fontWeight: 800,
                boxShadow: `0 8px 24px ${GOLD}55`,
              }}
            >
              FT
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                FilipinoTracks
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em' }}>
                PROPERTY · DOCUMENTATION · TRUST
              </Typography>
            </Box>
          </Stack>

          <MuiLink
            component={RouterLink}
            to="/"
            underline="none"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5,
              color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', fontWeight: 500,
              '&:hover': { color: GOLD_LIGHT },
            }}
          >
            <ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />
            Back to site
          </MuiLink>
        </Stack>

        {/* Middle: headline */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          <Typography
            variant="overline"
            sx={{ color: GOLD_LIGHT, fontWeight: 700, letterSpacing: '0.2em', fontSize: '0.7rem' }}
          >
            Welcome back
          </Typography>
          <Typography
            variant="h3"
            sx={{ mt: 1.5, fontWeight: 800, lineHeight: 1.15, fontSize: { md: '2.4rem', lg: '2.8rem' } }}
          >
            Your land,{' '}
            <Box component="span" sx={{ color: GOLD_LIGHT }}>documented</Box> and{' '}
            <Box component="span" sx={{ color: GOLD_LIGHT }}>defended.</Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 2.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, maxWidth: 440 }}
          >
            Sign in to track title verifications, boundary surveys, and registration filings —
            all from one secure dashboard built for Philippine property owners.
          </Typography>

          <Stack spacing={1.5} sx={{ mt: 4 }}>
            {BRAND_HIGHLIGHTS.map((item) => (
              <Stack key={item.text} direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: GOLD_LIGHT,
                    border: `1px solid ${GOLD}40`,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                  {item.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Bottom: footnote */}
        <Typography
          variant="caption"
          sx={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.45)' }}
        >
          © {new Date().getFullYear()} FilipinoTracks. All rights reserved.
        </Typography>
      </MotionBox>

      {/* ───── Right: form panel ───── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 5 },
          py: { xs: 4, md: 6 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <MotionBox
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          sx={{ width: '100%', maxWidth: 440 }}
        >
          {/* Mobile-only brand mark */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ display: { xs: 'flex', md: 'none' }, mb: 4, justifyContent: 'center' }}
          >
            <Box
              sx={{
                width: 40, height: 40, borderRadius: 2,
                display: 'grid', placeItems: 'center',
                background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                color: NAVY, fontWeight: 800,
              }}
            >
              FT
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              FilipinoTracks
            </Typography>
          </Stack>

          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Sign in to your account
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 4 }}>
            Enter your credentials to continue managing your property documents.
          </Typography>

          {error && (
            <Alert severity="error" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.25}>
              <TextField
                label="Email address"
                type="email"
                fullWidth
                required
                autoComplete="email"
                autoFocus
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword
                          ? <VisibilityOffOutlinedIcon sx={{ fontSize: 20 }} />
                          : <VisibilityOutlinedIcon sx={{ fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={!loading && <LoginRoundedIcon />}
                sx={{
                  mt: 0.5,
                  py: 1.4,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign in'}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 4, '&::before, &::after': { borderColor: 'divider' } }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
              NEW HERE?
            </Typography>
          </Divider>

          <Button
            component={RouterLink}
            to="/register"
            fullWidth
            variant="outlined"
            size="large"
            sx={{ py: 1.3, fontWeight: 600 }}
          >
            Create an account
          </Button>

          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 4 }}
          >
            Protected by enterprise-grade encryption. By signing in you agree to our
            {' '}terms of service.
          </Typography>
        </MotionBox>
      </Box>
    </Box>
  )
}
