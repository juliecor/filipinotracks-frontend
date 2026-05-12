import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Card, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Switch, FormControlLabel, CircularProgress, Alert, Skeleton, Tooltip,
} from '@mui/material'
import { motion } from 'framer-motion'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PublicIcon from '@mui/icons-material/Public'
import LockIcon from '@mui/icons-material/Lock'
import CampaignIcon from '@mui/icons-material/Campaign'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

const TYPE_META = {
  info:    { label: 'Info',    color: '#3B82F6', bg: '#EFF6FF', accent: '#DBEAFE' },
  warning: { label: 'Warning', color: '#F59E0B', bg: '#FFFBEB', accent: '#FEF3C7' },
  success: { label: 'Success', color: '#22C55E', bg: '#F0FDF4', accent: '#DCFCE7' },
  urgent:  { label: 'Urgent',  color: '#EF4444', bg: '#FEF2F2', accent: '#FECACA' },
}

const EMPTY_FORM = { title: '', body: '', type: 'info', is_published: false }

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.info
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4,
      bgcolor: meta.bg, borderRadius: '6px', border: `1px solid ${meta.color}30` }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
    </Box>
  )
}

export default function AdminAnnouncementsPage() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [dialog, setDialog]       = useState(false)
  const [editItem, setEditItem]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')

  const fetchItems = () => {
    setLoading(true)
    api.get('/announcements')
      .then(({ data }) => setItems(data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [])

  const openCreate = () => { setEditItem(null); setForm(EMPTY_FORM); setFormError(''); setDialog(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({ title: item.title, body: item.body, type: item.type, is_published: item.is_published })
    setFormError('')
    setDialog(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError('')
    try {
      if (editItem) {
        const { data } = await api.put(`/admin/announcements/${editItem.id}`, form)
        setItems(prev => prev.map(i => i.id === editItem.id ? data : i))
      } else {
        const { data } = await api.post('/admin/announcements', form)
        setItems(prev => [data, ...prev])
      }
      setDialog(false)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) setFormError(Object.values(errors).flat().join(' '))
      else setFormError(err.response?.data?.message || 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    await api.delete(`/admin/announcements/${item.id}`)
    setItems(prev => prev.filter(i => i.id !== item.id))
  }

  const togglePublish = async (item) => {
    const { data } = await api.put(`/admin/announcements/${item.id}`, { is_published: !item.is_published })
    setItems(prev => prev.map(i => i.id === item.id ? data : i))
  }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <CampaignIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Announcements
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              Manage client-facing announcements and notices
            </Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openCreate}
              sx={{ fontWeight: 700, py: 1.4, px: 3, boxShadow: `0 8px 24px ${GOLD}50` }}>
              New Announcement
            </Button>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1000, mx: 'auto' }}>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={100} sx={{ mb: 2, borderRadius: 3 }} />
          ))
        ) : items.length === 0 ? (
          <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', textAlign: 'center', py: 10 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #EEF2F7 0%, #E2E8F0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
              <CampaignIcon sx={{ fontSize: 36, color: '#CBD5E1' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700, mb: 0.5 }}>No announcements yet</Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>Create your first announcement to notify clients</Typography>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openCreate} sx={{ fontWeight: 700 }}>
              Create Announcement
            </Button>
          </Card>
        ) : (
          items.map((item, i) => {
            const meta = TYPE_META[item.type] || TYPE_META.info
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <Card sx={{
                  boxShadow: '0 2px 12px rgba(10,22,40,0.07)',
                  border: `1px solid ${item.is_published ? meta.color + '35' : '#EDF0F7'}`,
                  borderLeft: `4px solid ${item.is_published ? meta.color : '#CBD5E1'}`,
                  mb: 2, overflow: 'hidden',
                }}>
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>{item.title}</Typography>
                        <TypeBadge type={item.type} />
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: '6px',
                          bgcolor: item.is_published ? '#F0FDF4' : '#F1F5F9',
                          border: `1px solid ${item.is_published ? '#22C55E30' : '#CBD5E1'}` }}>
                          {item.is_published
                            ? <PublicIcon sx={{ fontSize: 11, color: '#16A34A' }} />
                            : <LockIcon sx={{ fontSize: 11, color: '#64748B' }} />}
                          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: item.is_published ? '#16A34A' : '#64748B' }}>
                            {item.is_published ? 'Published' : 'Draft'}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569', mb: 1, lineHeight: 1.6 }}>{item.body}</Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        by {item.created_by?.name || 'Admin'} · {new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title={item.is_published ? 'Unpublish' : 'Publish'}>
                        <IconButton size="small" onClick={() => togglePublish(item)}
                          sx={{ bgcolor: item.is_published ? '#F0FDF4' : '#F4F6FA', '&:hover': { bgcolor: item.is_published ? '#DCFCE7' : '#E2E8F0' } }}>
                          {item.is_published
                            ? <LockIcon sx={{ fontSize: 16, color: '#64748B' }} />
                            : <PublicIcon sx={{ fontSize: 16, color: '#22C55E' }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(item)}
                          sx={{ bgcolor: '#F4F6FA', '&:hover': { bgcolor: `${NAVY}10` } }}>
                          <EditIcon sx={{ fontSize: 16, color: NAVY }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(item)}
                          sx={{ bgcolor: '#FEF2F2', '&:hover': { bgcolor: '#FECACA' } }}>
                          <DeleteIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            )
          })
        )}
      </Box>

      {/* Dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)}
        PaperProps={{ sx: { borderRadius: 3 } }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 1 }}>
          {editItem ? 'Edit Announcement' : 'New Announcement'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <TextField label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} size="small" fullWidth />
            <TextField label="Body / Content *" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              multiline rows={4} size="small" fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <MenuItem key={k} value={k}><TypeBadge type={k} /></MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} color="success" />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Publish immediately</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setDialog(false)} disabled={saving} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleSave} disabled={saving}
            sx={{ fontWeight: 700, minWidth: 100 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editItem ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
