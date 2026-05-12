import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid, Card, CardContent, CardActionArea, Typography, Box, CircularProgress,
} from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ArticleIcon from '@mui/icons-material/Article'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const services = [
  { label: 'Title Verification', path: '/title-verifications', icon: <VerifiedIcon sx={{ fontSize: 48 }} />, endpoint: 'title-verifications', color: '#1976d2' },
  { label: 'Title Transfer & Registration', path: '/title-transfers', icon: <SwapHorizIcon sx={{ fontSize: 48 }} />, endpoint: 'title-transfers', color: '#388e3c' },
  { label: 'Lot Location Verification', path: '/lot-verifications', icon: <LocationOnIcon sx={{ fontSize: 48 }} />, endpoint: 'lot-verifications', color: '#f57c00' },
  { label: 'Tax Clearance', path: '/tax-clearances', icon: <ReceiptLongIcon sx={{ fontSize: 48 }} />, endpoint: 'tax-clearances', color: '#7b1fa2' },
  { label: 'Tax Declaration', path: '/tax-declarations', icon: <ArticleIcon sx={{ fontSize: 48 }} />, endpoint: 'tax-declarations', color: '#c62828' },
  { label: 'Mortgage Registration / Cancellation', path: '/mortgages', icon: <HomeWorkIcon sx={{ fontSize: 48 }} />, endpoint: 'mortgages', color: '#00796b' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCounts = async () => {
      const results = await Promise.allSettled(
        services.map((s) => api.get(`/${s.endpoint}?per_page=1`))
      )
      const c = {}
      results.forEach((r, i) => {
        c[services[i].endpoint] = r.status === 'fulfilled' ? r.value.data.total : 0
      })
      setCounts(c)
      setLoading(false)
    }
    fetchCounts()
  }, [])

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>Welcome, {user?.name}</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Manage your property documentation requests below.
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {services.map((s) => (
            <Grid item xs={12} sm={6} md={4} key={s.path}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardActionArea onClick={() => navigate(s.path)} sx={{ p: 2 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                    <Typography variant="h6" fontWeight={600} mb={1}>{s.label}</Typography>
                    <Typography variant="h3" fontWeight={700} color={s.color}>
                      {counts[s.endpoint] ?? 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Total Requests</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
