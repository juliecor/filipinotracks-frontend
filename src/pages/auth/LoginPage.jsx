import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Divider, Chip,
} from '@mui/material'
import { motion } from 'framer-motion'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '../../context/AuthContext'
import { NAVY, GOLD, NAVY_MID } from '../../theme/theme'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      const role = user?.roles?.[0]?.name
      if (role === 'admin') navigate('/admin/dashboard')
      else if (role === 'staff') navigate('/staff/dashboard')
      else navigate('/portal/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

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

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Typography variant="h4" sx={{ color: NAVY, fontWeight: 800, mb: 1 }}>Welcome back</Typography>
            <Typography variant="body1" sx={{ color: '#5A6A85', mb: 4 }}>
              Sign in to your FilipinoTracks account
            </Typography>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
              </motion.div>
            )}

            <Box component="form" onSubmit={handleSubmit}>
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
              <Box sx={{ textAlign: 'right', mt: 1, mb: 3 }}>
                <Link to="/forgot-password" style={{ color: GOLD, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </Box>
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                sx={{ py: 1.8, fontSize: '1rem', fontWeight: 700, background: `linear-gradient(135deg, ${NAVY_MID} 0%, ${NAVY} 100%)` }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 3 }}><Typography variant="caption" sx={{ color: '#94A3B8' }}>or</Typography></Divider>

            <Typography variant="body2" sx={{ textAlign: 'center', color: '#5A6A85' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
            </Typography>
          </motion.div>
        </Box>
      </Box>
    </Box>
  )
}
