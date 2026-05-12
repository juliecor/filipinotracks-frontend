import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, Grid, Avatar, Skeleton, Button,
} from '@mui/material'
import { motion } from 'framer-motion'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassTopIcon from '@mui/icons-material/HourglassTop'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'
import { useAuth } from '../../context/AuthContext'

const STATUS_META = {
  'submitted':                { label: 'Submitted',                color: '#8B5CF6' },
  'under review':             { label: 'Under Review',             color: '#3B82F6' },
  'verification ongoing':     { label: 'Verification Ongoing',     color: '#06B6D4' },
  'processing':               { label: 'Processing',               color: '#F59E0B' },
  'waiting for requirements': { label: 'Waiting for Requirements', color: '#F97316' },
  'approved':                 { label: 'Approved',                 color: '#22C55E' },
  'released':                 { label: 'Released',                 color: '#16A34A' },
  'rejected':                 { label: 'Rejected',                 color: '#EF4444' },
}

const SERVICE_LABELS = {
  'title-verification':    'Title Verification',
  'title-transfer':        'Title Transfer',
  'tax-declaration':       'Tax Declaration',
  'mortgage-annotation':   'Mortgage Annotation',
  'title-cancellation':    'Title Cancellation',
  'land-registration':     'Land Registration',
  'property-consultation': 'Property Consultation',
  'document-processing':   'Document Processing',
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748B' }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.3,
      bgcolor: `${meta.color}14`, borderRadius: '6px', border: `1px solid ${meta.color}28`, whiteSpace: 'nowrap' }}>
      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
    </Box>
  )
}

function StatCard({ icon, label, value, color, gradient, loading }) {
  return (
    <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ height: 4, background: gradient || color }} />
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.8 }}>
              {label}
            </Typography>
            {loading
              ? <Skeleton width={50} height={38} />
              : <Typography variant="h4" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1 }}>{value}</Typography>
            }
          </Box>
          <Box sx={{
            width: 46, height: 46, borderRadius: 2.5,
            background: gradient || `${color}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 4px 12px ${color}30`,
          }}>
            {icon}
          </Box>
        </Box>
      </Box>
    </Card>
  )
}

export default function StaffDashboard() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [txs, setTxs]         = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/transactions?per_page=50')
      .then(({ data }) => setTxs(data.data || []))
      .finally(() => setLoading(false))
  }, [])

  const total      = txs.length
  const inProgress = txs.filter(t => !['approved', 'released', 'rejected'].includes(t.status)).length
  const completed  = txs.filter(t => ['approved', 'released'].includes(t.status)).length
  const pending    = txs.filter(t => t.status === 'submitted').length
  const recent     = txs.slice(0, 8)

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, #0F2744 55%, #153250 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <Box sx={{ maxWidth: 1400, mx: 'auto', position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <AssignmentIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Staff Portal</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Welcome back, {user?.name?.split(' ')[0]}!
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              Here's an overview of your assigned transactions today
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {/* Stat cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {[
            {
              icon: <AssignmentIcon sx={{ color: 'white', fontSize: 22 }} />,
              label: 'Total Assigned', value: total, color: NAVY,
              gradient: `linear-gradient(135deg, ${NAVY} 0%, #1e3a5f 100%)`,
            },
            {
              icon: <HourglassTopIcon sx={{ color: 'white', fontSize: 22 }} />,
              label: 'In Progress', value: inProgress, color: '#F59E0B',
              gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            },
            {
              icon: <PendingActionsIcon sx={{ color: 'white', fontSize: 22 }} />,
              label: 'New Submitted', value: pending, color: '#8B5CF6',
              gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            },
            {
              icon: <CheckCircleIcon sx={{ color: 'white', fontSize: 22 }} />,
              label: 'Completed', value: completed, color: '#22C55E',
              gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
            },
          ].map((card, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <StatCard {...card} loading={loading} />
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Recent assignments */}
        <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Recent Assignments</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Your latest assigned transactions</Typography>
            </Box>
            <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
              onClick={() => navigate('/staff/transactions')}
              sx={{ fontWeight: 700, color: NAVY, fontSize: '0.78rem', '&:hover': { bgcolor: `${NAVY}08` } }}>
              View all
            </Button>
          </Box>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width={140} height={18} />
                  <Skeleton width={200} height={14} sx={{ mt: 0.5 }} />
                </Box>
                <Skeleton width={80} height={22} sx={{ borderRadius: 1 }} />
              </Box>
            ))
          ) : recent.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: '#94A3B8' }}>
              <AssignmentIcon sx={{ fontSize: 48, mb: 1.5, color: '#CBD5E1' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#475569' }}>No assignments yet</Typography>
              <Typography variant="body2">You'll see your assigned transactions here once the admin assigns them</Typography>
            </Box>
          ) : (
            recent.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                <Box
                  sx={{ px: 3, py: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 2,
                    cursor: 'pointer', transition: 'all 0.15s',
                    '&:hover': { bgcolor: '#F8FAFC' },
                    '&:last-child': { borderBottom: 'none' },
                  }}
                  onClick={() => navigate(`/staff/transactions/${tx.id}`)}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: `${NAVY}15`, color: NAVY, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                    {(SERVICE_LABELS[tx.service_type] || tx.service_type || 'T').charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: NAVY, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {tx.transaction_code}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {SERVICE_LABELS[tx.service_type] || tx.service_type}
                      {tx.registered_owner ? ` · ${tx.registered_owner}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <StatusBadge status={tx.status} />
                    <VisibilityIcon sx={{ fontSize: 16, color: '#CBD5E1' }} />
                  </Box>
                </Box>
              </motion.div>
            ))
          )}
        </Card>
      </Box>
    </Box>
  )
}
