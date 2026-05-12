import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, TextField, Button, Rating,
  Alert, CircularProgress, Chip, Avatar, Skeleton,
} from '@mui/material'
import { motion } from 'framer-motion'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import EditIcon from '@mui/icons-material/Edit'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'
import { useAuth } from '../../context/AuthContext'

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' }

export default function TestimonialPage() {
  const { user } = useAuth()
  const [testimonial, setTestimonial] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [form, setForm]               = useState({ role_label: '', rating: 5, content: '' })
  const [msg, setMsg]                 = useState({ type: '', text: '' })
  const [saving, setSaving]           = useState(false)
  const [hovered, setHovered]         = useState(-1)
  const [editing, setEditing]         = useState(false)

  useEffect(() => {
    api.get('/testimonials/mine')
      .then(({ data }) => {
        if (data) {
          setTestimonial(data)
          setForm({ role_label: data.role_label || '', rating: data.rating || 5, content: data.content || '' })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (form.content.trim().length < 20) {
      setMsg({ type: 'error', text: 'Your review must be at least 20 characters.' })
      return
    }
    setSaving(true)
    setMsg({ type: '', text: '' })
    try {
      const { data } = await api.post('/testimonials', form)
      setTestimonial(data)
      setEditing(false)
      setMsg({ type: 'success', text: 'Thank you! Your review has been submitted and is pending approval.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !testimonial || testimonial.status === 'rejected'

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero */}
      <Box sx={{
        background: `linear-gradient(140deg, #1A3A6E 0%, #1E4A88 55%, #245AA0 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6.5 },
      }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6,
            borderRadius: '20px', bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
            <StarIcon sx={{ fontSize: 12, color: GOLD }} />
            <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              My Review
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.6, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
            Share Your Experience
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
            Your review helps other Filipinos trust FilipinoTracks
          </Typography>
        </motion.div>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 680, mx: 'auto' }}>

        {loading ? (
          <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 3 }} />

        ) : testimonial?.status === 'approved' && !editing ? (
          /* ── Published review ── */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card sx={{ overflow: 'hidden', boxShadow: '0 4px 24px rgba(10,22,40,0.08)', border: '1px solid #EDF0F7' }}>
              <Box sx={{ p: 3, background: `linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)`, borderBottom: '1px solid #BBF7D0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon sx={{ color: '#22C55E', fontSize: 28 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#14532D', fontSize: '1rem' }}>
                      Your review is live!
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#166534' }}>
                      It appears on the FilipinoTracks landing page
                    </Typography>
                  </Box>
                  <Chip label="Published" size="small"
                    sx={{ ml: 'auto', bgcolor: '#22C55E', color: 'white', fontWeight: 700, fontSize: '0.68rem' }} />
                </Box>
              </Box>

              <Box sx={{ p: 3.5, position: 'relative' }}>
                <FormatQuoteIcon sx={{ color: `${GOLD}25`, fontSize: 56, position: 'absolute', top: 12, right: 16 }} />
                <Rating value={testimonial.rating} readOnly sx={{ mb: 1.5, '& .MuiRating-iconFilled': { color: GOLD } }} />
                <Typography sx={{ color: '#374151', lineHeight: 1.8, fontStyle: 'italic', mb: 3, fontSize: '1.05rem' }}>
                  "{testimonial.content}"
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 2, borderTop: '1px solid #F0F4F8' }}>
                  <Avatar src={user?.profile_picture_url || undefined}
                    sx={{ bgcolor: NAVY, color: GOLD, fontWeight: 800, width: 44, height: 44 }}>
                    {!user?.profile_picture_url && user?.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: NAVY }}>{user?.name}</Typography>
                    {testimonial.role_label && (
                      <Typography variant="caption" sx={{ color: '#64748B' }}>{testimonial.role_label}</Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Card>
          </motion.div>

        ) : testimonial?.status === 'pending' && !editing ? (
          /* ── Pending review ── */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card sx={{ overflow: 'hidden', boxShadow: '0 4px 24px rgba(10,22,40,0.08)', border: '1px solid #EDF0F7' }}>
              <Box sx={{ p: 3, background: `linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)`, borderBottom: '1px solid #FDE68A' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <HourglassEmptyIcon sx={{ color: '#D97706', fontSize: 26 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#78350F', fontSize: '1rem' }}>
                      Review submitted — under review
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#92400E' }}>
                      Our admin team will approve it shortly
                    </Typography>
                  </Box>
                  <Chip label="Pending" size="small"
                    sx={{ ml: 'auto', bgcolor: '#F59E0B', color: 'white', fontWeight: 700, fontSize: '0.68rem' }} />
                </Box>
              </Box>
              <Box sx={{ p: 3.5 }}>
                <Rating value={testimonial.rating} readOnly sx={{ mb: 1.5, '& .MuiRating-iconFilled': { color: GOLD } }} />
                <Typography sx={{ color: '#374151', lineHeight: 1.8, fontStyle: 'italic', fontSize: '1.02rem' }}>
                  "{testimonial.content}"
                </Typography>
                {testimonial.role_label && (
                  <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1.5, display: 'block' }}>
                    — {testimonial.role_label}
                  </Typography>
                )}
              </Box>
            </Card>
          </motion.div>

        ) : (
          /* ── Submission form (new or rejected) ── */
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

            {testimonial?.status === 'rejected' && !editing && (
              <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
                Your previous review was not approved. You can submit a new one below.
              </Alert>
            )}

            {msg.text && (
              <Alert severity={msg.type} sx={{ mb: 2.5, borderRadius: 2 }}>{msg.text}</Alert>
            )}

            <Card sx={{ overflow: 'hidden', boxShadow: '0 4px 24px rgba(10,22,40,0.08)', border: '1px solid #EDF0F7' }}>

              {/* Card header */}
              <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid #F0F4F8',
                background: `linear-gradient(135deg, ${NAVY}05 0%, ${GOLD}04 100%)` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: `${GOLD}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StarIcon sx={{ color: GOLD, fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>
                      Write Your Review
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                      Be honest — your feedback helps improve our service
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>

                {/* Star rating */}
                <Box sx={{ mb: 3, p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #EDF0F7', textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: NAVY, mb: 1.5 }}>
                    Overall Rating
                  </Typography>
                  <Rating
                    value={form.rating}
                    onChange={(_, v) => setForm(f => ({ ...f, rating: v || 5 }))}
                    onChangeActive={(_, v) => setHovered(v)}
                    emptyIcon={<StarBorderIcon fontSize="inherit" />}
                    sx={{
                      fontSize: '3rem',
                      '& .MuiRating-iconFilled': { color: GOLD },
                      '& .MuiRating-iconHover': { color: GOLD },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: GOLD, fontWeight: 700, display: 'block', mt: 0.5, fontSize: '0.85rem' }}>
                    {RATING_LABELS[hovered !== -1 ? hovered : form.rating]}
                  </Typography>
                </Box>

                {/* Role label */}
                <TextField
                  fullWidth
                  label="How would you describe yourself? (optional)"
                  placeholder="e.g. First-time Home Buyer · Makati City"
                  size="small"
                  value={form.role_label}
                  onChange={e => setForm(f => ({ ...f, role_label: e.target.value }))}
                  sx={{ mb: 2.5 }}
                  inputProps={{ maxLength: 120 }}
                />

                {/* Review text */}
                <TextField
                  fullWidth
                  label="Your Review"
                  multiline
                  rows={5}
                  placeholder="Tell us about your experience — what went well, what you loved, how we helped you..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  inputProps={{ maxLength: 1000 }}
                  helperText={
                    <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{form.content.length < 20 ? `${20 - form.content.length} more characters needed` : 'Looks good!'}</span>
                      <span>{form.content.length}/1000</span>
                    </Box>
                  }
                  FormHelperTextProps={{
                    sx: { color: form.content.length >= 20 ? '#22C55E' : '#94A3B8', mx: 0 }
                  }}
                  sx={{ mb: 3 }}
                />

                {/* Submit */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <StarIcon />}
                  onClick={handleSubmit}
                  disabled={saving || form.content.trim().length < 20}
                  sx={{
                    py: 1.5, fontWeight: 800, fontSize: '1rem',
                    background: `linear-gradient(135deg, #C9A84C 0%, #A8882A 100%)`,
                    color: NAVY,
                    boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
                    '&:hover': { background: `linear-gradient(135deg, #D4AF5C 0%, #C9A84C 100%)` },
                    '&:disabled': { opacity: 0.5 },
                  }}
                >
                  {saving ? 'Submitting…' : 'Submit My Review'}
                </Button>

                <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', textAlign: 'center', mt: 1.5 }}>
                  Reviews are reviewed by our admin team before appearing on the site.
                </Typography>
              </Box>
            </Card>
          </motion.div>
        )}
      </Box>
    </Box>
  )
}
