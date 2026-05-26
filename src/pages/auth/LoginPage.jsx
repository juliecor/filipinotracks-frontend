import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Divider, Stack, Chip, Link as MuiLink,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import { motion, AnimatePresence } from 'framer-motion'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded'
import KeyRoundedIcon from '@mui/icons-material/KeyRounded'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import LoginRoundedIcon from '@mui/icons-material/LoginRounded'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { useAuth } from '../../context/AuthContext'
import { NAVY, NAVY_DEEP, NAVY_LINE, GOLD, GOLD_LIGHT, GOLD_DARK } from '../../theme/theme'
import api from '../../api/axios'

const MotionDiv = motion.div

const BRAND_HIGHLIGHTS = [
  { icon: <ShieldOutlinedIcon fontSize="small" />,    label: 'LRA Accredited Processing' },
  { icon: <BoltRoundedIcon fontSize="small" />,        label: 'Real-Time Transaction Tracking' },
  { icon: <VerifiedRoundedIcon fontSize="small" />,    label: '99.8% Success Rate' },
  { icon: <LandscapeOutlinedIcon fontSize="small" />,  label: 'Nationwide Coverage' },
]

function redirectByRole(role, navigate) {
  if (role === 'admin') navigate('/admin/dashboard')
  else if (role === 'staff' || role === 'agent') navigate('/staff/dashboard')
  else navigate('/portal/dashboard')
}

