import { Box, Container, Typography, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import VerifiedIcon from '@mui/icons-material/Verified'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ArticleIcon from '@mui/icons-material/Article'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import CancelIcon from '@mui/icons-material/Cancel'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import FolderCopyIcon from '@mui/icons-material/FolderCopy'
import { NAVY, GOLD } from '../../theme/theme'

const services = [
  { icon: <VerifiedIcon sx={{ fontSize: 30 }} />, title: 'Title Verification', desc: 'Authenticate and verify the legitimacy of land titles with LRA database cross-referencing.', color: '#3B82F6', tag: 'Most Popular' },
  { icon: <SwapHorizIcon sx={{ fontSize: 30 }} />, title: 'Transfer of Title', desc: 'Complete end-to-end title transfer processing from deed of sale to new TCT/OCT issuance.', color: GOLD, tag: '' },
  { icon: <ArticleIcon sx={{ fontSize: 30 }} />, title: 'Tax Declaration', desc: 'New declaration, transfer, correction, and cancellation of real property tax declarations.', color: '#22C55E', tag: '' },
  { icon: <HomeWorkIcon sx={{ fontSize: 30 }} />, title: 'Mortgage Annotation', desc: 'REM registration, cancellation of mortgage, and other liens or encumbrances on titles.', color: '#8B5CF6', tag: '' },
  { icon: <CancelIcon sx={{ fontSize: 30 }} />, title: 'Title Cancellation', desc: 'Legal cancellation of lost, destroyed, or superseded land titles with court coordination.', color: '#EF4444', tag: '' },
  { icon: <AccountBalanceIcon sx={{ fontSize: 30 }} />, title: 'Land Registration', desc: 'Original registration of unregistered lands, judicial and administrative proceedings.', color: '#06B6D4', tag: 'Premium' },
  { icon: <SupportAgentIcon sx={{ fontSize: 30 }} />, title: 'Property Consultation', desc: 'Expert advice on property rights, title issues, boundary disputes, and legal strategies.', color: '#F59E0B', tag: '' },
  { icon: <FolderCopyIcon sx={{ fontSize: 30 }} />, title: 'Document Processing', desc: 'Notarization, certification, and processing of all real estate related documents.', color: '#EC4899', tag: '' },
]

export default function Services() {
  return (
    <Box id="services" sx={{ bgcolor: '#F0F4FA' }}>
      {/* Header band */}
      <Box sx={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #0D2045 60%, #1E3A5F 100%)`,
        py: { xs: 8, md: 10 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* subtle grid pattern */}
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Chip
            label="OUR SERVICES"
            sx={{ mb: 2.5, bgcolor: `${GOLD}22`, color: GOLD, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.7rem', border: `1px solid ${GOLD}44` }}
          />
          <Typography variant="h2" sx={{ color: 'white', mb: 2, fontSize: { xs: '1.9rem', md: '2.75rem' } }}>
            Complete Property Documentation
            <Box component="span" sx={{ color: GOLD }}> Solutions</Box>
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', maxWidth: 580, mx: 'auto', lineHeight: 1.8, fontSize: '1.05rem' }}>
            From title verification to full registration — we handle every aspect of your property documentation needs.
          </Typography>
        </motion.div>
      </Box>

      {/* Cards grid — pulled up slightly to overlap the header */}
      <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
        <Box sx={{
          mt: { xs: -4, md: -6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: { xs: 2.5, md: 3 },
          mx: 'auto',
        }}>
            {services.map((service, i) => (
              <motion.div
                key={service.title}
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
                  bgcolor: 'white',
                  border: '1.5px solid #E4EAF4',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 12px rgba(10,22,40,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 18px 40px ${service.color}28`,
                    borderColor: `${service.color}66`,
                    '& .svc-icon': {
                      bgcolor: `${service.color}22`,
                      transform: 'scale(1.08)',
                    },
                  },
                }}>
                  {/* top colored bar */}
                  <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                    bgcolor: service.color,
                    borderRadius: '10px 10px 0 0',
                  }} />

                  {/* optional badge */}
                  {service.tag && (
                    <Chip
                      label={service.tag}
                      size="small"
                      sx={{
                        position: 'absolute', top: 18, right: 16,
                        bgcolor: `${service.color}18`,
                        color: service.color,
                        fontWeight: 700,
                        fontSize: '0.62rem',
                        height: 22,
                        border: `1px solid ${service.color}33`,
                      }}
                    />
                  )}

                  {/* icon circle */}
                  <Box
                    className="svc-icon"
                    sx={{
                      width: 58, height: 58, borderRadius: 2.5,
                      bgcolor: `${service.color}14`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: service.color,
                      mb: 2.5, mt: 0.5,
                      transition: 'all 0.28s ease',
                      flexShrink: 0,
                    }}
                  >
                    {service.icon}
                  </Box>

                  <Typography variant="h6" sx={{ color: NAVY, fontWeight: 700, mb: 1.2, fontSize: '1rem', lineHeight: 1.3 }}>
                    {service.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#5A6A85', lineHeight: 1.75, flexGrow: 1 }}>
                    {service.desc}
                  </Typography>
                </Box>
              </motion.div>
            ))}
        </Box>
      </Container>
    </Box>
  )
}
