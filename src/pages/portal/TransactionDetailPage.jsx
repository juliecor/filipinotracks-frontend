import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Typography, Button, Chip, Paper, Grid, Avatar, Divider,
  Skeleton, Alert, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select,
  FormControl, InputLabel, CircularProgress, Card, CardContent, Table,
  TableBody, TableCell, TableHead, TableRow,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import EditIcon from '@mui/icons-material/Edit'
import EmailIcon from '@mui/icons-material/Email'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import ChatIcon from '@mui/icons-material/Chat'
import SendIcon from '@mui/icons-material/Send'
import MapIcon from '@mui/icons-material/Map'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'
import { useAuth } from '../../context/AuthContext'
import PropertyMapViewer from '../../components/map/PropertyMapViewer'
import PropertyMapEditor from '../../components/map/PropertyMapEditor'

const STATUS_META = {
  'submitted':                { label: 'Submitted',                color: '#8B5CF6', bg: '#F3F0FF' },
  'under review':             { label: 'Under Review',             color: '#3B82F6', bg: '#EFF6FF' },
  'verification ongoing':     { label: 'Verification Ongoing',     color: '#06B6D4', bg: '#ECFEFF' },
  'processing':               { label: 'Processing',               color: '#F59E0B', bg: '#FFFBEB' },
  'waiting for requirements': { label: 'Waiting for Requirements', color: '#F97316', bg: '#FFF7ED' },
  'pending approval':         { label: 'Pending Approval',         color: '#7C3AED', bg: '#F5F3FF' },
  'approved':                 { label: 'Approved',                 color: '#22C55E', bg: '#F0FDF4' },
  'released':                 { label: 'Released',                 color: '#16A34A', bg: '#DCFCE7' },
  'rejected':                 { label: 'Rejected',                 color: '#EF4444', bg: '#FEF2F2' },
}

// Statuses that only ADMIN can set — staff cannot self-approve.
const ADMIN_ONLY_STATUSES = ['approved', 'released', 'rejected']

const SERVICE_LABELS = {
  'title-verification':    'Land / Title Verification',
  'title-cancellation':    'Title Cancellation',
  'land-registration':     'Land Registration',
  'property-consultation': 'Property Consultation',
}

function StatusBadge({ status, size = 'medium' }) {
  const meta = STATUS_META[status] || { label: status, color: '#64748B', bg: '#F1F5F9' }
  const isLg = size === 'large'
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: isLg ? 0.8 : 0.6,
      px: isLg ? 1.5 : 1.2, py: isLg ? 0.6 : 0.4,
      bgcolor: meta.bg, borderRadius: '8px', border: `1px solid ${meta.color}30` }}>
      <Box sx={{ width: isLg ? 8 : 6, height: isLg ? 8 : 6, borderRadius: '50%', bgcolor: meta.color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: isLg ? '0.82rem' : '0.72rem', fontWeight: 700, color: meta.color, whiteSpace: 'nowrap' }}>
        {meta.label}
      </Typography>
    </Box>
  )
}