export default function LoginPage() {
  const [mode, setMode]         = useState('password') // 'password' | 'otp-send' | 'otp-verify'
  const [form, setForm]         = useState({ email: '', password: '' })
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode]   = useState('')
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [notRegisteredDialog, setNotRegisteredDialog] = useState(false)
  const { login, setUserFromToken } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  // ── Password login ──
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      redirectByRole(user?.roles?.[0]?.name, navigate)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  // ── OTP: send code ──
  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/otp/send', { email: otpEmail })
      setInfo(data?.message || 'A 6-digit code has been sent to your email.')
      setMode('otp-verify')
    } catch (err) {
      // Backend returns 404 with not_registered=true when the email is unknown —
      // surface this as a clear popup instead of a generic inline error.
      if (err.response?.status === 404 && err.response?.data?.not_registered) {
        setNotRegisteredDialog(true)
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── OTP: verify code ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/otp/verify', { email: otpEmail, code: otpCode })
      setUserFromToken(data.user, data.token)
      redirectByRole(data.user?.roles?.[0]?.name, navigate)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (m) => { setError(''); setInfo(''); setMode(m) }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* ──────────────────── LEFT: Brand panel ──────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '46%', lg: '50%' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(155deg, ${NAVY_LINE} 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)`,
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          p: { md: 5, lg: 7 },
        }}
      >
        {/* Decorative grid */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 25%, #000 35%, transparent 80%)',
          }}
        />
        {/* Gold orb */}
        <MotionDiv
          animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.6, 0.35] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '-12%', right: '-12%' }}
        >
          <Box sx={{
            width: 460, height: 460, borderRadius: '50%',
            background: `radial-gradient(circle, ${GOLD}45 0%, transparent 70%)`,
            filter: 'blur(4px)',
          }} />
        </MotionDiv>
        {/* Navy bloom bottom-left */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute', bottom: '-18%', left: '-10%',
            width: 480, height: 480, borderRadius: '50%',
            background: `radial-gradient(circle, ${NAVY_LINE}80 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />

        {/* Top row: logo */}
        <Stack direction="row" alignItems="center" spacing={1.75} sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 46, height: 46, borderRadius: 2,
              display: 'grid', placeItems: 'center',
              background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
              color: NAVY, fontWeight: 800, fontSize: 18,
              boxShadow: `0 10px 28px ${GOLD}55`,
            }}
          >
            FT
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.1, fontSize: '1.05rem' }}>
              FilipinoTracks
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', fontSize: '0.65rem', fontWeight: 600 }}>
              PROPERTY · DOCUMENTATION · TRUST
            </Typography>
          </Box>
        </Stack>

        {/* Middle: headline */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
          <Chip
            label="WELCOME BACK"
            size="small"
            sx={{
              mb: 2.5, bgcolor: `${GOLD}1F`, color: GOLD_LIGHT,
              fontWeight: 700, letterSpacing: '0.18em', fontSize: '0.65rem',
              border: `1px solid ${GOLD}40`,
            }}
          />
          <Typography
            sx={{
              fontWeight: 800, lineHeight: 1.12, color: '#fff',
              fontSize: { md: '2.3rem', lg: '2.9rem' },
              letterSpacing: '-0.02em',
            }}
          >
            Your land,{' '}
            <Box component="span" sx={{ color: GOLD_LIGHT }}>documented</Box>
            <br />
            and{' '}
            <Box component="span" sx={{ color: GOLD_LIGHT }}>defended.</Box>
          </Typography>
          <Typography
            sx={{
              mt: 2.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7,
              fontSize: '0.98rem', maxWidth: 460,
            }}
          >
            Sign in to manage your title verifications, boundary surveys, and registration
            filings — all on the Philippines' most trusted property platform.
          </Typography>

          <Stack spacing={1.5} sx={{ mt: 4 }}>
            {BRAND_HIGHLIGHTS.map((item) => (
              <Stack key={item.label} direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'grid', placeItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: GOLD_LIGHT,
                    border: `1px solid ${GOLD}38`,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: '0.92rem' }}>
                  {item.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Footer */}
        <Typography sx={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} FilipinoTracks — Philippine PropTech.
        </Typography>
      </Box>

      {/* ──────────────────── RIGHT: Form panel ──────────────────── */}
      <Box
        sx={(theme) => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 5, md: 6 },
          bgcolor: theme.palette.background.paper,
          position: 'relative',
        })}
      >
        {/* Top-right: back link (always visible) */}
        <MuiLink
          component={RouterLink}
          to="/"
          underline="none"
          sx={(theme) => ({
            position: 'absolute', top: 24, right: 32,
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            color: 'text.secondary', fontSize: '0.85rem', fontWeight: 500,
            '&:hover': { color: theme.palette.mode === 'dark' ? GOLD_LIGHT : GOLD_DARK },
          })}
        >
          <ArrowBackIosNewRoundedIcon sx={{ fontSize: 13 }} />
          Back to Home
        </MuiLink>

        <Box sx={{ width: '100%', maxWidth: 440 }}>
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
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
              FilipinoTracks
            </Typography>
          </Stack>

          <AnimatePresence mode="wait">
            {/* ── Password login ── */}
            {mode === 'password' && (
              <MotionDiv
                key="password"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
              >
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
                  Welcome back
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 4 }}>
                  Sign in to your FilipinoTracks account to continue.
                </Typography>

                {error && (
                  <Alert severity="error" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handlePasswordLogin} noValidate>
                  <Stack spacing={2.25}>
                    <TextField
                      label="Email address"
                      type="email"
                      fullWidth
                      required
                      autoComplete="email"
                      autoFocus
                      value={form.email}
                      onChange={set('email')}
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
                      type={showPass ? 'text' : 'password'}
                      fullWidth
                      required
                      autoComplete="current-password"
                      value={form.password}
                      onChange={set('password')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPass(!showPass)}
                              size="small"
                              edge="end"
                              aria-label={showPass ? 'Hide password' : 'Show password'}
                            >
                              {showPass
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
                      sx={{ py: 1.4, fontSize: '0.95rem', fontWeight: 700 }}
                    >
                      {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
                    </Button>
                  </Stack>
                </Box>

                <Divider sx={{ my: 3.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', px: 1, letterSpacing: '0.15em', fontWeight: 600 }}>
                    OR
                  </Typography>
                </Divider>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<KeyRoundedIcon />}
                  onClick={() => switchMode('otp-send')}
                  sx={{
                    py: 1.3, fontWeight: 700,
                    borderColor: `${GOLD}66`,
                    color: GOLD_DARK,
                    '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}0F` },
                    '.MuiButton-startIcon svg': { color: GOLD },
                  }}
                >
                  Login with Email OTP
                </Button>

                <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 3.5 }}>
                  Don't have an account?{' '}
                  <MuiLink
                    component={RouterLink}
                    to="/register"
                    underline="none"
                    sx={{ color: GOLD_DARK, fontWeight: 700, '&:hover': { color: GOLD } }}
                  >
                    Create one free
                  </MuiLink>
                </Typography>
              </MotionDiv>
            )}

            {/* ── OTP: enter email ── */}
            {mode === 'otp-send' && (
              <MotionDiv
                key="otp-send"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: 2,
                      display: 'grid', placeItems: 'center',
                      background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                      color: NAVY,
                      boxShadow: `0 8px 24px ${GOLD}44`,
                    }}
                  >
                    <KeyRoundedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800 }}>
                    Login with OTP
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 4 }}>
                  Enter your registered email and we'll send you a 6-digit login code.
                </Typography>

                {error && (
                  <Alert severity="error" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSendOtp} noValidate>
                  <Stack spacing={2.25}>
                    <TextField
                      label="Registered email address"
                      type="email"
                      fullWidth
                      required
                      autoFocus
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
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
                      sx={{
                        py: 1.4, fontSize: '0.95rem', fontWeight: 700,
                        background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                        color: NAVY,
                        '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
                      }}
                    >
                      {loading ? <CircularProgress size={22} sx={{ color: NAVY }} /> : 'Send Login Code'}
                    </Button>
                  </Stack>
                </Box>

                <Button
                  fullWidth
                  onClick={() => switchMode('password')}
                  startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />}
                  sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}
                >
                  Back to Password Login
                </Button>
              </MotionDiv>
            )}

            {/* ── OTP: enter code ── */}
            {mode === 'otp-verify' && (
              <MotionDiv
                key="otp-verify"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: 2,
                      display: 'grid', placeItems: 'center',
                      background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                      color: NAVY,
                      boxShadow: `0 8px 24px ${GOLD}44`,
                    }}
                  >
                    <MarkEmailReadOutlinedIcon sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800 }}>
                    Enter your code
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  We sent a 6-digit code to
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 700, mb: 3.5 }}>
                  {otpEmail}
                </Typography>

                {info && (
                  <Alert severity="success" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {info}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleVerifyOtp} noValidate>
                  <TextField
                    label="6-Digit Code"
                    fullWidth
                    required
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputProps={{
                      maxLength: 6,
                      inputMode: 'numeric',
                      style: {
                        fontSize: '1.9rem',
                        fontWeight: 800,
                        letterSpacing: '0.55em',
                        textAlign: 'center',
                        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
                        paddingLeft: '0.55em',
                      },
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || otpCode.length !== 6}
                    sx={{
                      mt: 2.5, py: 1.4, fontSize: '0.95rem', fontWeight: 700,
                      background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                      color: NAVY,
                      '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
                      '&.Mui-disabled': { background: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.35)' },
                    }}
                  >
                    {loading ? <CircularProgress size={22} sx={{ color: NAVY }} /> : 'Verify & Sign In'}
                  </Button>
                </Box>

                <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
                  <Button
                    onClick={() => switchMode('otp-send')}
                    startIcon={<ArrowBackIosNewRoundedIcon sx={{ fontSize: 14 }} />}
                    sx={{ color: 'text.secondary', fontWeight: 600 }}
                  >
                    Change Email
                  </Button>
                  <Button
                    onClick={handleSendOtp}
                    disabled={loading}
                    sx={{ color: GOLD_DARK, fontWeight: 700, '&:hover': { color: GOLD } }}
                  >
                    Resend Code
                  </Button>
                </Stack>
              </MotionDiv>
            )}
          </AnimatePresence>

          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', mt: 4 }}
          >
            Protected by enterprise-grade encryption.
          </Typography>
        </Box>
      </Box>

      {/* ── Email not registered dialog ── */}
      <Dialog
        open={notRegisteredDialog}
        onClose={() => setNotRegisteredDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: (theme) => ({
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 24px 60px rgba(0,0,0,0.55)'
              : '0 24px 60px rgba(10,22,40,0.18)',
          }),
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(10,22,40,0.55)',
          },
        }}
      >
        {/* Header: soft gold-tinted band with the alert icon */}
        <Box
          sx={(theme) => ({
            position: 'relative',
            px: 3,
            pt: 4,
            pb: 3,
            textAlign: 'center',
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(180deg, ${GOLD}14 0%, transparent 100%)`
              : `linear-gradient(180deg, ${GOLD}1A 0%, #FFFFFF 100%)`,
            overflow: 'hidden',
          })}
        >
          {/* Decorative arc */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: -90,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 280,
              height: 180,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          <MotionDiv
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ position: 'relative' }}
          >
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                mx: 'auto',
                mb: 2,
                background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                color: NAVY,
                boxShadow: `0 10px 28px ${GOLD}55, inset 0 1px 0 rgba(255,255,255,0.4)`,
              }}
            >
              <PersonOffOutlinedIcon sx={{ fontSize: 34 }} />
            </Box>
          </MotionDiv>

          <Typography
            sx={{ color: 'text.primary', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.01em' }}
          >
            Email not registered
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', mt: 0.75, lineHeight: 1.6 }}>
            We couldn't find a FilipinoTracks account for:
          </Typography>

          <Chip
            label={otpEmail}
            size="small"
            sx={(theme) => ({
              mt: 1.5,
              maxWidth: '100%',
              height: 'auto',
              py: 0.75,
              px: 0.5,
              fontWeight: 700,
              fontSize: '0.82rem',
              fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
              color: theme.palette.mode === 'dark' ? GOLD_LIGHT : GOLD_DARK,
              bgcolor: theme.palette.mode === 'dark' ? `${GOLD}1A` : `${GOLD}14`,
              border: `1px solid ${GOLD}40`,
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                wordBreak: 'break-all',
                px: 1.25,
              },
            })}
          />
        </Box>

        <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Typography
            sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.7, textAlign: 'center' }}
          >
            No login code was sent. Create a free account, or double-check your email for typos.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 2,
            gap: 1.25,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
          }}
        >
          <Button
            fullWidth
            onClick={() => setNotRegisteredDialog(false)}
            sx={{
              py: 1.1,
              color: 'text.secondary',
              fontWeight: 600,
              borderRadius: 2,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Try different email
          </Button>
          <Button
            fullWidth
            variant="contained"
            startIcon={<PersonAddOutlinedIcon />}
            onClick={() => {
              setNotRegisteredDialog(false)
              navigate('/register', { state: { email: otpEmail } })
            }}
            sx={{
              py: 1.1,
              fontWeight: 800,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
              color: NAVY,
              boxShadow: `0 8px 20px ${GOLD}44`,
              '&:hover': {
                background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                boxShadow: `0 10px 24px ${GOLD}55`,
              },
            }}
          >
            Create Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
