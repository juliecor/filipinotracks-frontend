import { Box, Container, Typography, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import { NAVY, GOLD, NAVY_MID } from '../../theme/theme'

const steps = [
  { num: '01', title: 'Submit Request', desc: 'Create an account, fill in your property details, and submit your transaction request online.' },
  { num: '02', title: 'Upload Documents', desc: 'Securely upload all required documents — title copies, IDs, deed of sale, and supporting papers.' },
  { num: '03', title: 'Expert Review', desc: 'Our licensed processors review your documents and coordinate with LRA, BIR, and local government.' },
  { num: '04', title: 'Real-Time Tracking', desc: 'Monitor your transaction status in real time via your personalized dashboard with full audit trail.' },
  { num: '05', title: 'Approval & Release', desc: 'Once approved, we release your processed documents — physically or via secure digital download.' },
]

export default function Process() {
  return (
    <Box id="process" sx={{ py: { xs: 10, md: 14 }, background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 100%)`, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Chip label="HOW IT WORKS" sx={{ mb: 2, bgcolor: `${GOLD}18`, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.7rem' }} />
            <Typography variant="h2" sx={{ color: 'white', mb: 2, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Simple. Fast. Reliable.
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 400, maxWidth: 550, mx: 'auto', lineHeight: 1.7 }}>
              Our streamlined process makes property documentation effortless from start to finish.
            </Typography>
          </Box>
        </motion.div>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' },
          gap: { xs: 2.5, md: 3 },
          maxWidth: 1180,
          mx: 'auto',
        }}>
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} style={{ height: '100%' }}>
                <Box sx={{
                  height: '100%',
                  minHeight: 255,
                  p: { xs: 3, md: 3.25 },
                  borderRadius: 2.5,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.16)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.28s ease, border-color 0.28s ease, background 0.28s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    background: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(201,168,76,0.42)',
                  },
                }}>
                  <Box sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    mb: 2.5,
                    background: i === 0 ? `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)` : 'rgba(255,255,255,0.08)',
                    border: `2px solid ${i === 0 ? GOLD : 'rgba(201,168,76,0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: i === 0 ? `0 0 30px ${GOLD}44` : 'none',
                  }}>
                    <Typography variant="h6" sx={{ color: i === 0 ? NAVY : GOLD, fontWeight: 800 }}>{step.num}</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1.25, fontSize: '1rem', lineHeight: 1.35 }}>{step.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.66)', lineHeight: 1.7, fontSize: '0.86rem' }}>{step.desc}</Typography>
                </Box>
              </motion.div>
            ))}
        </Box>
      </Container>
    </Box>
  )
}
