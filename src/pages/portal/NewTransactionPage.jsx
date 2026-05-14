import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Grid, TextField, MenuItem, FormControl,
  InputLabel, Select, Card, CardActionArea, CardContent, CircularProgress, Alert,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PostAddIcon from '@mui/icons-material/PostAdd'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import RuleIcon from '@mui/icons-material/Rule'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'

const SERVICES = [
  { value: 'title-verification',    label: 'Title Verification',       desc: 'Verify authenticity and status of a land title',        icon: '🔍' },
  { value: 'title-transfer',        label: 'Title Transfer',            desc: 'Transfer ownership of property title',                   icon: '🔄' },
  { value: 'tax-declaration',       label: 'Tax Declaration',           desc: 'Process tax declaration for property assessment',        icon: '📋' },
  { value: 'mortgage-annotation',   label: 'Mortgage Annotation',       desc: 'Annotate mortgage or encumbrance on title',              icon: '🏦' },
  { value: 'title-cancellation',    label: 'Title Cancellation',        desc: 'Process cancellation of an existing land title',        icon: '❌' },
  { value: 'land-registration',     label: 'Land Registration',         desc: 'Register a new land with the relevant agencies',         icon: '📝' },
  { value: 'property-consultation', label: 'Property Consultation',     desc: 'Expert consultation on property documentation matters',  icon: '💼' },
  { value: 'document-processing',   label: 'Document Processing',       desc: 'General processing of property-related documents',       icon: '📂' },
]

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed-Use']
const TRANSFER_TYPES = ['Sale', 'Donation', 'Inheritance', 'Exchange', 'Extrajudicial Settlement']

const STEPS = [
  { label: 'Select Service', icon: <PostAddIcon /> },
  { label: 'Property Details', icon: <HomeWorkIcon /> },
  { label: 'Review & Submit', icon: <RuleIcon /> },
]

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

function StepIndicator({ current }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, mb: 4 }}>
      {STEPS.map((step, i) => {
        const done   = i < current
        const active = i === current
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: done ? GOLD : active ? NAVY : '#E2E8F0',
                border: `2px solid ${done ? GOLD : active ? NAVY : '#CBD5E1'}`,
                transition: 'all 0.3s',
              }}>
                {done
                  ? <CheckCircleIcon sx={{ fontSize: 20, color: NAVY }} />
                  : <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: active ? 'white' : '#94A3B8' }}>{i + 1}</Typography>
                }
              </Box>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: active ? 700 : 500, color: active ? NAVY : done ? GOLD : '#94A3B8', whiteSpace: 'nowrap' }}>
                {step.label}
              </Typography>
            </Box>
            {i < STEPS.length - 1 && (
              <Box sx={{ flex: 1, height: 2, bgcolor: done ? GOLD : '#E2E8F0', mx: 1, mb: 2, transition: 'background 0.3s' }} />
            )}
          </Box>
        )
      })}
    </Box>
  )
}

function FieldLabel({ children }) {
  return (
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.3 }}>
      {children}
    </Typography>
  )
}

