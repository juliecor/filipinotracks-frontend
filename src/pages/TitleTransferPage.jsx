import { useState } from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, CircularProgress, Pagination,
  MenuItem, Select, FormControl, InputLabel, Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import StatusChip from '../components/StatusChip'
import useService from '../hooks/useService'
import { useAuth } from '../context/AuthContext'

const EMPTY = { title_number: '', seller_name: '', buyer_name: '', property_address: '', sale_amount: '', transfer_date: '' }

export default function TitleTransferPage() {
  const { records, total, page, setPage, loading, create, update, remove } = useService('title-transfers')
  const { hasRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (r) => { setEditing(r); setForm(r); setOpen(true) }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editing) await update(editing.id, form)
      else await create(form)
      setOpen(false)
    } finally { setSubmitting(false) }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Title Transfer & Registration</Typography>
        {!hasRole('agent') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Request</Button>
        )}
      </Stack>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              {['#', 'Title No.', 'Seller', 'Buyer', 'Sale Amount', 'Status', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
            ) : records.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center">No records found.</TableCell></TableRow>
            ) : records.map((r, i) => (
              <TableRow key={r.id} hover>
                <TableCell>{(page - 1) * 15 + i + 1}</TableCell>
                <TableCell>{r.title_number}</TableCell>
                <TableCell>{r.seller_name}</TableCell>
                <TableCell>{r.buyer_name}</TableCell>
                <TableCell>{r.sale_amount ? `₱${Number(r.sale_amount).toLocaleString()}` : '-'}</TableCell>
                <TableCell><StatusChip status={r.status} /></TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                  {hasRole('admin') && <IconButton size="small" color="error" onClick={() => remove(r.id)}><DeleteIcon fontSize="small" /></IconButton>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination count={Math.ceil(total / 15)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update' : 'New'} Title Transfer Request</DialogTitle>
        <DialogContent>
          <TextField label="Title Number" fullWidth margin="normal" required value={form.title_number || ''} onChange={set('title_number')} />
          <TextField label="Seller Name" fullWidth margin="normal" required value={form.seller_name || ''} onChange={set('seller_name')} />
          <TextField label="Buyer Name" fullWidth margin="normal" required value={form.buyer_name || ''} onChange={set('buyer_name')} />
          <TextField label="Property Address" fullWidth margin="normal" required multiline rows={2} value={form.property_address || ''} onChange={set('property_address')} />
          <TextField label="Sale Amount (₱)" type="number" fullWidth margin="normal" value={form.sale_amount || ''} onChange={set('sale_amount')} />
          <TextField label="Transfer Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={form.transfer_date || ''} onChange={set('transfer_date')} />
          {editing && (hasRole('admin') || hasRole('agent')) && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select label="Status" value={form.status || 'pending'} onChange={set('status')}>
                  {['pending','processing','completed','rejected'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Remarks" fullWidth margin="normal" multiline rows={2} value={form.remarks || ''} onChange={set('remarks')} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : editing ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
