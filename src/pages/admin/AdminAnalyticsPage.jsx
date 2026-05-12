import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Skeleton, Chip,
} from '@mui/material'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import BarChartIcon from '@mui/icons-material/BarChart'
import PeopleIcon from '@mui/icons-material/People'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

const CHART_H = 260

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{ bgcolor: 'white', border: '1px solid #EDF0F7', borderRadius: 2, p: 1.5, boxShadow: '0 8px 24px rgba(10,22,40,0.1)' }}>
      {label && <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block', mb: 0.5 }}>{label}</Typography>}
      {payload.map(p => (
        <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: NAVY }}>{p.name}: {p.value}</Typography>
        </Box>
      ))}
    </Box>
  )
}

function KpiCard({ label, value, icon, color, suffix = '', delay }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 200 }}>
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${color}07 0%, transparent 70%)` }} />
        <CardContent sx={{ p: { xs: 2.5, md: 3 }, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ color: '#8496AE', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
                {label}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1 }}>
                {value ?? '—'}{suffix}
              </Typography>
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

export default function AdminAnalyticsPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpi = data?.kpi || {}

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
            <BarChartIcon sx={{ fontSize: 12, color: GOLD }} />
            <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Analytics
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.6, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
            Platform Analytics
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
            Detailed insights on transactions, services, staff, and users
          </Typography>
        </motion.div>
      </Box>

      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {/* KPI Cards */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
          {[
            { label: 'Total Users',       value: kpi.users_total,            icon: <PeopleIcon />,       color: '#3B82F6', delay: 0    },
            { label: 'Total Transactions',value: kpi.transactions_total,     icon: <ReceiptLongIcon />,  color: GOLD,      delay: 0.07 },
            { label: 'Completed',         value: kpi.transactions_completed, icon: <CheckCircleIcon />,  color: '#22C55E', delay: 0.14 },
            { label: 'Completion Rate',   value: kpi.completion_rate,        icon: <TrendingUpIcon />,   color: '#8B5CF6', delay: 0.21, suffix: '%' },
          ].map(c => (
            <Grid item xs={6} lg={3} key={c.label}>
              {loading ? <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 3 }} /> : <KpiCard {...c} />}
            </Grid>
          ))}
        </Grid>

        {/* Monthly Volume — full width */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Card sx={{ mb: 3, boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Monthly Transaction Volume</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Full year overview for {new Date().getFullYear()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {[{ color: NAVY, label: 'Total' }, { color: GOLD, label: 'Completed' }].map(l => (
                    <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                      <Box sx={{ width: 10, height: 3, bgcolor: l.color, borderRadius: 1 }} />
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>{l.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              {loading ? <Skeleton variant="rectangular" height={CHART_H} sx={{ borderRadius: 2 }} /> : (
                <ResponsiveContainer width="100%" height={CHART_H}>
                  <AreaChart data={data?.monthly || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aNavy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={NAVY} stopOpacity={0.14} />
                        <stop offset="95%" stopColor={NAVY} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={GOLD} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="transactions" name="Total"     stroke={NAVY} strokeWidth={2.5} fill="url(#aNavy)" dot={false} />
                    <Area type="monotone" dataKey="completed"    name="Completed" stroke={GOLD} strokeWidth={2.5} fill="url(#aGold)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status Distribution + Service Mix */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: 3 }}>

          {/* Status Distribution */}
          <Grid item xs={12} md={7}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ height: '100%' }}>
              <Card sx={{ height: '100%', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY, mb: 0.5 }}>Transaction Status Breakdown</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2.5 }}>Current distribution across all statuses</Typography>
                  {loading ? <Skeleton variant="rectangular" height={CHART_H} sx={{ borderRadius: 2 }} /> : (
                    <ResponsiveContainer width="100%" height={CHART_H}>
                      <BarChart data={data?.status_dist || []} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" interval={0} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                          {(data?.status_dist || []).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Service Mix */}
          <Grid item xs={12} md={5}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} style={{ height: '100%' }}>
              <Card sx={{ height: '100%', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY, mb: 0.5 }}>Service Mix</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 1 }}>Transactions by service type</Typography>
                  {loading ? <Skeleton variant="circular" width={140} height={140} sx={{ mx: 'auto', mb: 2 }} /> : (
                    (data?.status_dist?.length === 0)
                      ? <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}><Typography variant="body2">No data yet</Typography></Box>
                      : <>
                          <ResponsiveContainer width="100%" height={170}>
                            <PieChart>
                              <Pie data={data?.service_mix || []} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                {(data?.service_mix || []).map((e, i) => <Cell key={i} fill={e.color} />)}
                              </Pie>
                              <Tooltip formatter={(v, n, p) => [`${p.payload.percent}% (${v})`, n]} />
                            </PieChart>
                          </ResponsiveContainer>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1 }}>
                            {(data?.service_mix || []).map(s => (
                              <Box key={s.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, flexShrink: 0 }} />
                                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>{s.name}</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: NAVY }}>{s.value} <Box component="span" sx={{ color: '#94A3B8', fontWeight: 400 }}>({s.percent}%)</Box></Typography>
                              </Box>
                            ))}
                          </Box>
                        </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Staff Performance + User Roles */}
        <Grid container spacing={{ xs: 2, md: 3 }}>

          {/* Staff Performance */}
          <Grid item xs={12} md={8}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.49 }}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY, mb: 0.5 }}>Staff Performance</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2.5 }}>Assigned vs completed transactions per staff</Typography>
                  {loading ? <Skeleton variant="rectangular" height={CHART_H} sx={{ borderRadius: 2 }} /> :
                    (data?.staff_performance?.length === 0)
                      ? <Box sx={{ py: 6, textAlign: 'center', color: '#94A3B8' }}><Typography variant="body2">No assigned transactions yet</Typography></Box>
                      : (
                        <ResponsiveContainer width="100%" height={CHART_H}>
                          <BarChart data={data?.staff_performance || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} axisLine={false} tickLine={false} width={90} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="total"     name="Assigned"  fill={`${NAVY}80`} radius={[0, 4, 4, 0]} />
                            <Bar dataKey="completed" name="Completed" fill={GOLD}        radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )
                  }
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* User Roles */}
          <Grid item xs={12} md={4}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }} style={{ height: '100%' }}>
              <Card sx={{ height: '100%', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY, mb: 0.5 }}>User Roles</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>Distribution by role</Typography>
                  {loading ? <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} /> : (
                    <>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={data?.user_roles || []} cx="50%" cy="50%" outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {(data?.user_roles || []).map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mt: 1.5 }}>
                        {(data?.user_roles || []).map(r => (
                          <Box key={r.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: r.color, flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>{r.name}</Typography>
                            </Box>
                            <Chip label={r.value} size="small"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${r.color}14`, color: r.color, border: `1px solid ${r.color}25` }} />
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

        </Grid>
      </Box>
    </Box>
  )
}
