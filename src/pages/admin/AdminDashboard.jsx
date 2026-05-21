import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Grid, Typography, Card, CardContent, Button, Chip, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Skeleton, LinearProgress, Alert,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import PeopleIcon from '@mui/icons-material/People'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { NAVY, GOLD } from '../../theme/theme'
import api from '../../api/axios'

const STATUS_META = {
  'submitted':                { label: 'Submitted',    color: '#8B5CF6' },
  'under review':             { label: 'Under Review', color: '#3B82F6' },
  'verification ongoing':     { label: 'Verifying',    color: '#06B6D4' },
  'processing':               { label: 'Processing',   color: '#F59E0B' },
  'waiting for requirements': { label: 'Waiting',      color: '#F97316' },
  'approved':                 { label: 'Approved',     color: '#22C55E' },
  'released':                 { label: 'Released',     color: '#16A34A' },
  'rejected':                 { label: 'Rejected',     color: '#EF4444' },
}

const SERVICE_LABELS = {
  'title-verification':    'Title Verification',
  'title-cancellation':    'Title Cancellation',
  'land-registration':     'Land Registration',
  'property-consultation': 'Property Consultation',
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748B' }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4,
      bgcolor: `${meta.color}14`, borderRadius: '6px', border: `1px solid ${meta.color}28` }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, whiteSpace: 'nowrap' }}>{meta.label}</Typography>
    </Box>
  )
}

