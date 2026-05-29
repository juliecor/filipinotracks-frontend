import { useEffect, useState, useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box, Typography, Card, Chip, Button, IconButton, TextField, InputAdornment,
  Skeleton, Alert, Tooltip, Snackbar, CircularProgress, Stack, Divider,
  Menu, MenuItem, Avatar,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import SearchIcon from '@mui/icons-material/Search'
import ContactSupportRoundedIcon from '@mui/icons-material/ContactSupportRounded'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import api from '../../api/axios'
import { NAVY, GOLD, GOLD_DARK, GOLD_LIGHT, TEXT_MUTED } from '../../theme/theme'

const STATUS_META = {
  new:       { label: 'New',       color: '#2563EB', bg: '#DBEAFE' },
  contacted: { label: 'Contacted', color: '#9F7E2C', bg: '#FBF5E5' },
  closed:    { label: 'Closed',    color: '#64748B', bg: '#E2E8F0' },
}

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'new',       label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'closed',    label: 'Closed' },
]

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('')
}

function StatPill({ icon, label, value, color, active, onClick }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        p: 1.5, cursor: onClick ? 'pointer' : 'default',
        border: 2, borderColor: active ? color : 'transparent',
        transition: 'all 0.15s',
        '&:hover': onClick ? { borderColor: color } : {},
        display: 'flex', alignItems: 'center', gap: 1.5,
        minWidth: 0, flex: 1,
      }}
    >
      <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: `${color}1A`, color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
          {label.toUpperCase()}
        </Typography>
        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.15rem', lineHeight: 1.1 }}>
          {value}
        </Typography>
      </Box>
    </Card>
  )
}

