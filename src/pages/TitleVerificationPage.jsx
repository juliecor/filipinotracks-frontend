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

const EMPTY = { title_number: '', property_owner: '', property_address: '', lot_number: '', block_number: '', survey_number: '' }

export default function TitleVerificationPage() {
  const { records, total, page, setPage, loading, create, update, remove } = useService('title-verifications')
  const { hasRole } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [submitting, setSubmitting] = useState(false)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const openCreate = () => { setEditing(null); setForm(EMPTY); setOpen(true) }
  const openEdit = (r) => { setEditing(r); setForm(r); setOpen(true) }
  const handleClose = () => setOpen(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      if (editing) await update(editing.id, form)
      else await create(form)
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Title Verification</Typography>
        {!hasRole('agent') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Request</Button>
        )}
      </Stack>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              {['#', 'Title No.', 'Property Owner', 'Address', 'Status', 'Client', 'Agent', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
            ) : records.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center">No records found.</TableCell></TableRow>
            ) : records.map((r, i) => (
              <TableRow key={r.id} hover>
                <TableCell>{(page - 1) * 15 + i + 1}</TableCell>
                <TableCell>{r.title_number}</TableCell>
                <TableCell>{r.property_owner}</TableCell>
                <TableCell>{r.property_address}</TableCell>
                <TableCell><StatusChip status={r.status} /></TableCell>
                <TableCell>{r.user?.name ?? '-'}</TableCell>
                <TableCell>{r.agent?.name ?? 'Unassigned'}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                  {hasRole('admin') && (
                    <IconButton size="small" color="error" onClick={() => remove(r.id)}><DeleteIcon fontSize="small" /></IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination count={Math.ceil(total / 15)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Update' : 'New'} Title Verification Request</DialogTitle>
        <DialogContent>
          <TextField label="Title Number" fullWidth margin="normal" required value={form.title_number || ''} onChange={set('title_number')} />
          <TextField label="Property Owner" fullWidth margin="normal" required value={form.property_owner || ''} onChange={set('property_owner')} />
          <TextField label="Property Address" fullWidth margin="normal" required multiline rows={2} value={form.property_address || ''} onChange={set('property_address')} />
          <TextField label="Lot Number" fullWidth margin="normal" value={form.lot_number || ''} onChange={set('lot_number')} />
          <TextField label="Block Number" fullWidth margin="normal" value={form.block_number || ''} onChange={set('block_number')} />
          <TextField label="Survey Number" fullWidth margin="normal" value={form.survey_number || ''} onChange={set('survey_number')} />
          {editing && (hasRole('admin') || hasRole('agent')) && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={form.status || 'pending'} onChange={set('status')}>
                {['pending','processing','completed','rejected'].map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {editing && (hasRole('admin') || hasRole('agent')) && (
            <TextField label="Remarks" fullWidth margin="normal" multiline rows={2} value={form.remarks || ''} onChange={set('remarks')} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : editing ? 'Update' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
