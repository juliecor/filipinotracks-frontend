import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Divider,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import KeyIcon from '@mui/icons-material/Key'
import { useAuth } from '../../context/AuthContext'
import { NAVY, GOLD, NAVY_MID } from '../../theme/theme'
import api from '../../api/axios'

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
    setLoading(true)
    try {
      await api.post('/auth/otp/send', { email: otpEmail })
      setInfo('A 6-digit code has been sent to your email.')
      setMode('otp-verify')
    } catch {
      setError('Something went wrong. Please try again.')
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
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel */}
      <Box sx={{
        display: { xs: 'none', lg: 'flex' }, width: '50%', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 100%)`,
        position: 'relative', overflow: 'hidden', p: 8,
      }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }}>
          <Box sx={{ position: 'absolute', top: '-15%', right: '-15%', width: 450, height: 450, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD}25 0%, transparent 70%)` }} />
        </motion.div>
        <Box sx={{ position: 'relative', textAlign: 'center', maxWidth: 420 }}>
          <Box sx={{ width: 72, height: 72, borderRadius: 3, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Typography variant="h4" sx={{ color: NAVY, fontWeight: 800 }}>FT</Typography>
          </Box>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>FilipinoTracks</Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400, lineHeight: 1.7 }}>
            Philippine Property Documentation & Land Transaction Platform
          </Typography>
          <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {['LRA Accredited Processing', 'Real-Time Transaction Tracking', '99.8% Success Rate', 'Nationwide Coverage'].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: `${GOLD}25`, border: `1px solid ${GOLD}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD }} />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right panel */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 3, md: 8 }, bgcolor: 'white' }}>
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 4, color: '#5A6A85', fontWeight: 500 }}>
            Back to Home
          </Button>

          <AnimatePresence mode="wait">
            {/* ── Password login ── */}
            {mode === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Typography variant="h4" sx={{ color: NAVY, fontWeight: 800, mb: 1 }}>Welcome back</Typography>
                <Typography variant="body1" sx={{ color: '#5A6A85', mb: 4 }}>Sign in to your FilipinoTracks account</Typography>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handlePasswordLogin}>
                  <TextField
                    label="Email Address" type="email" fullWidth margin="normal" required
                    value={form.email} onChange={set('email')}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }}
                  />
                  <TextField
                    label="Password" type={showPass ? 'text' : 'password'} fullWidth margin="normal" required
                    value={form.password} onChange={set('password')}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPass(!showPass)} size="small">
                            {showPass ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                    sx={{ mt: 3, py: 1.8, fontSize: '1rem', fontWeight: 700, background: `linear-gradient(135deg, ${NAVY_MID} 0%, ${NAVY} 100%)` }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }}><Typography variant="caption" sx={{ color: '#94A3B8' }}>or</Typography></Divider>

                <Button fullWidth variant="outlined" size="large" startIcon={<KeyIcon />}
                  onClick={() => switchMode('otp-send')}
                  sx={{ py: 1.6, fontWeight: 700, borderColor: `${GOLD}60`, color: '#A8882A',
                    '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}08` } }}>
                  Login with Email OTP
                </Button>

                <Typography variant="body2" sx={{ textAlign: 'center', color: '#5A6A85', mt: 3 }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
                </Typography>
              </motion.div>
            )}

            {/* ── OTP: enter email ── */}
            {mode === 'otp-send' && (
              <motion.div key="otp-send" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KeyIcon sx={{ color: NAVY, fontSize: 22 }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: NAVY, fontWeight: 800 }}>Login with OTP</Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#5A6A85', mb: 4 }}>
                  Enter your registered email and we'll send you a 6-digit login code.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSendOtp}>
                  <TextField
                    label="Registered Email Address" type="email" fullWidth required
                    value={otpEmail} onChange={e => setOtpEmail(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                    sx={{ mt: 3, py: 1.8, fontSize: '1rem', fontWeight: 700, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, color: NAVY }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Send Login Code'}
                  </Button>
                </Box>

                <Button fullWidth onClick={() => switchMode('password')} startIcon={<ArrowBackIcon />}
                  sx={{ mt: 2, color: '#64748B', fontWeight: 600 }}>
                  Back to Password Login
                </Button>
              </motion.div>
            )}

            {/* ── OTP: enter code ── */}
            {mode === 'otp-verify' && (
              <motion.div key="otp-verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <KeyIcon sx={{ color: NAVY, fontSize: 22 }} />
                  </Box>
                  <Typography variant="h5" sx={{ color: NAVY, fontWeight: 800 }}>Enter Your Code</Typography>
                </Box>
                <Typography variant="body1" sx={{ color: '#5A6A85', mb: 1 }}>
                  We sent a 6-digit code to:
                </Typography>
                <Typography variant="body1" sx={{ color: NAVY, fontWeight: 700, mb: 4 }}>{otpEmail}</Typography>

                {info && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{info}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleVerifyOtp}>
                  <TextField
                    label="6-Digit Code" fullWidth required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputProps={{ maxLength: 6, style: { fontSize: '2rem', fontWeight: 800, letterSpacing: '0.5em', textAlign: 'center', fontFamily: 'monospace' } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large"
                    disabled={loading || otpCode.length !== 6}
                    sx={{ mt: 3, py: 1.8, fontSize: '1rem', fontWeight: 700, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, color: NAVY }}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Sign In'}
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button onClick={() => switchMode('otp-send')} startIcon={<ArrowBackIcon />}
                    sx={{ color: '#64748B', fontWeight: 600 }}>
                    Change Email
                  </Button>
                  <Button onClick={handleSendOtp} disabled={loading}
                    sx={{ color: GOLD, fontWeight: 700 }}>
                    Resend Code
                  </Button>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  )
}
