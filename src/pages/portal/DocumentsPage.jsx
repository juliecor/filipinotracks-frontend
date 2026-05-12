import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Box, Typography, Button, Card, LinearProgress, Select, MenuItem,
  FormControl, InputLabel, IconButton, Tooltip, Skeleton, CircularProgress, Chip,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

const DOCUMENT_TYPES = [
  'Title / TCT / OCT', 'Tax Declaration', 'Deed of Sale', 'Deed of Donation',
  'Extrajudicial Settlement', 'Survey Plan', 'Tax Clearance', 'ID / Government ID',
  'Certificate of No Improvement', 'Mortgage Document', 'Other',
]

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileTypeBox({ mimeType, size = 40 }) {
  const color = mimeType?.includes('pdf') ? '#EF4444'
    : mimeType?.includes('image') ? '#3B82F6'
    : mimeType?.includes('word') ? '#2563EB'
    : '#64748B'
  const label = mimeType?.includes('pdf') ? 'PDF'
    : mimeType?.includes('image') ? 'IMG'
    : mimeType?.includes('word') ? 'DOC'
    : 'FILE'
  return (
    <Box sx={{ width: size, height: size, bgcolor: `${color}15`, borderRadius: 1.5,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Typography sx={{ fontSize: size > 36 ? '0.6rem' : '0.55rem', fontWeight: 800, color }}>{label}</Typography>
    </Box>
  )
}

export default function DocumentsPage() {
  const [transactions, setTransactions] = useState([])
  const [selectedTx, setSelectedTx]     = useState('')
  const [docType, setDocType]           = useState('')
  const [documents, setDocuments]       = useState([])
  const [uploads, setUploads]           = useState([])
  const [loadingTx, setLoadingTx]       = useState(true)
  const [loadingDocs, setLoadingDocs]   = useState(false)

  useEffect(() => {
    api.get('/transactions?per_page=50')
      .then(({ data }) => setTransactions(data.data || []))
      .finally(() => setLoadingTx(false))
  }, [])

  useEffect(() => {
    if (!selectedTx) return
    setLoadingDocs(true)
    api.get(`/transactions/${selectedTx}`)
      .then(({ data }) => setDocuments(data.documents || []))
      .finally(() => setLoadingDocs(false))
  }, [selectedTx])

  const onDrop = useCallback((acceptedFiles) => {
    const newUploads = acceptedFiles.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      progress: 0,
      status: 'pending',
      error: '',
    }))
    setUploads(prev => [...prev, ...newUploads])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 20 * 1024 * 1024,
    disabled: !selectedTx,
  })

  const uploadFile = async (upload) => {
    if (!selectedTx) return
    setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'uploading', progress: 20 } : u))
    const formData = new FormData()
    formData.append('file', upload.file)
    if (docType) formData.append('document_type', docType)
    try {
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress: 60 } : u))
      const { data } = await api.post(`/transactions/${selectedTx}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'done', progress: 100 } : u))
      setDocuments(prev => [...prev, data])
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed'
      setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error', error: msg } : u))
    }
  }

  const uploadAll = () => uploads.filter(u => u.status === 'pending').forEach(uploadFile)
  const removeUpload = (id) => setUploads(prev => prev.filter(u => u.id !== id))

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    await api.delete(`/documents/${docId}`)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  const pendingCount = uploads.filter(u => u.status === 'pending').length

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <FolderOpenIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Documents</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Upload Documents
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              Attach supporting documents to your property transactions
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {/* Transaction + type selectors */}
        <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', p: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: NAVY, mb: 2 }}>Select Transaction</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 320, bgcolor: 'white' }}>
              <InputLabel>Transaction *</InputLabel>
              <Select label="Transaction *" value={selectedTx} onChange={e => setSelectedTx(e.target.value)}>
                {loadingTx
                  ? <MenuItem disabled>Loading…</MenuItem>
                  : transactions.map(tx => (
                      <MenuItem key={tx.id} value={tx.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: NAVY, fontSize: '0.8rem' }}>
                            {tx.transaction_code}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            — {tx.registered_owner || 'No owner'}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))
                }
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'white' }}>
              <InputLabel>Document Type</InputLabel>
              <Select label="Document Type" value={docType} onChange={e => setDocType(e.target.value)}>
                <MenuItem value="">— Not specified —</MenuItem>
                {DOCUMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          {!selectedTx && (
            <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1.5, display: 'block' }}>
              Select a transaction above to enable document upload
            </Typography>
          )}
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>

          {/* Drop zone + queue */}
          <Box>
            <Box {...getRootProps()} sx={{
              border: `2px dashed ${isDragActive ? GOLD : selectedTx ? '#CBD5E1' : '#E2E8F0'}`,
              borderRadius: 3, p: { xs: 4, md: 6 }, textAlign: 'center',
              cursor: selectedTx ? 'pointer' : 'not-allowed',
              bgcolor: isDragActive ? `${GOLD}08` : selectedTx ? 'white' : '#FAFBFC',
              transition: 'all 0.2s',
              '&:hover': selectedTx ? { borderColor: GOLD, bgcolor: `${GOLD}05` } : {},
            }}>
              <input {...getInputProps()} />
              <Box sx={{
                width: 72, height: 72, borderRadius: '50%', mx: 'auto', mb: 2,
                bgcolor: isDragActive ? `${GOLD}15` : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                <CloudUploadIcon sx={{ fontSize: 34, color: isDragActive ? GOLD : '#CBD5E1' }} />
              </Box>
              {!selectedTx ? (
                <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                  Select a transaction above to upload documents
                </Typography>
              ) : isDragActive ? (
                <Typography variant="body1" sx={{ fontWeight: 800, color: GOLD }}>Drop files here!</Typography>
              ) : (
                <>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: NAVY, mb: 0.5 }}>Drag & drop files here</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>or click to browse your computer</Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {['PDF', 'JPG', 'PNG', 'DOC'].map(ext => (
                      <Chip key={ext} label={ext} size="small"
                        sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F1F5F9', color: '#64748B' }} />
                    ))}
                    <Chip label="Max 20MB" size="small"
                      sx={{ fontSize: '0.65rem', fontWeight: 700, bgcolor: '#FEF3C7', color: '#92400E' }} />
                  </Box>
                </>
              )}
            </Box>

            <AnimatePresence>
              {uploads.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', mt: 2, overflow: 'hidden' }}>
                    <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: NAVY }}>
                        Upload Queue ({uploads.length})
                      </Typography>
                      {pendingCount > 0 && (
                        <Button size="small" variant="contained" color="secondary" onClick={uploadAll}
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                          Upload All ({pendingCount})
                        </Button>
                      )}
                    </Box>
                    {uploads.map(upload => (
                      <Box key={upload.id} sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <FileTypeBox mimeType={upload.file.type} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            {upload.file.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>{formatBytes(upload.file.size)}</Typography>
                          {upload.status === 'uploading' && (
                            <LinearProgress variant="determinate" value={upload.progress}
                              sx={{ mt: 0.5, height: 3, borderRadius: 2 }} />
                          )}
                          {upload.status === 'error' && (
                            <Typography variant="caption" sx={{ color: '#EF4444', display: 'block' }}>{upload.error}</Typography>
                          )}
                        </Box>
                        {upload.status === 'pending' && (
                          <>
                            <Button size="small" onClick={() => uploadFile(upload)}
                              sx={{ fontSize: '0.72rem', fontWeight: 700, color: NAVY, minWidth: 0 }}>Upload</Button>
                            <IconButton size="small" onClick={() => removeUpload(upload.id)}>
                              <DeleteIcon sx={{ fontSize: 15, color: '#94A3B8' }} />
                            </IconButton>
                          </>
                        )}
                        {upload.status === 'uploading' && <CircularProgress size={18} />}
                        {upload.status === 'done' && <CheckCircleIcon sx={{ color: '#22C55E', fontSize: 20 }} />}
                        {upload.status === 'error' && (
                          <>
                            <ErrorIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                            <IconButton size="small" onClick={() => removeUpload(upload.id)}>
                              <DeleteIcon sx={{ fontSize: 15, color: '#94A3B8' }} />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    ))}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* Uploaded documents list */}
          <Box>
            <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', overflow: 'hidden' }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: NAVY }}>
                  Uploaded Documents {selectedTx && documents.length > 0 ? `(${documents.length})` : ''}
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                {!selectedTx ? (
                  <Box sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
                    <AttachFileIcon sx={{ fontSize: 40, mb: 1.5, color: '#CBD5E1' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.5 }}>No transaction selected</Typography>
                    <Typography variant="caption">Select a transaction to view its documents</Typography>
                  </Box>
                ) : loadingDocs ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
                      <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton width="70%" height={18} />
                        <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
                      </Box>
                    </Box>
                  ))
                ) : documents.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
                    <AttachFileIcon sx={{ fontSize: 40, mb: 1.5, color: '#CBD5E1' }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', mb: 0.5 }}>No documents yet</Typography>
                    <Typography variant="caption">Upload files using the dropzone on the left</Typography>
                  </Box>
                ) : (
                  <AnimatePresence>
                    {documents.map(doc => (
                      <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2,
                          border: '1px solid #E8EDF5', mb: 1.5, '&:last-child': { mb: 0 },
                          '&:hover': { borderColor: '#CBD5E1', bgcolor: '#FAFBFC' }, transition: 'all 0.15s' }}>
                          <FileTypeBox mimeType={doc.file_type} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem', color: NAVY }}>
                              {doc.original_name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                              {doc.document_type && (
                                <Chip label={doc.document_type} size="small"
                                  sx={{ fontSize: '0.6rem', height: 17, bgcolor: '#F1F5F9', color: '#64748B' }} />
                              )}
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem' }}>{formatBytes(doc.file_size)}</Typography>
                            </Box>
                          </Box>
                          <Tooltip title="Open file">
                            <IconButton size="small" component="a" href={doc.url} target="_blank" rel="noreferrer"
                              sx={{ bgcolor: '#F4F6FA', '&:hover': { bgcolor: '#E2E8F0' } }}>
                              <OpenInNewIcon sx={{ fontSize: 15, color: '#64748B' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDeleteDoc(doc.id)}
                              sx={{ bgcolor: '#FEF2F2', '&:hover': { bgcolor: '#FECACA' } }}>
                              <DeleteIcon sx={{ fontSize: 15, color: '#EF4444' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </Box>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
