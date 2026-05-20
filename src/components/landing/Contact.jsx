import { Box, Container, Typography, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import { NAVY, GOLD } from '../../theme/theme'

const contacts = [
  {
    icon: <PhoneIcon sx={{ fontSize: 28 }} />,
    color: GOLD,
    title: 'Phone',
    line1: '+63 (2) 8XXX-XXXX',
    line2: '+63 9XX-XXX-XXXX',
  },
  {
    icon: <EmailIcon sx={{ fontSize: 28 }} />,
    color: '#3B82F6',
    title: 'Email',
    line1: 'info@filipinotracks.ph',
    line2: 'support@filipinotracks.ph',
  },
  {
    icon: <LocationOnIcon sx={{ fontSize: 28 }} />,
    color: '#22C55E',
    title: 'Office Address',
    line1: 'Makati City, Philippines',
    line2: 'Metro Manila, Philippines',
  },
  {
    icon: <AccessTimeIcon sx={{ fontSize: 28 }} />,
    color: '#8B5CF6',
    title: 'Office Hours',
    line1: 'Mon – Sat: 8:00 AM – 6:00 PM',
    line2: 'Sunday: Closed',
  },
]

export default function Contact() {
  return (
    <Box id="contact" sx={{ bgcolor: 'background.default' }}>

      {/* Header band */}
      <Box sx={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #0D2045 60%, #1E3A5F 100%)`,
        py: { xs: 8, md: 10 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Chip
            label="CONTACT US"
            sx={{ mb: 2.5, bgcolor: `${GOLD}22`, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.7rem', border: `1px solid ${GOLD}44` }}
          />
          <Typography variant="h2" sx={{ color: 'white', mb: 2, fontSize: { xs: '1.9rem', md: '2.75rem' } }}>
            Get in Touch
            <Box component="span" sx={{ color: GOLD }}> With Us</Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 520, mx: 'auto', lineHeight: 1.8, fontSize: '1.05rem' }}>
            Have questions about your property documents? Our team is ready to help you every step of the way.
          </Typography>
        </motion.div>
      </Box>

      {/* Contact cards — pulled up to overlap header */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box sx={{
          mt: { xs: -4, md: -6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: { xs: 2.5, md: 3 },
          mx: 'auto',
        }}>
          {contacts.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.5 }}
              style={{ height: '100%' }}
            >
              <Box sx={{
                p: { xs: 3, md: 3.5 },
                minHeight: { xs: 220, md: 235 },
                height: '100%',
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                border: '1.5px solid',
                borderColor: 'divider',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 1,
                cursor: 'pointer',
                transition: 'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: `0 18px 40px ${c.color}28`,
                  borderColor: `${c.color}66`,
                  '& .con-icon': { bgcolor: `${c.color}22`, transform: 'scale(1.08)' },
                },
              }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, bgcolor: c.color, borderRadius: '10px 10px 0 0' }} />
                <Box
                  className="con-icon"
                  sx={{
                    width: 58, height: 58, borderRadius: 2.5,
                    bgcolor: `${c.color}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: c.color,
                    mb: 2.5, mt: 0.5,
                    transition: 'all 0.28s ease',
                    flexShrink: 0,
                  }}
                >
                  {c.icon}
                </Box>
                <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 700, mb: 1.2, fontSize: '1rem', lineHeight: 1.3 }}>
                  {c.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, mb: 0.5 }}>
                  {c.line1}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {c.line2}
                </Typography>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Container>

    </Box>
  )
}
