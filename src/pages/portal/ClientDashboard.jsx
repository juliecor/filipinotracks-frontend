import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Grid, Typography, Card, CardContent, Button, Chip, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Avatar, Skeleton,
} from '@mui/material'
import { motion } from 'framer-motion'
import AddIcon from '@mui/icons-material/Add'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import VerifiedIcon from '@mui/icons-material/Verified'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import DescriptionIcon from '@mui/icons-material/Description'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import { useAuth } from '../../context/AuthContext'
import {
  NAVY, NAVY_SURFACE, NAVY_LINE, GOLD, GOLD_DARK,
  INFO, SUCCESS, WARNING, DANGER,
  SURFACE, SURFACE_SUBTLE, BORDER, TEXT_BODY, TEXT_MUTED, TEXT_SUBTLE,
} from '../../theme/theme'
import api from '../../api/axios'

const STATUS_META = {
  'submitted':                { label: 'Submitted',    color: NAVY      },
  'under review':             { label: 'Under Review', color: INFO      },
  'verification ongoing':     { label: 'Verifying',    color: INFO      },
  'processing':               { label: 'Processing',   color: WARNING   },
  'waiting for requirements': { label: 'Waiting',      color: GOLD_DARK },
  'approved':                 { label: 'Approved',     color: SUCCESS   },
  'released':                 { label: 'Released',     color: SUCCESS   },
  'rejected':                 { label: 'Rejected',     color: DANGER    },
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
  const meta = STATUS_META[status] || { label: status, color: TEXT_MUTED }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4,
      bgcolor: `${meta.color}14`, borderRadius: '6px', border: `1px solid ${meta.color}28` }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, whiteSpace: 'nowrap' }}>{meta.label}</Typography>
    </Box>
  )
}