function InquiryCard({ item, onStatusChange, onCopied }) {
  const meta = STATUS_META[item.status] || STATUS_META.new
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const map = item.property_map
  const tx  = item.transaction

  const handleChangeStatus = async (status) => {
    setMenuAnchor(null)
    if (status === item.status) return
    setSaving(true)
    try {
      await onStatusChange(item.id, status)
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = (value, label) => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => onCopied(`${label} copied`))
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <Card sx={{ p: { xs: 2, md: 2.5 }, position: 'relative' }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {/* Avatar */}
          <Avatar sx={{
            bgcolor: `${meta.color}22`, color: meta.color,
            fontWeight: 800, fontSize: '0.95rem',
            width: 44, height: 44, flexShrink: 0,
          }}>
            {initials(item.name)}
          </Avatar>

          {/* Body */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', mb: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'text.primary', mr: 0.5 }}>
                {item.name}
              </Typography>
              <Chip
                size="small"
                label={meta.label.toUpperCase()}
                sx={{
                  bgcolor: meta.bg, color: meta.color,
                  fontWeight: 800, letterSpacing: '0.08em', fontSize: '0.62rem', height: 20,
                }}
              />
              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                · {timeAgo(item.created_at)}
              </Typography>
            </Stack>

            {/* Contact chips */}
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
              {item.email && (
                <Tooltip title="Click to copy">
                  <Chip
                    size="small"
                    icon={<EmailOutlinedIcon sx={{ fontSize: 14 }} />}
                    label={item.email}
                    onClick={() => handleCopy(item.email, 'Email')}
                    sx={{ fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer' }}
                  />
                </Tooltip>
              )}
              {item.phone && (
                <Tooltip title="Click to copy">
                  <Chip
                    size="small"
                    icon={<PhoneOutlinedIcon sx={{ fontSize: 14 }} />}
                    label={item.phone}
                    onClick={() => handleCopy(item.phone, 'Phone')}
                    sx={{ fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer' }}
                  />
                </Tooltip>
              )}
            </Stack>

            {/* Message */}
            <Box
              onClick={() => setExpanded(v => !v)}
              sx={{
                p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover',
                border: 1, borderColor: 'divider', cursor: 'pointer',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <Typography sx={{
                fontSize: '0.87rem', color: 'text.primary', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical',
                overflow: expanded ? 'visible' : 'hidden',
              }}>
                {item.message}
              </Typography>
              {item.message?.length > 200 && (
                <Typography sx={{ fontSize: '0.7rem', color: GOLD_DARK, fontWeight: 700, mt: 0.5 }}>
                  {expanded ? 'Show less' : 'Show more'}
                </Typography>
              )}
            </Box>

            {/* Property reference */}
            {(map || tx) && (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: `${GOLD}1F`, color: GOLD_DARK, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <HomeWorkOutlinedIcon sx={{ fontSize: 16 }} />
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary' }} noWrap>
                    {map?.registered_owner || '(Property)'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }} noWrap>
                    {[map?.city_municipality, map?.province].filter(Boolean).join(', ') || tx?.transaction_code}
                  </Typography>
                </Box>
                <Tooltip title="Open public page">
                  <IconButton
                    size="small"
                    component={RouterLink}
                    to={`/p/${tx?.transaction_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: GOLD_DARK }}
                  >
                    <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                {tx?.transaction_code && (
                  <Tooltip title="Copy transaction code">
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(tx.transaction_code, 'Transaction code')}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            )}

            {/* Responded by */}
            {item.responded_by_name || item.responded_by && (
              <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: 1 }}>
                Last action by {item.responded_by?.name || 'staff'} · {timeAgo(item.responded_at)}
              </Typography>
            )}
          </Box>

          {/* Quick action */}
          <Stack spacing={0.5} alignItems="flex-end">
            {item.status === 'new' && (
              <Button
                size="small"
                variant="contained"
                startIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                onClick={() => handleChangeStatus('contacted')}
                disabled={saving}
                sx={{
                  fontWeight: 700, fontSize: '0.72rem', py: 0.6, px: 1.5,
                  background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                  color: NAVY,
                  '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
                }}
              >
                Mark contacted
              </Button>
            )}
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)} disabled={saving}>
              <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>

        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={() => setMenuAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {item.status !== 'new' && (
            <MenuItem onClick={() => handleChangeStatus('new')} sx={{ fontSize: '0.85rem' }}>
              <RestartAltRoundedIcon sx={{ fontSize: 16, mr: 1 }} /> Reopen (mark new)
            </MenuItem>
          )}
          {item.status !== 'contacted' && (
            <MenuItem onClick={() => handleChangeStatus('contacted')} sx={{ fontSize: '0.85rem' }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 16, mr: 1, color: GOLD_DARK }} /> Mark contacted
            </MenuItem>
          )}
          {item.status !== 'closed' && (
            <MenuItem onClick={() => handleChangeStatus('closed')} sx={{ fontSize: '0.85rem' }}>
              <ArchiveOutlinedIcon sx={{ fontSize: 16, mr: 1 }} /> Mark closed
            </MenuItem>
          )}
        </Menu>
      </Card>
    </motion.div>
  )
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([])
  const [counts, setCounts]       = useState({ all: 0, new: 0, contacted: 0, closed: 0 })
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [tab, setTab]             = useState('new')
  const [search, setSearch]       = useState('')
  const [toast, setToast]         = useState('')

  const fetchData = (statusTab = tab, q = search) => {
    setLoading(true)
    setError('')
    const params = {}
    if (statusTab !== 'all') params.status = statusTab
    if (q.trim())            params.q = q.trim()
    api.get('/admin/inquiries', { params })
      .then(({ data }) => {
        setInquiries(data.data || [])
        setCounts(data.counts || { all: 0, new: 0, contacted: 0, closed: 0 })
      })
      .catch(() => setError('Failed to load inquiries.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData(tab, search) /* eslint-disable-next-line */ }, [tab])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchData(tab, search), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line
  }, [search])

  const handleStatusChange = async (id, status) => {
    try {
      const { data } = await api.put(`/admin/inquiries/${id}`, { status })
      setInquiries(prev => {
        // Remove from current view if it no longer matches the tab
        if (tab !== 'all' && data.status !== tab) {
          return prev.filter(x => x.id !== id)
        }
        return prev.map(x => x.id === id ? data : x)
      })
      // Refresh counts in the background
      api.get('/admin/inquiries', { params: { status: 'never' } })
        .then(({ data: d }) => setCounts(d.counts))
        .catch(() => {})
      setToast(`Marked as ${data.status}`)
    } catch (err) {
      setToast('Failed to update status')
    }
  }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6.5 },
      }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
            bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5,
          }}>
            <ContactSupportRoundedIcon sx={{ fontSize: 12, color: GOLD }} />
            <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Admin · Leads
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.6, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
            Property Inquiries
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.93rem' }}>
            Leads captured from public property share pages. Reach out, then mark contacted.
          </Typography>
        </motion.div>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1100, mx: 'auto', mt: { xs: -3.5, md: -4.5 } }}>
        {/* Stats */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
          <StatPill icon={<ContactSupportRoundedIcon sx={{ fontSize: 20 }} />} label="Total"     value={counts.all}       color={NAVY}               active={tab === 'all'}        onClick={() => setTab('all')} />
          <StatPill icon={<EmailOutlinedIcon sx={{ fontSize: 20 }} />}         label="New"       value={counts.new}       color={STATUS_META.new.color}       active={tab === 'new'}        onClick={() => setTab('new')} />
          <StatPill icon={<CheckCircleRoundedIcon sx={{ fontSize: 20 }} />}    label="Contacted" value={counts.contacted} color={STATUS_META.contacted.color} active={tab === 'contacted'}  onClick={() => setTab('contacted')} />
          <StatPill icon={<ArchiveOutlinedIcon sx={{ fontSize: 20 }} />}       label="Closed"    value={counts.closed}    color={STATUS_META.closed.color}    active={tab === 'closed'}     onClick={() => setTab('closed')} />
        </Stack>

        {/* Filter tabs + search */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', flex: 1 }}>
            {TABS.map(t => (
              <Chip
                key={t.key}
                label={`${t.label}${t.key !== 'all' ? ` · ${counts[t.key]}` : ` · ${counts.all}`}`}
                onClick={() => setTab(t.key)}
                sx={{
                  fontWeight: 700, fontSize: '0.75rem',
                  bgcolor: tab === t.key ? NAVY : 'background.paper',
                  color: tab === t.key ? '#fff' : 'text.primary',
                  border: 1,
                  borderColor: tab === t.key ? NAVY : 'divider',
                  '&:hover': { bgcolor: tab === t.key ? NAVY : 'action.hover' },
                }}
              />
            ))}
          </Stack>
          <TextField
            size="small"
            placeholder="Search name, message, code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { md: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* List */}
        <Stack spacing={1.5}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={150} sx={{ borderRadius: 2 }} />
            ))
          ) : inquiries.length === 0 ? (
            <Card sx={{ py: 8, textAlign: 'center' }}>
              <Box sx={{ width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: `${GOLD}1A`, color: GOLD_DARK, display: 'grid', placeItems: 'center' }}>
                <ContactSupportRoundedIcon sx={{ fontSize: 32 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                No inquiries{tab !== 'all' ? ` in “${tab}”` : ''} yet
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mt: 0.5 }}>
                {tab === 'new' ? 'New leads will appear here as buyers send messages from public property pages.' : 'Try a different filter or share more property links.'}
              </Typography>
            </Card>
          ) : (
            <AnimatePresence initial={false}>
              {inquiries.map(item => (
                <InquiryCard
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  onCopied={(label) => setToast(label)}
                />
              ))}
            </AnimatePresence>
          )}
        </Stack>

        <Divider sx={{ my: 4 }} />
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.disabled' }}>
          Leads are submitted via the public Share Property page. Marking contacted records who responded and when.
        </Typography>
      </Box>

      <Snackbar
        open={!!toast}
        autoHideDuration={2200}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
