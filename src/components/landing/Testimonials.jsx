import { useEffect, useState } from 'react'
import { Box, Container, Typography, Grid, Chip, Avatar, Rating, Skeleton } from '@mui/material'
import { motion } from 'framer-motion'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import { NAVY, GOLD } from '../../theme/theme'
import api from '../../api/axios'

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/testimonials')
      .then(({ data }) => setTestimonials(data))
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && testimonials.length === 0) return null

  return (
    <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: 'background.default' }}>
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="TESTIMONIALS" sx={{ mb: 2, bgcolor: `${GOLD}18`, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.7rem' }} />
            <Typography variant="h2" sx={{ color: 'text.primary', mb: 2, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Trusted by Thousands of Filipinos
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Grid item xs={12} md={6} lg={4} key={i}>
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 3 }} />
                </Grid>
              ))
            : testimonials.map((t, i) => (
                <Grid item xs={12} md={6} lg={4} key={t.id}>
                  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}>
                    <Box sx={{
                      p: 3.5, height: '100%', borderRadius: 3, bgcolor: 'background.paper',
                      border: 1, borderColor: 'divider', boxShadow: 1,
                      position: 'relative',
                    }}>
                      <FormatQuoteIcon sx={{ color: `${GOLD}30`, fontSize: 48, position: 'absolute', top: 16, right: 16 }} />
                      <Rating value={t.rating} readOnly size="small" sx={{ mb: 2, '& .MuiRating-iconFilled': { color: GOLD } }} />
                      <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.8, mb: 3, fontStyle: 'italic' }}>
                        "{t.content}"
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Avatar
                          src={t.avatar_url || undefined}
                          sx={{ bgcolor: NAVY, color: GOLD, fontWeight: 700, width: 44, height: 44 }}
                        >
                          {!t.avatar_url && t.name?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700 }}>{t.name}</Typography>
                          {t.role_label && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.role_label}</Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
              ))
          }
        </Grid>
      </Container>
    </Box>
  )
}
