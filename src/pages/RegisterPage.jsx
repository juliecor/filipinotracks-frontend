import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, TextField, Typography, Alert, CircularProgress,
} from '@mui/material'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) setError(Object.values(errors).flat().join(' '))
      else setError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', py: 4 }}>
      <Card sx={{ width: '100%', maxWidth: 480, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" color="primary" mb={1}>Create Account</Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>FilipinoTracks — Property Documentation</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField label="Full Name" fullWidth margin="normal" required value={form.name} onChange={set('name')} />
            <TextField label="Email" type="email" fullWidth margin="normal" required value={form.email} onChange={set('email')} />
            <TextField label="Phone" fullWidth margin="normal" value={form.phone} onChange={set('phone')} />
            <TextField label="Address" fullWidth margin="normal" multiline rows={2} value={form.address} onChange={set('address')} />
            <TextField label="Password" type="password" fullWidth margin="normal" required value={form.password} onChange={set('password')} />
            <TextField label="Confirm Password" type="password" fullWidth margin="normal" required value={form.password_confirmation} onChange={set('password_confirmation')} />
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </Box>
          <Typography variant="body2" textAlign="center" mt={2}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'inherit', fontWeight: 600 }}>Login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
