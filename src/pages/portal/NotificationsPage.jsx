import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Card, Skeleton,
} from '@mui/material'
import { motion } from 'framer-motion'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import CircleIcon from '@mui/icons-material/Circle'
import UpdateIcon from '@mui/icons-material/Update'
import PersonIcon from '@mui/icons-material/Person'
import InfoIcon from '@mui/icons-material/Info'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

const TYPE_META = {
  transaction_update: { label: 'Update',   color: '#3B82F6', bg: '#EFF6FF', Icon: UpdateIcon },
  assignment:         { label: 'Assigned', color: GOLD,     bg: `${GOLD}18`, Icon: PersonIcon },
  info:               { label: 'Info',     color: '#64748B', bg: '#F1F5F9', Icon: InfoIcon },
}

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.info
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3,
      bgcolor: meta.bg, borderRadius: '6px', border: `1px solid ${meta.color}28` }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
    </Box>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [marking, setMarking]             = useState(false)
  const [page, setPage]                   = useState(1)
  const [total, setTotal]                 = useState(0)

  const fetchNotifications = () => {
    setLoading(true)
    api.get(`/notifications?page=${page}`)
      .then(({ data }) => {
        setNotifications(data.data || [])
        setTotal(data.total || 0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchNotifications() }, [page])

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
  }

  const markAllRead = async () => {
    setMarking(true)
    await api.put('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })))
    setMarking(false)
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, #0F2744 55%, #153250 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <NotificationsNoneIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Notifications</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Your Notifications
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              {total} total · {unreadCount} unread
            </Typography>
          </motion.div>
          {unreadCount > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Button startIcon={<DoneAllIcon />} onClick={markAllRead} disabled={marking}
                sx={{ fontWeight: 700, color: 'white', bgcolor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)', borderRadius: 2, px: 2, py: 1,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                Mark all as read
              </Button>
            </motion.div>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 800, mx: 'auto' }}>
        <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', overflow: 'hidden' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9', display: 'flex', gap: 2 }}>
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton width="55%" height={18} />
                  <Skeleton width="80%" height={14} sx={{ mt: 0.5 }} />
                  <Skeleton width="30%" height={12} sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            ))
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #EEF2F7 0%, #E2E8F0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                <NotificationsNoneIcon sx={{ fontSize: 36, color: '#CBD5E1' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155', mb: 0.5 }}>All caught up!</Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>No notifications yet. We'll let you know when something needs your attention.</Typography>
            </Box>
          ) : (
            notifications.map((notif, i) => {
              const meta = TYPE_META[notif.type] || TYPE_META.info
              const isUnread = !notif.read_at
              const Icon = meta.Icon
              return (
                <motion.div key={notif.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <Box
                    sx={{
                      px: 3, py: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start',
                      cursor: isUnread ? 'pointer' : 'default',
                      bgcolor: isUnread ? '#FAFBFF' : 'white',
                      borderBottom: '1px solid #F1F5F9',
                      '&:hover': isUnread ? { bgcolor: '#F0F4FF' } : {},
                      '&:last-child': { borderBottom: 'none' },
                      transition: 'background 0.15s',
                    }}
                    onClick={() => isUnread && markRead(notif.id)}
                  >
                    {/* Type icon */}
                    <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: meta.bg, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1px solid ${meta.color}20` }}>
                      <Icon sx={{ fontSize: 18, color: meta.color }} />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: isUnread ? 700 : 600, color: NAVY }}>
                          {notif.title}
                        </Typography>
                        <TypeBadge type={notif.type} />
                        {isUnread && (
                          <CircleIcon sx={{ fontSize: 8, color: GOLD, ml: 'auto' }} />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569', mb: 0.5, lineHeight: 1.5, fontSize: '0.85rem' }}>
                        {notif.body}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                        {new Date(notif.created_at).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                        {!isUnread && ' · Read'}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              )
            })
          )}
        </Card>

        {total > 20 && notifications.length < total && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button onClick={() => setPage(p => p + 1)}
              sx={{ color: NAVY, fontWeight: 700, border: '1px solid #E8EDF5', borderRadius: 2, px: 3, py: 1,
                '&:hover': { bgcolor: 'white', boxShadow: '0 2px 8px rgba(10,22,40,0.08)' } }}>
              Load more notifications
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
