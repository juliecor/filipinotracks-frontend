import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, IconButton, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Alert, Tooltip, Pagination,
} from '@mui/material'
import { motion } from 'framer-motion'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PeopleIcon from '@mui/icons-material/People'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

const ROLES = ['admin', 'staff', 'agent', 'client']
const ROLE_META = {
  admin:  { color: '#8B5CF6', bg: '#F3F0FF' },
  staff:  { color: '#3B82F6', bg: '#EFF6FF' },
  agent:  { color: '#F59E0B', bg: '#FFFBEB' },
  client: { color: '#22C55E', bg: '#F0FDF4' },
}

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', address: '', role: 'client' }

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || { color: '#64748B', bg: '#F1F5F9' }
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.2, py: 0.4,
      bgcolor: meta.bg, borderRadius: '6px', border: `1px solid ${meta.color}28` }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color }} />
      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: meta.color, textTransform: 'capitalize' }}>{role}</Typography>
    </Box>
  )
}

export default function AdminUsersPage() {
  const [rows, setRows]           = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dialog, setDialog]       = useState(false)
  const [editUser, setEditUser]   = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting]   = useState(null)

  const [fetchError, setFetchError] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const params = new URLSearchParams({ page, per_page: 15 })
      if (search)     params.append('search', search)
      if (roleFilter) params.append('role', roleFilter)
      const { data } = await api.get(`/admin/users?${params}`)
      setRows(data.data || [])
      setTotal(data.total || 0)
    } catch (err) {
      setRows([])
      setFetchError('Failed to load users (' + (err.response?.status || 'network error') + '). Make sure the backend is running.')
    }
    finally { setLoading(false) }
  }, [page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openCreate = () => { setEditUser(null); setForm(EMPTY_FORM); setFormError(''); setDialog(true) }
  const openEdit   = (u) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', phone: u.phone || '', address: u.address || '', role: u.roles?.[0]?.name || 'client' })
    setFormError('')
    setDialog(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setFormError('')
    try {
      if (editUser) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        const { data } = await api.put(`/admin/users/${editUser.id}`, payload)
        setRows(prev => prev.map(r => r.id === editUser.id ? data : r))
      } else {
        const { data } = await api.post('/admin/users', form)
        setRows(prev => [data, ...prev])
        setTotal(t => t + 1)
      }
      setDialog(false)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) setFormError(Object.values(errors).flat().join(' '))
      else setFormError(err.response?.data?.message || 'Save failed.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"? This cannot be undone.`)) return
    setDeleting(u.id)
    try {
      await api.delete(`/admin/users/${u.id}`)
      setRows(prev => prev.filter(r => r.id !== u.id))
      setTotal(t => t - 1)
    } catch { /* ignore */ }
    finally { setDeleting(null) }
  }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, #0F2744 55%, #153250 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <PeopleIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              User Management
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              {total} registered user{total !== 1 ? 's' : ''} in the system
            </Typography>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
            <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openCreate}
              sx={{ fontWeight: 700, py: 1.4, px: 3, boxShadow: `0 8px 24px ${GOLD}50` }}>
              Add User
            </Button>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {fetchError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}
            action={<Button color="inherit" size="small" onClick={fetchUsers}>Retry</Button>}>
            {fetchError}
          </Alert>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by name or email…" size="small" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            sx={{ minWidth: 280, bgcolor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'white' }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
              <MenuItem value="">All Roles</MenuItem>
              {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          {roleFilter && (
            <Button size="small" onClick={() => { setRoleFilter(''); setPage(1) }}
              sx={{ color: '#64748B', fontWeight: 600, minWidth: 0 }}>
              Clear filter
            </Button>
          )}
        </Box>

        {/* Table card */}
        <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['User', 'Email', 'Phone', 'Role', 'Registered', ''].map(h => (
                    <TableCell key={h} sx={{ whiteSpace: 'nowrap', py: 1.8, fontSize: '0.72rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton height={24} /></TableCell>)}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 10, textAlign: 'center' }}>
                      <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #EEF2F7 0%, #E2E8F0 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                        <PeopleIcon sx={{ fontSize: 36, color: '#CBD5E1' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700, mb: 0.5 }}>No users found</Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>Try adjusting your search or filter</Typography>
                      <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={openCreate} sx={{ fontWeight: 700 }}>
                        Add First User
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : rows.map((row, i) => {
                  const role = row.roles?.[0]?.name
                  const roleColor = ROLE_META[role]?.color || '#64748B'
                  return (
                  <motion.tr key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={row.profile_picture_url || undefined}
                          sx={{
                            width: 36, height: 36,
                            bgcolor: `${roleColor}20`,
                            color: roleColor,
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            border: `2px solid ${roleColor}30`,
                          }}
                        >
                          {!row.profile_picture_url && row.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: NAVY }}>{row.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: '#475569' }}>{row.email}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: '#64748B' }}>{row.phone || '—'}</Typography></TableCell>
                    <TableCell><RoleBadge role={row.roles?.[0]?.name} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        {new Date(row.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(row)}
                            sx={{ bgcolor: '#F4F6FA', '&:hover': { bgcolor: `${NAVY}10` } }}>
                            <EditIcon sx={{ fontSize: 16, color: NAVY }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(row)} disabled={deleting === row.id}
                            sx={{ bgcolor: '#FEF2F2', '&:hover': { bgcolor: '#FECACA' } }}>
                            {deleting === row.id ? <CircularProgress size={14} /> : <DeleteIcon sx={{ fontSize: 16, color: '#EF4444' }} />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {total > 15 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2.5, borderTop: '1px solid #EEF2F7' }}>
              <Pagination count={Math.ceil(total / 15)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Card>
      </Box>

      {/* Create / Edit dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 440 } }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 1 }}>
          {editUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <TextField label="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} size="small" fullWidth />
            <TextField label="Email Address *" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} size="small" fullWidth />
            <TextField label={editUser ? 'New Password (leave blank to keep)' : 'Password *'} type="password"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} size="small" fullWidth />
            <TextField label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} size="small" fullWidth />
            <TextField label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              size="small" fullWidth multiline rows={2} />
            <FormControl size="small" fullWidth>
              <InputLabel>Role *</InputLabel>
              <Select label="Role *" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {ROLES.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setDialog(false)} disabled={saving} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleSave} disabled={saving}
            sx={{ fontWeight: 700, minWidth: 100 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : editUser ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
