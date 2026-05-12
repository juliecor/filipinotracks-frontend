import { Box, Container, Typography, Grid, Chip, Avatar, Rating } from '@mui/material'
import { motion } from 'framer-motion'
import FormatQuoteIcon from '@mui/icons-material/FormatQuote'
import { NAVY, GOLD } from '../../theme/theme'

const testimonials = [
  { name: 'Maria Santos', role: 'Real Estate Broker, Quezon City', rating: 5, text: 'FilipinoTracks made the title transfer process so smooth. What used to take months now takes weeks. Their team is professional and always responsive.', avatar: 'MS' },
  { name: 'Jose Reyes', role: 'Property Developer, Cebu', rating: 5, text: 'We use FilipinoTracks for all our subdivision title processing. The real-time tracking dashboard gives us and our clients peace of mind throughout the process.', avatar: 'JR' },
  { name: 'Ana Cruz', role: 'First-time Home Buyer, BGC', rating: 5, text: 'As a first-time buyer, the process was intimidating. FilipinoTracks guided me every step of the way. My title was processed without any issues!', avatar: 'AC' },
  { name: 'Roberto Lim', role: 'Investor & Property Owner, Davao', rating: 5, text: 'The mortgage annotation and title verification services are top notch. Accurate, fast, and compliant with all LRA requirements. Highly recommended.', avatar: 'RL' },
  { name: 'Dr. Carmen Vega', role: 'Medical Professional, Makati', rating: 5, text: 'I needed title verification urgently before a property purchase. FilipinoTracks delivered within 3 business days. Saved me from a potentially fraudulent deal.', avatar: 'CV' },
  { name: 'Engr. Paulo Garcia', role: 'Civil Engineer, Pampanga', rating: 5, text: 'Their document upload portal and real-time status tracking eliminated the need for me to physically go to their office. Pure convenience.', avatar: 'PG' },
]

export default function Testimonials() {
  return (
    <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#F5F7FA' }}>
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="TESTIMONIALS" sx={{ mb: 2, bgcolor: `${GOLD}18`, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.7rem' }} />
            <Typography variant="h2" sx={{ color: NAVY, mb: 2, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Trusted by Thousands of Filipinos
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {testimonials.map((t, i) => (
            <Grid item xs={12} md={6} lg={4} key={t.name}>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ y: -4 }}>
                <Box sx={{
                  p: 3.5, height: '100%', borderRadius: 3, bgcolor: 'white',
                  border: '1px solid #E8EDF5', boxShadow: '0 4px 24px rgba(10,22,40,0.05)',
                  position: 'relative',
                }}>
                  <FormatQuoteIcon sx={{ color: `${GOLD}30`, fontSize: 48, position: 'absolute', top: 16, right: 16 }} />
                  <Rating value={t.rating} readOnly size="small" sx={{ mb: 2, '& .MuiRating-iconFilled': { color: GOLD } }} />
                  <Typography variant="body1" sx={{ color: '#374151', lineHeight: 1.8, mb: 3, fontStyle: 'italic' }}>
                    "{t.text}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 2, borderTop: '1px solid #F0F4F8' }}>
                    <Avatar sx={{ bgcolor: NAVY, color: GOLD, fontWeight: 700, width: 44, height: 44 }}>{t.avatar}</Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: NAVY, fontWeight: 700 }}>{t.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#5A6A85' }}>{t.role}</Typography>
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