function StatCard({ label, value, icon, color, delay, loading }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: 'spring', stiffness: 200 }}>
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: 1, borderColor: 'divider' }}>
        <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at top right, ${color}08 0%, transparent 70%)` }} />
        <CardContent sx={{ p: { xs: 2.5, md: 3 }, position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography sx={{ color: 'text.disabled', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
                {label}
              </Typography>
              {loading
                ? <Skeleton width={56} height={36} />
                : <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>{value}</Typography>
              }
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

const QUICK_ACTIONS = [
  { label: 'Title Verification',  icon: <VerifiedIcon />,        color: INFO    },
  { label: 'Title Transfer',      icon: <CompareArrowsIcon />,   color: GOLD    },
  { label: 'Tax Declaration',     icon: <AccountBalanceIcon />,  color: SUCCESS },
  { label: 'Document Processing', icon: <DescriptionIcon />,     color: NAVY    },
]

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/transactions?per_page=50')
      .then(({ data }) => setTransactions(data.data || []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false))
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const active    = transactions.filter(t => !['approved', 'released', 'rejected'].includes(t.status)).length
  const pending   = transactions.filter(t => t.status === 'submitted').length
  const inProcess = transactions.filter(t => t.status === 'processing').length
  const completed = transactions.filter(t => ['approved', 'released'].includes(t.status)).length
  const recent    = transactions.slice(0, 6)

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>

      {/* ═══ Hero ═══ */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, ${NAVY_SURFACE} 60%, ${NAVY_LINE} 100%)`,
        px: { xs: 3, sm: 4, md: 5 },
        pt: { xs: 4, md: 5 },
        pb: { xs: 5, md: 6.5 },
      }}>
        {/* Subtle texture dots */}
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(201,168,76,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3, position: 'relative', maxWidth: 1400, mx: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px', bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Client Portal
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.6, lineHeight: 1.2, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem', maxWidth: 500 }}>
              Track and manage your property documentation requests — all in one place.
            </Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />}
              onClick={() => navigate('/portal/transactions/new')}
              sx={{ fontWeight: 700, py: 1.4, px: 3, boxShadow: `0 8px 24px ${GOLD}50` }}>
              New Transaction
            </Button>
          </motion.div>
        </Box>
      </Box>

      {/* ═══ Content ═══ */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {/* Stat cards */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
          {[
            { label: 'Active Transactions', value: active,    icon: <ReceiptLongIcon />,    color: INFO,    delay: 0 },
            { label: 'Pending Review',      value: pending,   icon: <PendingIcon />,        color: GOLD,    delay: 0.07 },
            { label: 'In Processing',       value: inProcess, icon: <HourglassEmptyIcon />, color: WARNING, delay: 0.14 },
            { label: 'Completed',           value: completed, icon: <CheckCircleIcon />,    color: SUCCESS, delay: 0.21 },
          ].map(s => (
            <Grid item xs={6} lg={3} key={s.label}>
              <StatCard {...s} loading={loading} />
            </Grid>
          ))}
        </Grid>

        {/* Main grid */}
        <Grid container spacing={{ xs: 2, md: 3 }}>

          {/* Recent transactions */}
          <Grid item xs={12} lg={8}>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
              <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: 1, borderColor: 'divider' }}>
                <Box sx={{ px: 3, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary' }}>Recent Transactions</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>{transactions.length} total requests</Typography>
                  </Box>
                  <Button endIcon={<ArrowForwardIcon />} size="small" onClick={() => navigate('/portal/transactions')}
                    sx={{ color: GOLD, fontWeight: 700, fontSize: '0.8rem', '&:hover': { bgcolor: `${GOLD}10` } }}>
                    View All
                  </Button>
                </Box>

                {loading ? (
                  <Box sx={{ p: 3 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Skeleton width={120} height={20} />
                        <Skeleton width={100} height={20} />
                        <Skeleton width={80} height={20} />
                      </Box>
                    ))}
                  </Box>
                ) : recent.length === 0 ? (
                  <Box sx={{ py: 10, textAlign: 'center' }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${SURFACE_SUBTLE} 0%, #DDE3EE 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                      <ReceiptLongIcon sx={{ fontSize: 36, color: 'action.disabled' }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, mb: 0.5 }}>No transactions yet</Typography>
                    <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3, maxWidth: 320, mx: 'auto' }}>
                      Start by submitting your first property documentation request
                    </Typography>
                    <Button variant="contained" color="secondary" startIcon={<AddIcon />}
                      onClick={() => navigate('/portal/transactions/new')} sx={{ fontWeight: 700 }}>
                      New Transaction
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {['Transaction ID', 'Service', 'Owner / Property', 'Status', 'Filed'].map(h => (
                            <TableCell key={h} sx={{ py: 1.5, fontSize: '0.72rem' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recent.map((tx, i) => (
                          <motion.tr key={tx.id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/portal/transactions/${tx.id}`)}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, color: 'text.primary', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                {tx.transaction_code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.82rem' }}>
                                {SERVICE_LABELS[tx.service_type] || tx.service_type}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: 'text.primary', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                {tx.registered_owner || tx.property_address || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell><StatusBadge status={tx.status} /></TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                {new Date(tx.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </Typography>
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

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>

              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: 1, borderColor: 'divider' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.3 }}>Quick Actions</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mb: 2.5 }}>Start a new request quickly</Typography>
                    <Stack spacing={1.5}>
                      {QUICK_ACTIONS.map((a, i) => (
                        <motion.div key={a.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.06 }}>
                          <Box
                            onClick={() => navigate('/portal/transactions/new')}
                            sx={{
                              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                              borderRadius: 2, border: '1.5px solid', borderColor: 'divider', cursor: 'pointer',
                              transition: 'all 0.18s', bgcolor: 'background.paper',
                              '&:hover': { borderColor: a.color, bgcolor: `${a.color}06`, transform: 'translateX(4px)', boxShadow: `0 4px 12px ${a.color}20` },
                            }}
                          >
                            <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: `${a.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, '& svg': { color: a.color, fontSize: 18 } }}>
                              {a.icon}
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', flex: 1 }}>{a.label}</Typography>
                            <ArrowForwardIcon sx={{ fontSize: 14, color: 'action.disabled' }} />
                          </Box>
                        </motion.div>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Help card */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card sx={{
                  background: `linear-gradient(140deg, ${NAVY} 0%, ${NAVY_SURFACE} 100%)`,
                  border: 'none', boxShadow: `0 8px 32px ${NAVY}30`,
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, background: `${GOLD}22`, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                      <SupportAgentIcon sx={{ color: GOLD, fontSize: 24 }} />
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'white', mb: 0.8 }}>Need Assistance?</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.52)', mb: 3, lineHeight: 1.7, fontSize: '0.85rem' }}>
                      Our team is available Mon–Sat, 8AM–6PM to help you with your property documentation.
                    </Typography>
                    <Button fullWidth variant="contained" color="secondary" sx={{ fontWeight: 700, py: 1.2 }}>
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}