function InfoField({ label, value }) {
  if (!value) return null
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>{value}</Typography>
    </Box>
  )
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function TransactionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [tx, setTx]             = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [statusDialog, setStatusDialog] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [remarks, setRemarks]   = useState('')
  const [updating, setUpdating] = useState(false)
  const [propertyMap, setPropertyMap] = useState(null)
  const [mapEditorOpen, setMapEditorOpen] = useState(false)

  // Accept / Deny gating state
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [denyDialog, setDenyDialog] = useState(false)
  const [denyReason, setDenyReason] = useState('')

  // Delete-transaction state
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // On-demand email state
  const [emailDialog, setEmailDialog] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailFiles, setEmailFiles] = useState([])         // File[]
  const [emailSending, setEmailSending] = useState(false)
  const [emailResult, setEmailResult] = useState(null)     // { type: 'success'|'error', message }

  const isAdmin = user?.roles?.some(r => r.name === 'admin')
  const isStaff = user?.roles?.some(r => r.name === 'staff' || r.name === 'agent')
  const canEdit = isAdmin || isStaff

  // Chat
  const [messages, setMessages]     = useState([])
  const [chatInput, setChatInput]   = useState('')
  const [sending, setSending]       = useState(false)
  const chatContainerRef            = useRef(null)
  const pollRef                     = useRef(null)

  useEffect(() => {
    api.get(`/transactions/${id}`)
      .then(({ data }) => { setTx(data); setNewStatus(data.status) })
      .catch(() => setError('Transaction not found.'))
      .finally(() => setLoading(false))
    // Load property map if it exists (title verification)
    api.get(`/transactions/${id}/property-map`)
      .then(({ data }) => setPropertyMap(data))
      .catch(() => {})
  }, [id])

  const fetchMessages = () => {
    api.get(`/transactions/${id}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 5000)
    return () => clearInterval(pollRef.current)
  }, [id])

  useEffect(() => {
    const el = chatContainerRef.current
    if (!el) return
    // Only scroll within the chat box — never hijack the page scroll.
    // Skip if the user has scrolled up to read older messages.
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSendMessage = async () => {
    const body = chatInput.trim()
    if (!body || sending) return
    setSending(true)
    setChatInput('')
    try {
      const { data } = await api.post(`/transactions/${id}/messages`, { body })
      setMessages(prev => [...prev, data])
      setTimeout(() => {
        if (chatContainerRef.current)
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }, 50)
    } catch { setChatInput(body) }
    finally { setSending(false) }
  }

  const handleStatusUpdate = async () => {
    setUpdating(true)
    try {
      const { data } = await api.put(`/transactions/${id}`, { status: newStatus, remarks })
      setTx(data)
      setStatusDialog(false)
      setRemarks('')
    } catch { /* silent */ }
    finally { setUpdating(false) }
  }

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    await api.delete(`/documents/${docId}`)
    setTx(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== docId) }))
  }

  // ─── Admin Accept / Deny on a fresh submission ───────────────────
  const handleAccept = async () => {
    setDecisionLoading(true)
    try {
      const { data } = await api.put(`/transactions/${id}`, {
        status: 'verification ongoing',
        remarks: 'Submission accepted — verification in progress.',
      })
      setTx(data)
    } catch { /* silent */ }
    finally { setDecisionLoading(false) }
  }

  const handleDeny = async () => {
    setDecisionLoading(true)
    try {
      const { data } = await api.put(`/transactions/${id}`, {
        status: 'rejected',
        remarks: denyReason.trim() || 'Submission denied.',
      })
      setTx(data)
      setDenyDialog(false)
      setDenyReason('')
    } catch { /* silent */ }
    finally { setDecisionLoading(false) }
  }

  const handleDeleteTransaction = async () => {
    setDeleting(true)
    try {
      await api.delete(`/transactions/${id}`)
      const homePath = isAdmin ? '/admin/transactions' : '/portal/transactions'
      navigate(homePath, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete transaction.')
      setDeleting(false)
    }
  }

  const openEmailDialog = () => {
    setEmailSubject('')
    setEmailBody('')
    setEmailFiles([])
    setEmailResult(null)
    setEmailDialog(true)
  }

  const MAX_EMAIL_FILE_SIZE  = 10 * 1024 * 1024  // 10 MB / file
  const MAX_EMAIL_FILE_COUNT = 5

  const handleAttachFiles = (e) => {
    const incoming = Array.from(e.target.files || [])
    e.target.value = ''  // allow re-selecting the same file later
    const filtered = incoming.filter(f => f.size <= MAX_EMAIL_FILE_SIZE)
    const merged   = [...emailFiles, ...filtered].slice(0, MAX_EMAIL_FILE_COUNT)
    setEmailFiles(merged)
    const rejected = incoming.length - filtered.length
    if (rejected > 0) {
      setEmailResult({ type: 'error', message: `${rejected} file(s) skipped — max ${MAX_EMAIL_FILE_SIZE / 1024 / 1024} MB each.` })
    } else if (emailResult?.type === 'error') {
      setEmailResult(null)
    }
  }

  const handleRemoveAttachment = (i) =>
    setEmailFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleSendEmail = async () => {
    setEmailSending(true)
    setEmailResult(null)
    try {
      const fd = new FormData()
      fd.append('subject', emailSubject.trim())
      fd.append('body',    emailBody.trim())
      emailFiles.forEach((f) => fd.append('attachments[]', f))

      const { data } = await api.post(`/transactions/${id}/email-client`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setEmailResult({ type: 'success', message: data.message || 'Email sent.' })
      setEmailSubject('')
      setEmailBody('')
      setEmailFiles([])
      setTimeout(() => setEmailDialog(false), 1500)
    } catch (err) {
      setEmailResult({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to send email. Try again.',
      })
    } finally {
      setEmailSending(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>
        <Box sx={{ background: `linear-gradient(140deg, #1A3A6E 0%, #245AA0 100%)`, px: { xs: 3, md: 5 }, pt: { xs: 4, md: 5 }, pb: 7 }}>
          <Skeleton width={200} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        </Box>
        <Box sx={{ px: { xs: 3, md: 5 }, py: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}><Skeleton height={400} sx={{ borderRadius: 3 }} /></Grid>
            <Grid item xs={12} md={4}><Skeleton height={400} sx={{ borderRadius: 3 }} /></Grid>
          </Grid>
        </Box>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    )
  }

  const statusMeta = STATUS_META[tx.status] || { color: '#64748B', bg: '#F1F5F9' }

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* ═══ Hero header ═══ */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 },
        pt: { xs: 3, md: 4 },
        pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}
            sx={{ color: 'rgba(255,255,255,0.6)', mb: 2.5, fontWeight: 600, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            Back
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'white', fontSize: { xs: '1.1rem', md: '1.3rem' }, letterSpacing: '0.02em' }}>
                  {tx.transaction_code}
                </Typography>
                <StatusBadge status={tx.status} size="large" />
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.93rem' }}>
                {SERVICE_LABELS[tx.service_type] || tx.service_type} · Filed {new Date(tx.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
              {canEdit && (
                <Tooltip title="Send a custom email to the client">
                  <Button variant="outlined" startIcon={<EmailIcon />}
                    onClick={openEmailDialog}
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.35)', fontWeight: 700,
                      '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                    Email Client
                  </Button>
                </Tooltip>
              )}
              {canEdit && (
                <Button variant="outlined" startIcon={<EditIcon />}
                  onClick={() => { setStatusDialog(true); setNewStatus(tx.status) }}
                  sx={{ color: GOLD, borderColor: `${GOLD}50`, fontWeight: 700,
                    '&:hover': { borderColor: GOLD, bgcolor: `${GOLD}10` } }}>
                  Update Status
                </Button>
              )}
              {isAdmin && (
                <Tooltip title="Delete this transaction permanently">
                  <Button variant="outlined" startIcon={<DeleteIcon />}
                    onClick={() => { setDeleteConfirmText(''); setDeleteDialog(true) }}
                    sx={{ color: '#FCA5A5', borderColor: 'rgba(252,165,165,0.45)', fontWeight: 700,
                      '&:hover': { borderColor: '#EF4444', color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
                    Delete
                  </Button>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ═══ Content ═══ */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>

        {location.state?.new && (
          <Alert severity="success" icon={<CheckCircleOutlinedIcon />} sx={{ mb: 3, borderRadius: 2 }}>
            Transaction submitted successfully! Our team will review your request shortly.
          </Alert>
        )}

        {/* ═══ ADMIN DECISION BANNER — only on fresh submissions ═══ */}
        {isAdmin && tx.status === 'submitted' && (
          <Card sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`,
            border: 'none',
            boxShadow: `0 8px 32px rgba(10,22,40,0.18)`,
            overflow: 'hidden',
          }}>
            <Box sx={{
              p: { xs: 2.5, md: 3 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2.5,
              justifyContent: 'space-between',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 52, height: 52, borderRadius: 2, background: `linear-gradient(135deg, ${GOLD} 0%, #9F7E2C 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '1.4rem' }}>📋</Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: GOLD, letterSpacing: '0.14em', mb: 0.4 }}>
                    NEW SUBMISSION · AWAITING YOUR DECISION
                  </Typography>
                  <Typography sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1rem', md: '1.1rem' }, mb: 0.4, lineHeight: 1.3 }}>
                    Accept this transaction to begin verification
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', maxWidth: 480 }}>
                    Once accepted, you can edit the property map and continue the verification process. Denying will notify the client.
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.2, flexShrink: 0 }}>
                <Button
                  variant="outlined"
                  onClick={() => setDenyDialog(true)}
                  disabled={decisionLoading}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.35)',
                    borderWidth: '1.5px',
                    fontWeight: 700,
                    px: 2.5,
                    '&:hover': { borderColor: '#EF4444', color: '#EF4444', bgcolor: 'rgba(239,68,68,0.08)', borderWidth: '1.5px' },
                  }}
                >
                  Deny
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleAccept}
                  disabled={decisionLoading}
                  startIcon={decisionLoading ? <CircularProgress size={16} sx={{ color: NAVY }} /> : <CheckCircleOutlinedIcon />}
                  sx={{ fontWeight: 800, px: 3 }}
                >
                  {decisionLoading ? 'Working…' : 'Accept'}
                </Button>
              </Box>
            </Box>
          </Card>
        )}

        <Grid container spacing={3}>

          {/* Left column */}
          <Grid item xs={12} md={8}>

            {/* Property info */}
            <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', mb: 3 }}>
              <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #EEF2F7' }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HomeWorkIcon sx={{ fontSize: 18, color: NAVY }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Property Information</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                {[tx.registered_owner, tx.property_title_number, tx.tax_declaration_number, tx.lot_number,
                  tx.block_number, tx.property_address, tx.property_type, tx.lot_area, tx.transfer_type, tx.remarks]
                  .every(v => !v) ? (
                  <Box sx={{ py: 4, textAlign: 'center', color: '#94A3B8' }}>
                    <Typography variant="body2">No property details provided</Typography>
                  </Box>
                ) : (
                  <Grid container>
                    <Grid item xs={12} sm={6}><InfoField label="Registered Owner"    value={tx.registered_owner} /></Grid>
                    <Grid item xs={12} sm={6}><InfoField label="Property Address"    value={tx.property_address} /></Grid>
                    <Grid item xs={12} sm={6}><InfoField label="Title Number"        value={tx.property_title_number} /></Grid>
                    <Grid item xs={12} sm={6}><InfoField label="Tax Dec. Number"     value={tx.tax_declaration_number} /></Grid>
                    <Grid item xs={12} sm={4}><InfoField label="Lot Number"          value={tx.lot_number} /></Grid>
                    <Grid item xs={12} sm={4}><InfoField label="Block Number"        value={tx.block_number} /></Grid>
                    <Grid item xs={12} sm={4}><InfoField label="Lot Area"            value={tx.lot_area ? `${tx.lot_area} sqm` : null} /></Grid>
                    <Grid item xs={12} sm={6}><InfoField label="Property Type"       value={tx.property_type} /></Grid>
                    <Grid item xs={12} sm={6}><InfoField label="Transfer Type"       value={tx.transfer_type} /></Grid>
                    {tx.remarks && (
                      <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #EEF2F7' }}>
                          <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.5 }}>
                            Remarks
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#475569' }}>{tx.remarks}</Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
              <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEF2F7' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${GOLD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AttachFileIcon sx={{ fontSize: 18, color: GOLD }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Documents</Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>{tx.documents?.length || 0} file{tx.documents?.length !== 1 ? 's' : ''} attached</Typography>
                  </Box>
                </Box>
                {!isAdmin && !isStaff && (
                  <Button size="small" startIcon={<AttachFileIcon />} onClick={() => navigate('/portal/documents')}
                    sx={{ color: NAVY, fontWeight: 700, fontSize: '0.78rem', bgcolor: '#F4F6FA', '&:hover': { bgcolor: '#EDF0F7' } }}>
                    Upload
                  </Button>
                )}
              </Box>
              <CardContent sx={{ p: 3 }}>
                {tx.documents?.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                      <AttachFileIcon sx={{ fontSize: 28, color: '#CBD5E1' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>No documents uploaded yet</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <AnimatePresence>
                      {tx.documents.map(doc => {
                        const ext = doc.file_type?.includes('pdf') ? 'PDF' : doc.file_type?.includes('image') ? 'IMG' : 'DOC'
                        const extColor = doc.file_type?.includes('pdf') ? '#EF4444' : doc.file_type?.includes('image') ? '#3B82F6' : '#64748B'
                        return (
                          <motion.div key={doc.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2, border: '1.5px solid #EEF2F7', bgcolor: '#FAFBFC' }}>
                              <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: `${extColor}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: extColor }}>{ext}</Typography>
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {doc.original_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                  {doc.document_type || 'Document'} · {formatBytes(doc.file_size)}
                                </Typography>
                              </Box>
                              <Tooltip title="Open file">
                                <IconButton size="small" component="a" href={doc.url} target="_blank" rel="noreferrer"
                                  sx={{ bgcolor: '#F4F6FA', '&:hover': { bgcolor: `${NAVY}08` } }}>
                                  <OpenInNewIcon sx={{ fontSize: 15, color: '#64748B' }} />
                                </IconButton>
                              </Tooltip>
                              {(isAdmin || doc.uploaded_by === user?.id) && (
                                <Tooltip title="Delete">
                                  <IconButton size="small" onClick={() => handleDeleteDocument(doc.id)}
                                    sx={{ bgcolor: '#FEF2F2', '&:hover': { bgcolor: '#FEE2E2' } }}>
                                    <DeleteIcon sx={{ fontSize: 15, color: '#EF4444' }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={4}>

            {/* Assignment card */}
            <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: NAVY, mb: 2.5 }}>Assignment</Typography>
                <Box sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                    Client
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: NAVY, color: GOLD, fontWeight: 800, fontSize: '0.8rem' }}>
                      {tx.user?.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>{tx.user?.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>{tx.user?.email}</Typography>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />
                <Box>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1 }}>
                    Assigned Staff
                  </Typography>
                  {tx.assigned_staff ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: GOLD, color: NAVY, fontWeight: 800, fontSize: '0.8rem' }}>
                        {tx.assigned_staff?.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>{tx.assigned_staff?.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>{tx.assigned_staff?.email}</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px dashed #E2E8F0' }}>
                      <Typography variant="body2" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>Not yet assigned</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Activity timeline */}
            <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7' }}>
              <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid #EEF2F7' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: NAVY }}>Activity Timeline</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                {tx.logs?.length === 0 ? (
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>No activity recorded yet.</Typography>
                ) : (
                  tx.logs?.map((log, i) => {
                    const isLast = i === tx.logs.length - 1
                    const dotColor = log.to_status ? (STATUS_META[log.to_status]?.color || NAVY) : NAVY
                    return (
                      <Box key={log.id} sx={{ display: 'flex', gap: 1.5, position: 'relative' }}>
                        {!isLast && (
                          <Box sx={{ position: 'absolute', left: 9, top: 24, bottom: -4, width: 1.5, bgcolor: '#E8EDF5' }} />
                        )}
                        <Box sx={{
                          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, mt: 0.3, zIndex: 1,
                          bgcolor: dotColor, boxShadow: `0 0 0 3px white, 0 0 0 4px ${dotColor}30`,
                        }} />
                        <Box sx={{ pb: isLast ? 0 : 3, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: NAVY, fontSize: '0.82rem' }}>{log.action}</Typography>
                          {log.to_status && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                              {log.from_status && (
                                <>
                                  <StatusBadge status={log.from_status} />
                                  <Typography variant="caption" sx={{ color: '#CBD5E1', fontWeight: 700 }}>→</Typography>
                                </>
                              )}
                              <StatusBadge status={log.to_status} />
                            </Box>
                          )}
                          {log.notes && (
                            <Box sx={{ mt: 0.8, p: 1, bgcolor: '#F8FAFC', borderRadius: 1.5, borderLeft: `3px solid ${dotColor}` }}>
                              <Typography variant="caption" sx={{ color: '#475569', fontStyle: 'italic' }}>"{log.notes}"</Typography>
                            </Box>
                          )}
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.68rem', display: 'block', mt: 0.5 }}>
                            by {log.performed_by?.name} · {new Date(log.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ═══ Property Map (Title Verification) ═══ */}
        {propertyMap && (
          <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', mt: 3, overflow: 'hidden' }}>

            {/* Card header */}
            <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: '1px solid #EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${GOLD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapIcon sx={{ fontSize: 18, color: GOLD }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>Property Map</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Location and boundary visualization</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                {propertyMap.latitude && (
                  <Chip label="Location Pinned" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: '0.68rem' }} />
                )}
                {propertyMap.geojson_polygon && (
                  <Chip label="Boundary Mapped" size="small" sx={{ bgcolor: `${GOLD}20`, color: '#A8882A', fontWeight: 700, fontSize: '0.68rem' }} />
                )}
                {canEdit && tx.status !== 'submitted' && tx.status !== 'rejected' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setMapEditorOpen(true)}
                    sx={{
                      ml: 1,
                      bgcolor: NAVY, color: 'white',
                      fontSize: '0.72rem', fontWeight: 700,
                      px: 1.5, py: 0.6,
                      '&:hover': { bgcolor: '#060E1A' },
                    }}
                  >
                    Edit Property Map
                  </Button>
                )}
              </Box>
            </Box>

            {/* Full-width map */}
            <PropertyMapViewer propertyMap={propertyMap} />

            {/* Property detail grid */}
            <Box sx={{ p: 3, borderTop: '1px solid #EEF2F7' }}>
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 2 }}>
                Property Details
              </Typography>
              <Grid container columnSpacing={4} rowSpacing={2}>
                {[
                  ['Registered Owner',  propertyMap.registered_owner],
                  ['Title Number',      propertyMap.title_number],
                  ['Lot Number',        propertyMap.lot_number],
                  ['Block Number',      propertyMap.block_number],
                  ['Survey Plan',       propertyMap.survey_plan_number],
                  ['Tax Declaration',   propertyMap.tax_declaration_number],
                  ['Property Type',     propertyMap.property_type],
                  ['Land Area',         propertyMap.land_area ? `${propertyMap.land_area} sqm` : null],
                  ['Province',          propertyMap.province],
                  ['City / Municipality', propertyMap.city_municipality],
                  ['Barangay',          propertyMap.barangay],
                  ['Full Address',      propertyMap.full_address],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <Grid item xs={12} sm={6} md={3} key={label}>
                    <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.4 }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B', textTransform: 'capitalize', lineHeight: 1.4 }}>
                      {value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {propertyMap.staff_notes && (
                <Box sx={{ mt: 2.5, p: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 2 }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.5 }}>Staff Notes</Typography>
                  <Typography variant="body2" sx={{ color: '#78350F' }}>{propertyMap.staff_notes}</Typography>
                </Box>
              )}

              {/* Technical description table */}
              {propertyMap.boundaries?.some(b => b.degrees) && (
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1.5 }}>
                    Technical Description
                  </Typography>
                  <Box sx={{ overflowX: 'auto', border: '1px solid #EEF2F7', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                          {['Pt From', 'Pt To', 'Bearing', 'Distance (m)'].map(h => (
                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.65rem', color: '#64748B', py: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {propertyMap.boundaries.filter(b => b.degrees).map((b, i) => (
                          <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell sx={{ fontSize: '0.78rem', py: 0.8, fontWeight: 600 }}>{b.point_from || i + 1}</TableCell>
                            <TableCell sx={{ fontSize: '0.78rem', py: 0.8, fontWeight: 600 }}>{b.point_to || i + 2}</TableCell>
                            <TableCell sx={{ fontSize: '0.78rem', py: 0.8, fontFamily: 'monospace', color: NAVY, fontWeight: 700 }}>
                              {b.dir1} {b.degrees}°{b.minutes ? ` ${b.minutes}'` : ''} {b.dir2}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.78rem', py: 0.8, fontWeight: 600 }}>{b.distance}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
        )}

        {/* ═══ Chat ═══ */}
        <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', mt: 3 }}>
          <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #EEF2F7' }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChatIcon sx={{ fontSize: 18, color: NAVY }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>Transaction Chat</Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Messages between you and the handling team</Typography>
            </Box>
          </Box>

          {/* Message list */}
          <Box ref={chatContainerRef} sx={{ height: 380, overflowY: 'auto', px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5,
            '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 4 } }}>
            {messages.length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1' }}>
                <ChatIcon sx={{ fontSize: 44, mb: 1.5, opacity: 0.4 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#94A3B8' }}>No messages yet</Typography>
                <Typography variant="caption" sx={{ color: '#CBD5E1' }}>Start the conversation below</Typography>
              </Box>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id
                return (
                  <Box key={msg.id} sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 1.2, alignItems: 'flex-end' }}>
                    <Avatar
                      src={msg.sender_avatar || undefined}
                      sx={{ width: 30, height: 30, bgcolor: isMe ? GOLD : NAVY, color: isMe ? NAVY : GOLD, fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}
                    >
                      {!msg.sender_avatar && msg.sender_name?.charAt(0)}
                    </Avatar>
                    <Box sx={{ maxWidth: '70%' }}>
                      {!isMe && (
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, px: 0.5, display: 'block', mb: 0.3 }}>
                          {msg.sender_name}
                        </Typography>
                      )}
                      <Box sx={{
                        px: 2, py: 1.2, borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        bgcolor: isMe ? NAVY : 'white',
                        border: isMe ? 'none' : '1px solid #EDF0F7',
                        boxShadow: isMe ? `0 2px 8px ${NAVY}25` : '0 1px 4px rgba(10,22,40,0.06)',
                      }}>
                        <Typography variant="body2" sx={{ color: isMe ? 'white' : '#1E293B', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {msg.body}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#CBD5E1', fontSize: '0.62rem', display: 'block', mt: 0.3, textAlign: isMe ? 'right' : 'left', px: 0.5 }}>
                        {new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} · {new Date(msg.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                  </Box>
                )
              })
            )}
          </Box>

          {/* Input */}
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #EEF2F7', display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder="Type a message…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <Tooltip title="Send (Enter)">
              <span>
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || sending}
                  sx={{
                    bgcolor: NAVY, color: 'white', width: 42, height: 42, flexShrink: 0,
                    '&:hover': { bgcolor: '#1E3A6E' },
                    '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
                  }}
                >
                  {sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Card>

      </Box>

      {/* Property map editor (admin/staff only) */}
      {canEdit && propertyMap && (
        <PropertyMapEditor
          open={mapEditorOpen}
          onClose={() => setMapEditorOpen(false)}
          transactionId={tx.id}
          initialPin={propertyMap.latitude && propertyMap.longitude
            ? { lat: parseFloat(propertyMap.latitude), lng: parseFloat(propertyMap.longitude) }
            : null}
          initialPolygon={propertyMap.geojson_polygon}
          onSaved={(updatedMap) => setPropertyMap(prev => ({ ...prev, ...updatedMap }))}
        />
      )}

      {/* Email Client compose dialog (admin/staff) */}
      <Dialog
        open={emailDialog}
        onClose={() => !emailSending && setEmailDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${GOLD}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmailIcon sx={{ color: GOLD }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1rem', lineHeight: 1.2 }}>
              Email the client
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              To: <strong style={{ color: '#0A1628' }}>{tx.user?.name || 'Client'}</strong>
              {tx.user?.email && (
                <span style={{ color: '#94A3B8' }}> · {tx.user.email}</span>
              )}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E5EAF2', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B' }}>Re:</Typography>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: NAVY, fontSize: '0.85rem' }}>
              {tx.transaction_code}
            </Typography>
            <Chip
              label={SERVICE_LABELS[tx.service_type] || tx.service_type}
              size="small"
              sx={{ ml: 'auto', fontSize: '0.65rem', fontWeight: 700, bgcolor: `${GOLD}18`, color: '#9F7E2C' }}
            />
          </Box>

          <TextField
            fullWidth
            label="Subject"
            placeholder="e.g. Additional document needed"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            disabled={emailSending}
            inputProps={{ maxLength: 140 }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={6}
            label="Message"
            placeholder={`Hi ${tx.user?.name?.split(' ')[0] || 'there'},\n\n…`}
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            disabled={emailSending}
            inputProps={{ maxLength: 5000 }}
            helperText={`${emailBody.length} / 5000 characters`}
          />

          {/* Attachments */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Attachments ({emailFiles.length}/{MAX_EMAIL_FILE_COUNT})
              </Typography>
              <Button
                component="label"
                size="small"
                startIcon={<AttachFileIcon sx={{ fontSize: 16 }} />}
                disabled={emailSending || emailFiles.length >= MAX_EMAIL_FILE_COUNT}
                sx={{ fontSize: '0.72rem', fontWeight: 700, color: GOLD, '&:hover': { bgcolor: `${GOLD}10` } }}
              >
                Add file
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                  onChange={handleAttachFiles}
                />
              </Button>
            </Box>

            {emailFiles.length === 0 ? (
              <Box sx={{
                border: '1.5px dashed', borderColor: 'divider', borderRadius: 2,
                py: 1.5, textAlign: 'center', bgcolor: 'action.hover',
              }}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  📎 Optional · PDF, images, docs · max 10 MB each · up to {MAX_EMAIL_FILE_COUNT} files
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                {emailFiles.map((file, i) => (
                  <Box key={i} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.2,
                    p: 1, pl: 1.5, borderRadius: 1.5,
                    border: 1, borderColor: 'divider', bgcolor: 'background.paper',
                  }}>
                    <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
                        {file.size < 1024 ? `${file.size} B`
                          : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveAttachment(i)}
                      disabled={emailSending}
                      sx={{ color: 'error.main' }}
                      aria-label={`Remove ${file.name}`}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {emailResult && (
            <Alert
              severity={emailResult.type}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {emailResult.message}
            </Alert>
          )}

          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#92400E', lineHeight: 1.6, display: 'block' }}>
              💡 <strong>Tip:</strong> The email is sent from FilipinoTracks but uses your name in the signature. The client can <strong>reply directly</strong> to reach you at <strong>{user?.email}</strong>.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setEmailDialog(false)} disabled={emailSending} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSendEmail}
            disabled={emailSending || !emailSubject.trim() || !emailBody.trim()}
            startIcon={emailSending ? <CircularProgress size={14} sx={{ color: NAVY }} /> : <SendIcon />}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {emailSending ? 'Sending…' : 'Send Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete transaction confirmation (admin only) */}
      <Dialog open={deleteDialog} onClose={() => !deleting && setDeleteDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DeleteIcon sx={{ color: '#DC2626' }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1rem', lineHeight: 1.2 }}>Delete this transaction?</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>This action cannot be undone.</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px solid #E5EAF2', borderRadius: 2, mb: 2 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: NAVY, fontSize: '0.9rem', mb: 0.5 }}>
              {tx.transaction_code}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
              {SERVICE_LABELS[tx.service_type] || tx.service_type}
            </Typography>
            {tx.user?.name && (
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Client: <strong style={{ color: '#0A1628' }}>{tx.user.name}</strong>
              </Typography>
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#475569', mb: 1.5, lineHeight: 1.7 }}>
            All <strong>documents, messages, payments, property map and logs</strong> linked to this transaction will be permanently removed (including uploaded files in storage).
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1 }}>
            Type <strong style={{ color: '#DC2626', fontFamily: 'monospace' }}>{tx.transaction_code}</strong> below to confirm.
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Transaction code"
            autoFocus
            inputProps={{ style: { fontFamily: 'monospace' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(false)} disabled={deleting} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeleteTransaction}
            disabled={deleting || deleteConfirmText.trim() !== tx.transaction_code}
            startIcon={deleting ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <DeleteIcon />}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 700, boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deny confirmation dialog */}
      <Dialog open={denyDialog} onClose={() => !decisionLoading && setDenyDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '1.2rem' }}>✕</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1rem', lineHeight: 1.2 }}>Deny this submission?</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>The client will be notified.</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (shown to client)"
            placeholder="e.g. Title number does not match LRA records. Please re-submit with the correct document."
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDenyDialog(false)} disabled={decisionLoading} sx={{ color: '#64748B', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDeny}
            disabled={decisionLoading}
            startIcon={decisionLoading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : null}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, fontWeight: 700 }}
          >
            {decisionLoading ? 'Denying…' : 'Confirm Deny'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status update dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY, pb: 1 }}>Update Transaction Status</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {!isAdmin && isStaff && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
              Once your review is complete, set status to <strong>Pending Approval</strong>. Only an admin can give the final <strong>Approved</strong> verdict.
            </Alert>
          )}
          <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
            <InputLabel>New Status</InputLabel>
            <Select label="New Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              {Object.keys(STATUS_META).map(s => {
                const isAdminOnly = ADMIN_ONLY_STATUSES.includes(s)
                const disabled = isAdminOnly && !isAdmin
                return (
                  <MenuItem key={s} value={s} disabled={disabled}>
                    <StatusBadge status={s} />
                    {disabled && (
                      <Typography variant="caption" sx={{ ml: 'auto', color: '#94A3B8', fontStyle: 'italic' }}>
                        Admin only
                      </Typography>
                    )}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <TextField fullWidth label="Remarks / Notes (optional)" value={remarks} onChange={e => setRemarks(e.target.value)}
            multiline rows={3} size="small" placeholder="Add notes about this status change…" />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
          <Button onClick={() => setStatusDialog(false)} disabled={updating} sx={{ color: '#64748B' }}>Cancel</Button>
          <Button variant="contained" color="secondary" onClick={handleStatusUpdate}
            disabled={updating || newStatus === tx?.status} sx={{ fontWeight: 700, minWidth: 120 }}>
            {updating ? <CircularProgress size={18} color="inherit" /> : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
