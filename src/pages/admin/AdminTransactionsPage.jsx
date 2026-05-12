import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, IconButton, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Skeleton, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Tooltip, Pagination,
} from '@mui/material'
import { motion } from 'framer-motion'
import SearchIcon from '@mui/icons-material/Search'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

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
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.2, py: 0.4,
      bgcolor: `${meta.color}14`, borderRadius: '6px', border: `1px solid ${meta.color}28`, whiteSpace: 'nowrap' }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color }}>{meta.label}</Typography>
    </Box>
  )
}

export default function AdminTransactionsPage() {
  const navigate = useNavigate()
  const [rows, setRows]                     = useState([])
  const [total, setTotal]                   = useState(0)
  const [page, setPage]                     = useState(1)
  const [loading, setLoading]               = useState(true)
  const [search, setSearch]                 = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [serviceFilter, setServiceFilter]   = useState('')
  const [staffList, setStaffList]           = useState([])
  const [editTx, setEditTx]                 = useState(null)
  const [editForm, setEditForm]             = useState({ status: '', assigned_staff_id: '', remarks: '' })
  const [saving, setSaving]                 = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: 15 })
      if (statusFilter)  params.append('status', statusFilter)
      if (serviceFilter) params.append('service_type', serviceFilter)
      if (search)        params.append('search', search)
      const { data } = await api.get(`/transactions?${params}`)
      setRows(data.data || [])
      setTotal(data.total || 0)
    } catch { setRows([]) }
    finally { setLoading(false) }
  }, [page, statusFilter, serviceFilter, search])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { api.get('/staff').then(({ data }) => setStaffList(data)) }, [])

  const openEdit = (tx) => {
    setEditTx(tx)
    setEditForm({ status: tx.status, assigned_staff_id: tx.assigned_staff?.id || '', remarks: '' })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { status: editForm.status }
      if (editForm.assigned_staff_id) payload.assigned_staff_id = editForm.assigned_staff_id
      if (editForm.remarks) payload.remarks = editForm.remarks
      const { data } = await api.put(`/transactions/${editTx.id}`, payload)
      setRows(prev => prev.map(r => r.id === editTx.id ? { ...r, ...data } : r))
      setEditTx(null)
    } catch { /* silent */ }
    finally { setSaving(false) }
  }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, #0F2744 55%, #153250 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <ReceiptLongIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              All Transactions
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              {total} total transaction{total !== 1 ? 's' : ''} across all clients
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by code, owner, address…" size="small" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            sx={{ minWidth: 280, bgcolor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8', fontSize: 18 }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'white' }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <MenuItem value="">All Statuses</MenuItem>
              {Object.entries(STATUS_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white' }}>
            <InputLabel>Service</InputLabel>
            <Select label="Service" value={serviceFilter} onChange={e => { setServiceFilter(e.target.value); setPage(1) }}>
              <MenuItem value="">All Services</MenuItem>
              {Object.entries(SERVICE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </Select>
          </FormControl>
          {(statusFilter || serviceFilter) && (
            <Button size="small" onClick={() => { setStatusFilter(''); setServiceFilter(''); setPage(1) }}
              sx={{ color: '#64748B', fontWeight: 600, minWidth: 0 }}>
              Clear filters
            </Button>
          )}
        </Box>

        {/* Table card */}
        <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {['Transaction', 'Client', 'Service', 'Status', 'Assigned Staff', 'Date', ''].map(h => (
                    <TableCell key={h} sx={{ whiteSpace: 'nowrap', py: 1.8, fontSize: '0.72rem' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton height={24} /></TableCell>)}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 10, textAlign: 'center' }}>
                      <Box sx={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #EEF2F7 0%, #E2E8F0 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                        <ReceiptLongIcon sx={{ fontSize: 36, color: '#CBD5E1' }} />
                      </Box>
                      <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700, mb: 0.5 }}>No transactions found</Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8' }}>Try adjusting your search or filters</Typography>
                    </TableCell>
                  </TableRow>
                ) : rows.map((row, i) => (
                  <motion.tr key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/transactions/${row.id}`)}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: NAVY, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                        {row.transaction_code}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>{row.registered_owner || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      {row.user ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, bgcolor: NAVY, color: GOLD, fontSize: '0.65rem', fontWeight: 800 }}>
                            {row.user.name?.charAt(0)}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.user.name}</Typography>
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: '#94A3B8' }}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#334155' }}>
                        {SERVICE_LABELS[row.service_type] || row.service_type}
                      </Typography>
                    </TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell>
                      {row.assigned_staff
                        ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: NAVY, color: GOLD, fontSize: '0.6rem', fontWeight: 800 }}>
                              {row.assigned_staff.name?.charAt(0)}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem' }}>{row.assigned_staff.name}</Typography>
                          </Box>
                        : <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        {new Date(row.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => navigate(`/admin/transactions/${row.id}`)}
                            sx={{ bgcolor: '#F4F6FA', '&:hover': { bgcolor: `${NAVY}10` } }}>
                            <VisibilityIcon sx={{ fontSize: 16, color: NAVY }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit status / assign staff">
                          <IconButton size="small" onClick={() => openEdit(row)}
                            sx={{ bgcolor: `${GOLD}14`, '&:hover': { bgcolor: `${GOLD}25` } }}>
                            <EditIcon sx={{ fontSize: 16, color: '#A8882A' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </motion.tr>
                ))}
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

      {/* Edit dialog */}
      <Dialog open={Boolean(editTx)} onClose={() => setEditTx(null)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 1 }}>
          Update Transaction
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontFamily: 'monospace', mt: 0.3 }}>
            {editTx?.transaction_code}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.5 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_META).map(([k]) => (
                  <MenuItem key={k} value={k}><StatusBadge status={k} /></MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Assign Staff</InputLabel>
              <Select label="Assign Staff" value={editForm.assigned_staff_id} onChange={e => setEditForm(f => ({ ...f, assigned_staff_id: e.target.value }))}>
                <MenuItem value="">— Unassigned —</MenuItem>
                {staffList.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 22, height: 22, bgcolor: NAVY, color: GOLD, fontSize: '0.6rem', fontWeight: 800 }}>
                        {s.name?.charAt(0)}
                      </Avatar>
                      {s.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Remarks (optional)" value={editForm.remarks}
              onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))}
              multiline rows={2} size="small" fullWidth />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button onClick={() => setEditTx(null)} disabled={saving} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleSave} disabled={saving}
            sx={{ fontWeight: 700, minWidth: 100 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
