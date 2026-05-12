import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, Avatar, Button, Chip, Rating,
  Skeleton, Tabs, Tab,
} from '@mui/material'
import { motion } from 'framer-motion'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import StarIcon from '@mui/icons-material/Star'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

const STATUS_COLOR = { pending: '#F59E0B', approved: '#22C55E', rejected: '#EF4444' }

export default function AdminTestimonialsPage() {
  const [all, setAll]       = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('pending')
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    api.get('/admin/testimonials')
      .then(({ data }) => setAll(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleStatus = async (id, status) => {
    setSaving(id)
    try {
      await api.put(`/admin/testimonials/${id}`, { status })
      setAll(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    } catch {}
    finally { setSaving(null) }
  }

  const filtered = all.filter(t => t.status === tab)

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Header */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6.5 },
      }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
            bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
            <StarIcon sx={{ fontSize: 12, color: GOLD }} />
            <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Admin
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.6, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
            Testimonials
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
            Review and approve client testimonials before they appear on the landing page
          </Typography>
        </motion.div>
      </Box>

      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 900, mx: 'auto' }}>

        {/* Tabs */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          {['pending', 'approved', 'rejected'].map(s => (
            <Button
              key={s}
              onClick={() => setTab(s)}
              variant={tab === s ? 'contained' : 'outlined'}
              size="small"
              sx={tab === s
                ? { bgcolor: STATUS_COLOR[s], color: 'white', fontWeight: 700, borderColor: STATUS_COLOR[s], '&:hover': { bgcolor: STATUS_COLOR[s] } }
                : { color: STATUS_COLOR[s], borderColor: `${STATUS_COLOR[s]}55`, fontWeight: 600,
                    '&:hover': { bgcolor: `${STATUS_COLOR[s]}10`, borderColor: STATUS_COLOR[s] } }
              }
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({all.filter(t => t.status === s).length})
            </Button>
          ))}
        </Box>

        {/* List */}
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height={120} sx={{ borderRadius: 3, mb: 2 }} />)
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center', color: '#94A3B8' }}>
            <StarIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>No {tab} testimonials</Typography>
          </Box>
        ) : (
          filtered.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card sx={{ mb: 2, p: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Avatar
                    src={t.avatar_url || undefined}
                    sx={{ width: 46, height: 46, bgcolor: NAVY, color: GOLD, fontWeight: 800, flexShrink: 0 }}
                  >
                    {!t.avatar_url && t.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: NAVY }}>{t.name}</Typography>
                      {t.role_label && <Typography variant="caption" sx={{ color: '#64748B' }}>{t.role_label}</Typography>}
                      <Chip
                        label={t.status}
                        size="small"
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
                          bgcolor: `${STATUS_COLOR[t.status]}15`, color: STATUS_COLOR[t.status],
                          border: `1px solid ${STATUS_COLOR[t.status]}30` }}
                      />
                    </Box>
                    <Rating value={t.rating} readOnly size="small" sx={{ mb: 1, '& .MuiRating-iconFilled': { color: GOLD } }} />
                    <Typography variant="body2" sx={{ color: '#374151', lineHeight: 1.75, fontStyle: 'italic', mb: 1.5 }}>
                      "{t.content}"
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Submitted {new Date(t.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Typography>
                  </Box>

                  {/* Actions */}
                  {t.status === 'pending' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                      <Button
                        size="small" variant="contained"
                        startIcon={saving === t.id ? undefined : <CheckCircleIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleStatus(t.id, 'approved')}
                        disabled={saving === t.id}
                        sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small" variant="outlined"
                        startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleStatus(t.id, 'rejected')}
                        disabled={saving === t.id}
                        sx={{ borderColor: '#EF4444', color: '#EF4444', fontWeight: 700, fontSize: '0.78rem',
                          '&:hover': { bgcolor: '#FEF2F2', borderColor: '#DC2626' } }}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}
                  {t.status === 'approved' && (
                    <Button size="small" variant="outlined" startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleStatus(t.id, 'rejected')} disabled={saving === t.id}
                      sx={{ borderColor: '#EF4444', color: '#EF4444', fontWeight: 600, fontSize: '0.75rem', flexShrink: 0,
                        '&:hover': { bgcolor: '#FEF2F2' } }}>
                      Reject
                    </Button>
                  )}
                  {t.status === 'rejected' && (
                    <Button size="small" variant="outlined" startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleStatus(t.id, 'approved')} disabled={saving === t.id}
                      sx={{ borderColor: '#22C55E', color: '#22C55E', fontWeight: 600, fontSize: '0.75rem', flexShrink: 0,
                        '&:hover': { bgcolor: '#F0FDF4' } }}>
                      Approve
                    </Button>
                  )}
                </Box>
              </Card>
            </motion.div>
          ))
        )}
      </Box>
    </Box>
  )
}