function StatCard({ label, value, icon, color, trend, delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 200 }}>
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${color}07 0%, transparent 70%)` }} />
        <CardContent sx={{ p: { xs: 2.5, md: 3 }, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ color: '#8496AE', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
                {label}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1, mb: 1 }}>{value ?? '—'}</Typography>
              {trend && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, bgcolor: '#F0FDF4', borderRadius: '20px' }}>
                  <TrendingUpIcon sx={{ fontSize: 12, color: '#22C55E' }} />
                  <Typography sx={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: 700 }}>{trend}</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{
              width: 50, height: 50, borderRadius: 2.5, flexShrink: 0,
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 20px ${color}40`,
              '& svg': { color: 'white', fontSize: 22 },
            }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${color} 0%, ${color}60 100%)` }} />
      </Card>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: 'white', border: '1px solid #EDF0F7', borderRadius: 2, p: 1.5, boxShadow: '0 8px 24px rgba(10,22,40,0.12)' }}>
      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>
      {payload.map(p => (
        <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: NAVY }}>{p.name}: {p.value}</Typography>
        </Box>
      ))}
    </Box>
  )
}

const CHART_HEIGHT = 240

export default function AdminDashboard() {
  const [transactions, setTransactions] = useState([])
  const [users, setUsers]               = useState([])
  const [stats, setStats]               = useState(null)
  const [loading, setLoading]           = useState(true)
  const [apiError, setApiError]         = useState('')
  const navigate = useNavigate()

  const loadData = () => {
    setLoading(true)
    setApiError('')
    Promise.allSettled([
      api.get('/transactions?per_page=8'),
      api.get('/admin/users?per_page=5'),
      api.get('/admin/stats'),
    ]).then(([txRes, usersRes, statsRes]) => {
      const errors = []
      if (txRes.status === 'fulfilled')        setTransactions(txRes.value.data.data || [])
      else errors.push('transactions')
      if (usersRes.status === 'fulfilled')     setUsers(usersRes.value.data.data || [])
      else errors.push('users')
      if (statsRes.status === 'fulfilled')     setStats(statsRes.value.data)
      else errors.push('stats (' + (statsRes.reason?.response?.status || 'network') + ')')
      if (errors.length) setApiError('Failed to load: ' + errors.join(', ') + '. Check that the backend is running.')
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const statCards = [
    { label: 'Total Users',      value: stats?.users_total,            icon: <PeopleIcon />,        color: '#3B82F6', delay: 0    },
    { label: 'All Transactions', value: stats?.transactions_total,     icon: <ReceiptLongIcon />,   color: GOLD,      delay: 0.07 },
    { label: 'Completed',        value: stats?.transactions_completed, icon: <CheckCircleIcon />,   color: '#22C55E', delay: 0.14 },
    { label: 'Pending Review',   value: stats?.transactions_pending,   icon: <PendingIcon />,       color: '#F59E0B', delay: 0.21 },
  ]

  const monthlyData  = stats?.monthly   || []
  const serviceData  = stats?.service_mix || []

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6.5 },
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px', bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Admin Dashboard
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.6, lineHeight: 1.2, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Platform Overview
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              Monitor transactions, manage users, and track performance metrics
            </Typography>
          </motion.div>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/transactions')}
              sx={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', fontWeight: 600,
                '&:hover': { borderColor: GOLD, color: GOLD, bgcolor: `${GOLD}10` } }}>
              View Transactions
            </Button>
            <Button variant="contained" color="secondary" onClick={() => navigate('/admin/users')}
              sx={{ fontWeight: 700, boxShadow: `0 8px 24px ${GOLD}50` }}>
              Manage Users
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {apiError && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={loadData}>
                Retry
              </Button>
            }
          >
            {apiError}
          </Alert>
        )}

        {/* Stat cards */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
          {statCards.map(s => (
            <Grid item xs={6} lg={3} key={s.label}>
              <StatCard {...s} />
            </Grid>
          ))}
        </Grid>

        {/* Charts row — equal height */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }} alignItems="stretch">

          {/* Transaction Volume */}
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ flex: 1 }}>
              <Card sx={{ height: '100%', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Transaction Volume</Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>Monthly overview for {new Date().getFullYear()}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                        <Box sx={{ width: 10, height: 3, bgcolor: NAVY, borderRadius: 1 }} />
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Total</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                        <Box sx={{ width: 10, height: 3, bgcolor: GOLD, borderRadius: 1 }} />
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Completed</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {loading ? (
                    <Skeleton variant="rectangular" height={CHART_HEIGHT} sx={{ borderRadius: 2 }} />
                  ) : (
                    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                      <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={NAVY} stopOpacity={0.14} />
                            <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={GOLD} stopOpacity={0.22} />
                            <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="transactions" name="Total"     stroke={NAVY} strokeWidth={2.5} fill="url(#txGrad)"   dot={false} />
                        <Area type="monotone" dataKey="completed"    name="Completed" stroke={GOLD} strokeWidth={2.5} fill="url(#compGrad)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Service Mix — same height */}
          <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ flex: 1 }}>
              <Card sx={{ height: '100%', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Service Mix</Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>By transaction type (real data)</Typography>
                  </Box>

                  {loading ? (
                    <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 2 }} />
                  ) : serviceData.length === 0 ? (
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#94A3B8' }}>No transaction data yet</Typography>
                    </Box>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={CHART_HEIGHT - 60}>
                        <PieChart>
                          <Pie
                            data={serviceData}
                            cx="50%" cy="50%"
                            innerRadius={50} outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {serviceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v, name, props) => [`${props.payload.percent}% (${v})`, name]} />
                        </PieChart>
                      </ResponsiveContainer>

                      <Stack spacing={0.8} sx={{ mt: 1.5, flex: 1, overflowY: 'auto' }}>
                        {serviceData.map(s => (
                          <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.75rem' }}>{s.name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: NAVY }}>{s.value}</Typography>
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>({s.percent}%)</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Recent transactions + recent users */}
        <Grid container spacing={{ xs: 2, md: 3 }}>

          {/* Recent transactions */}
          <Grid item xs={12} lg={8}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
                <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEF2F7' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Recent Transactions</Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>Latest activity across the platform</Typography>
                  </Box>
                  <Button endIcon={<ArrowForwardIcon />} size="small" onClick={() => navigate('/admin/transactions')}
                    sx={{ color: GOLD, fontWeight: 700, '&:hover': { bgcolor: `${GOLD}10` } }}>
                    View All
                  </Button>
                </Box>
                {loading ? (
                  <Box sx={{ p: 3 }}><LinearProgress /></Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {['Transaction', 'Client', 'Service', 'Status', 'Staff', ''].map(h => (
                            <TableCell key={h} sx={{ py: 1.5, fontSize: '0.72rem' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 6, color: '#94A3B8' }}>No transactions found</TableCell>
                          </TableRow>
                        ) : transactions.map((tx, i) => (
                          <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/transactions/${tx.id}`)}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', color: NAVY }}>
                                {tx.transaction_code}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                {new Date(tx.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {tx.user && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                                  <Avatar src={tx.user.profile_picture_url || undefined} sx={{ width: 28, height: 28, bgcolor: NAVY, color: GOLD, fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>
                                    {!tx.user.profile_picture_url && tx.user.name?.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{tx.user.name}</Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.82rem' }}>
                                {SERVICE_LABELS[tx.service_type] || tx.service_type}
                              </Typography>
                            </TableCell>
                            <TableCell><StatusBadge status={tx.status} /></TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                                {tx.assigned_staff?.name || <Typography component="span" sx={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.8rem' }}>Unassigned</Typography>}
                              </Typography>
                            </TableCell>
                            <TableCell onClick={e => e.stopPropagation()}>
                              <Button size="small" onClick={() => navigate(`/admin/transactions/${tx.id}`)}
                                sx={{ fontSize: '0.72rem', color: NAVY, fontWeight: 700, minWidth: 0, px: 1.5, '&:hover': { bgcolor: `${NAVY}08` } }}>
                                View
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </motion.div>
          </Grid>

          {/* Recent users */}
          <Grid item xs={12} lg={4}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', height: '100%' }}>
                <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEF2F7' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Recent Users</Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>New registrations</Typography>
                  </Box>
                  <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/admin/users')}
                    sx={{ color: GOLD, fontWeight: 700, '&:hover': { bgcolor: `${GOLD}10` } }}>
                    All Users
                  </Button>
                </Box>
                <Box sx={{ p: 2 }}>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 1 }} />)
                  ) : users.length === 0 ? (
                    <Box sx={{ py: 4, textAlign: 'center', color: '#94A3B8' }}>
                      <PeopleIcon sx={{ fontSize: 36, mb: 1 }} />
                      <Typography variant="body2">No users yet</Typography>
                    </Box>
                  ) : (
                    users.map((u, i) => {
                      const role = u.roles?.[0]?.name
                      const roleColor = role === 'admin' ? '#8B5CF6' : role === 'staff' ? '#3B82F6' : role === 'agent' ? GOLD : '#22C55E'
                      return (
                        <motion.div key={u.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#F8FAFC' }, cursor: 'pointer' }}
                            onClick={() => navigate('/admin/users')}>
                            <Avatar
                              src={u.profile_picture_url || undefined}
                              sx={{ width: 38, height: 38, bgcolor: `${roleColor}18`, color: roleColor, fontWeight: 800, fontSize: '0.85rem', border: `1.5px solid ${roleColor}30` }}
                            >
                              {!u.profile_picture_url && u.name?.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                {u.email}
                              </Typography>
                            </Box>
                            <Chip label={role?.toUpperCase()} size="small"
                              sx={{ bgcolor: `${roleColor}14`, color: roleColor, fontWeight: 700, fontSize: '0.6rem', border: `1px solid ${roleColor}25`, height: 20 }} />
                          </Box>
                        </motion.div>
                      )
                    })
                  )}
                </Box>
              </Card>
            </motion.div>
          </Grid>

        </Grid>
      </Box>
    </Box>
  )
}
