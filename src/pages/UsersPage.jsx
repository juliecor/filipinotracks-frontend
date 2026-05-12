import { useState, useEffect } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, IconButton, CircularProgress, Pagination, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import api from '../api/axios'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async (p = page) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/users?page=${p}`)
      setUsers(data.data)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(page) }, [page])

  const handleEditRole = async () => {
    setSubmitting(true)
    try {
      await api.put(`/admin/users/${editUser.id}`, { role })
      setEditUser(null)
      fetchUsers(page)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    await api.delete(`/admin/users/${id}`)
    fetchUsers(page)
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>User Management</Typography>
      </Stack>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              {['#', 'Name', 'Email', 'Phone', 'Role', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: 'white', fontWeight: 600 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
            ) : users.map((u, i) => (
              <TableRow key={u.id} hover>
                <TableCell>{(page - 1) * 20 + i + 1}</TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phone || '-'}</TableCell>
                <TableCell>
                  <Chip label={u.roles?.[0]?.name || 'none'} size="small"
                    color={u.roles?.[0]?.name === 'admin' ? 'error' : u.roles?.[0]?.name === 'agent' ? 'warning' : 'default'} />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary" onClick={() => { setEditUser(u); setRole(u.roles?.[0]?.name || 'client') }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(u.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex" justifyContent="center" mt={2}>
        <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
      </Box>

      <Dialog open={Boolean(editUser)} onClose={() => setEditUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Role — {editUser?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="agent">Agent</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditRole} disabled={submitting}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
