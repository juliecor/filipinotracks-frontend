import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, TextField, Typography, Alert, CircularProgress,
} from '@mui/material'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
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
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
      <Card sx={{ width: '100%', maxWidth: 420, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" color="primary" mb={1}>
            FilipinoTracks
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Property Documentation & Registration
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email" type="email" fullWidth margin="normal" required
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <TextField
              label="Password" type="password" fullWidth margin="normal" required
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </Box>
          <Typography variant="body2" textAlign="center" mt={2}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'inherit', fontWeight: 600 }}>Register</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
