import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Button, TextField, Typography, Alert, CircularProgress,
  InputAdornment, IconButton, Grid, Stepper, Step, StepLabel,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAuth } from '../../context/AuthContext'
import { NAVY, GOLD, NAVY_MID } from '../../theme/theme'

const steps = ['Personal Info', 'Contact Details', 'Create Password']

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '', password_confirmation: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const nextStep = () => { setError(''); setStep(s => s + 1) }
  const prevStep = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.password_confirmation) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/portal/dashboard')
    } catch (err) {
      const errors = err.response?.data?.errors
      setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || 'Registration failed.')
    } finally { setLoading(false) }
  }

  const stepContent = [
    <Box key={0}>
      <TextField label="Full Name" fullWidth margin="normal" required value={form.name} onChange={set('name')}
        InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }} />
      <TextField label="Email Address" type="email" fullWidth margin="normal" required value={form.email} onChange={set('email')}
        InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }} />
    </Box>,
    <Box key={1}>
      <TextField label="Phone Number" fullWidth margin="normal" value={form.phone} onChange={set('phone')} placeholder="+63 9XX XXX XXXX"
        InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }} />
      <TextField label="Complete Address" fullWidth margin="normal" multiline rows={3} value={form.address} onChange={set('address')}
        InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }} />
    </Box>,
    <Box key={2} component="form" onSubmit={handleSubmit}>
      <TextField label="Password" type={showPass ? 'text' : 'password'} fullWidth margin="normal" required value={form.password} onChange={set('password')}
        helperText="Minimum 8 characters"
        InputProps={{
          startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment>,
          endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPass(!showPass)} size="small">{showPass ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}</IconButton></InputAdornment>,
        }} />
      <TextField label="Confirm Password" type="password" fullWidth margin="normal" required value={form.password_confirmation} onChange={set('password_confirmation')}
        InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} /></InputAdornment> }} />
    </Box>,
  ]

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left panel */}
      <Box sx={{
        display: { xs: 'none', lg: 'flex' }, width: '45%', flexDirection: 'column',
        justifyContent: 'center', background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 100%)`,
        position: 'relative', overflow: 'hidden', p: 8,
      }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 8 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h6" sx={{ color: NAVY, fontWeight: 800 }}>FT</Typography>
            </Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>FilipinoTracks</Typography>
          </Box>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 2, lineHeight: 1.2 }}>
            Start Your Property Journey Today
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400, lineHeight: 1.7, mb: 6 }}>
            Create your account and get access to the Philippines' most complete property documentation platform.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {['Free account creation', 'Submit unlimited inquiries', 'Real-time transaction tracking', 'Secure document uploads', '24/7 status monitoring'].map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: NAVY, fontSize: '0.6rem', fontWeight: 800 }}>✓</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{item}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right panel */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: { xs: 3, md: 8 }, bgcolor: 'white', overflowY: 'auto' }}>
        <Box sx={{ width: '100%', maxWidth: 460 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 4, color: '#5A6A85' }}>
            Back to Home
          </Button>

          <Typography variant="h4" sx={{ color: NAVY, fontWeight: 800, mb: 1 }}>Create Account</Typography>
          <Typography variant="body1" sx={{ color: '#5A6A85', mb: 4 }}>Join thousands of Filipinos on FilipinoTracks</Typography>

          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{
                  '& .MuiStepLabel-label': { fontWeight: 600, fontSize: '0.8rem' },
                  '& .MuiStepIcon-root.Mui-active': { color: GOLD },
                  '& .MuiStepIcon-root.Mui-completed': { color: NAVY },
                }}>
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            {step > 0 && (
              <Button variant="outlined" onClick={prevStep} sx={{ flex: 1, py: 1.5 }}>Back</Button>
            )}
            {step < steps.length - 1 ? (
              <Button variant="contained" onClick={nextStep} endIcon={<ArrowForwardIcon />}
                sx={{ flex: 1, py: 1.5, fontWeight: 700, background: `linear-gradient(135deg, ${NAVY_MID} 0%, ${NAVY} 100%)` }}
                disabled={step === 0 && (!form.name || !form.email)}>
                Continue
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit} disabled={loading}
                sx={{ flex: 1, py: 1.5, fontWeight: 700, background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, color: NAVY }}>
                {loading ? <CircularProgress size={24} /> : 'Create Account'}
              </Button>
            )}
          </Box>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: '#5A6A85' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