export default function NewTransactionPage() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)
  const [dir, setDir]         = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm]       = useState({
    service_type: '', property_title_number: '', lot_number: '', block_number: '',
    tax_declaration_number: '', property_address: '', property_type: '',
    lot_area: '', registered_owner: '', transfer_type: '', remarks: '',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const goNext = () => { setDir(1);  setStep(s => s + 1) }
  const goBack = () => { setDir(-1); setStep(s => s - 1) }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''))
      const { data } = await api.post('/transactions', payload)
      navigate(`/portal/transactions/${data.id}`, { state: { new: true } })
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
      setLoading(false)
    }
  }

  const selectedService = SERVICES.find(s => s.value === form.service_type)

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 860, mx: 'auto' }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/portal/transactions')}
            sx={{ color: 'rgba(255,255,255,0.55)', mb: 2, fontWeight: 600, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            Back to Transactions
          </Button>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <PostAddIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>New Request</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Submit a Transaction
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              Complete the form below to request property documentation services
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 860, mx: 'auto' }}>

        <StepIndicator current={step} />

        <Box sx={{ bgcolor: 'white', borderRadius: 3, border: '1px solid #EDF0F7', boxShadow: '0 2px 12px rgba(10,22,40,0.07)', overflow: 'hidden', minHeight: 420 }}>
          <AnimatePresence mode="wait" custom={dir}>

            {/* Step 0: Service selection */}
            {step === 0 && (
              <motion.div key="step0" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <Box sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, mb: 0.5 }}>What service do you need?</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>Choose the type of property documentation service to proceed</Typography>
                  <Grid container spacing={2}>
                    {SERVICES.map(svc => {
                      const active = form.service_type === svc.value
                      return (
                        <Grid item xs={12} sm={6} key={svc.value}>
                          <Card elevation={0} sx={{
                            border: active ? `2px solid ${GOLD}` : '1.5px solid #E8EDF5',
                            borderRadius: 2.5,
                            bgcolor: active ? `${GOLD}08` : 'white',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: active ? GOLD : '#CBD5E1', boxShadow: '0 4px 12px rgba(10,22,40,0.08)' },
                          }}>
                            <CardActionArea onClick={() => {
                              if (svc.value === 'title-verification') { navigate('/portal/title-verification'); return; }
                              setForm(f => ({ ...f, service_type: svc.value }))
                            }} sx={{ p: 2 }}>
                              <CardContent sx={{ p: '0 !important' }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                  <Box sx={{
                                    width: 42, height: 42, borderRadius: 2, flexShrink: 0,
                                    bgcolor: active ? `${GOLD}15` : '#F4F6FA',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem',
                                  }}>
                                    {svc.icon}
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700, color: active ? NAVY : '#334155' }}>{svc.label}</Typography>
                                      {active && <CheckCircleIcon sx={{ fontSize: 18, color: GOLD }} />}
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#64748B', lineHeight: 1.3 }}>{svc.desc}</Typography>
                                  </Box>
                                </Box>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </Grid>
                      )
                    })}
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, pt: 3, borderTop: '1px solid #F1F5F9' }}>
                    <Button variant="contained" color="secondary" endIcon={<ArrowForwardIcon />}
                      disabled={!form.service_type} onClick={goNext}
                      sx={{ fontWeight: 700, px: 4, py: 1.2 }}>
                      Continue
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* Step 1: Property details */}
            {step === 1 && (
              <motion.div key="step1" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <Box sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ fontSize: '1.5rem' }}>{selectedService?.icon}</Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>Property Details</Typography>
                      <Typography variant="caption" sx={{ color: GOLD, fontWeight: 700 }}>{selectedService?.label}</Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={2.5}>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Registered Owner" value={form.registered_owner} onChange={set('registered_owner')}
                        size="small" placeholder="Name as it appears on title"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Property Address" value={form.property_address} onChange={set('property_address')}
                        size="small" placeholder="Complete property address"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Title Number (TCT/OCT)" value={form.property_title_number} onChange={set('property_title_number')}
                        size="small" placeholder="e.g. TCT-12345"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth label="Tax Declaration Number" value={form.tax_declaration_number} onChange={set('tax_declaration_number')}
                        size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="Lot Number" value={form.lot_number} onChange={set('lot_number')} size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="Block Number" value={form.block_number} onChange={set('block_number')} size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField fullWidth label="Lot Area (sqm)" type="number" value={form.lot_area} onChange={set('lot_area')} size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Property Type</InputLabel>
                        <Select label="Property Type" value={form.property_type} onChange={set('property_type')}
                          sx={{ borderRadius: 2 }}>
                          <MenuItem value="">— Select —</MenuItem>
                          {PROPERTY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    {form.service_type === 'title-transfer' && (
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Transfer Type</InputLabel>
                          <Select label="Transfer Type" value={form.transfer_type} onChange={set('transfer_type')}
                            sx={{ borderRadius: 2 }}>
                            <MenuItem value="">— Select —</MenuItem>
                            {TRANSFER_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField fullWidth label="Additional Remarks" value={form.remarks} onChange={set('remarks')}
                        multiline rows={3} size="small" placeholder="Any special instructions or additional information…"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    </Grid>
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid #F1F5F9' }}>
                    <Button onClick={goBack} startIcon={<ArrowBackIcon />} sx={{ color: '#64748B', fontWeight: 600 }}>Back</Button>
                    <Button variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={goNext}
                      sx={{ fontWeight: 700, px: 4, py: 1.2 }}>
                      Review
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <motion.div key="step2" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                <Box sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, mb: 0.5 }}>Review Your Request</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>Please confirm all details before submitting</Typography>

                  {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

                  {/* Service card */}
                  <Box sx={{ bgcolor: `${GOLD}08`, border: `1.5px solid ${GOLD}30`, borderRadius: 2.5, p: 2.5, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ fontSize: '2rem' }}>{selectedService?.icon}</Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>{selectedService?.label}</Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>{selectedService?.desc}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Details grid */}
                  <Box sx={{ bgcolor: '#F8FAFC', border: '1px solid #E8EDF5', borderRadius: 2.5, p: 2.5, mb: 3 }}>
                    <Grid container spacing={2}>
                      {[
                        ['Registered Owner',  form.registered_owner],
                        ['Property Address',  form.property_address],
                        ['Title Number',      form.property_title_number],
                        ['Tax Dec. Number',   form.tax_declaration_number],
                        ['Lot Number',        form.lot_number],
                        ['Block Number',      form.block_number],
                        ['Lot Area',          form.lot_area ? `${form.lot_area} sqm` : ''],
                        ['Property Type',     form.property_type],
                        ['Transfer Type',     form.transfer_type],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <Grid item xs={12} sm={6} key={label}>
                          <FieldLabel>{label}</FieldLabel>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: NAVY }}>{value}</Typography>
                        </Grid>
                      ))}
                      {form.remarks && (
                        <Grid item xs={12}>
                          <FieldLabel>Additional Remarks</FieldLabel>
                          <Typography variant="body2" sx={{ color: '#475569' }}>{form.remarks}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 3, borderTop: '1px solid #F1F5F9' }}>
                    <Button onClick={goBack} startIcon={<ArrowBackIcon />} disabled={loading}
                      sx={{ color: '#64748B', fontWeight: 600 }}>Back</Button>
                    <Button variant="contained" color="secondary" onClick={handleSubmit} disabled={loading}
                      sx={{ fontWeight: 700, px: 4, py: 1.2, minWidth: 160, boxShadow: `0 8px 24px ${GOLD}50` }}>
                      {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Request'}
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            )}

          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  )
}
