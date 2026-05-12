import { useState } from 'react'
import { Box, Container, Typography, Chip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import { motion } from 'framer-motion'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { NAVY, GOLD } from '../../theme/theme'

const faqs = [
  { q: 'How long does a title transfer take?', a: 'Standard title transfer processing typically takes 30-60 business days depending on the LRA queue and completeness of documents. Our premium service can expedite this to 15-25 business days.' },
  { q: 'What documents are required for title verification?', a: 'You will need the original or certified copy of the land title (TCT/OCT/CCT), tax declaration, lot plan or sketch, and a valid government ID of the requesting party.' },
  { q: 'Is FilipinoTracks accredited by the LRA?', a: 'Yes. FilipinoTracks operates under the expertise of LARES (Land Registration Systems, Inc.), which is the company behind the Land Titling Computerization Project in the Philippines.' },
  { q: 'Can I track my transaction status online?', a: 'Absolutely. Once you submit a transaction, you will have access to our real-time tracking dashboard where you can monitor every step of your transaction with full audit trail and notifications.' },
  { q: 'What payment methods do you accept?', a: 'We accept GCash, Maya, bank transfer (BDO, BPI, Metrobank), and cash payments at our partner outlets. Online payments are processed through secure, encrypted gateways.' },
  { q: 'Do you handle transactions outside Metro Manila?', a: 'Yes. We have a nationwide network covering all 81 provinces. Our field coordinators can handle transactions in any LRA branch across the Philippines.' },
  { q: 'What if my documents are incomplete?', a: 'Our system will notify you immediately of any missing or deficient documents. You can upload additional files through your portal at any time without starting over.' },
  { q: 'Is my data and documents secure?', a: 'We use bank-grade encryption for all file uploads and data storage. All documents are stored in secure cloud servers with access controls and activity logging.' },
]

export default function FAQ() {
  const [expanded, setExpanded] = useState(false)

  return (
    <Box id="faq" sx={{ py: { xs: 10, md: 14 }, bgcolor: 'white' }}>
      <Container maxWidth="md">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="FAQ" sx={{ mb: 2, bgcolor: `${GOLD}18`, color: GOLD, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.7rem' }} />
            <Typography variant="h2" sx={{ color: NAVY, mb: 2, fontSize: { xs: '2rem', md: '2.8rem' } }}>
              Frequently Asked Questions
            </Typography>
            <Typography variant="h6" sx={{ color: '#5A6A85', fontWeight: 400 }}>
              Everything you need to know about our services.
            </Typography>
          </Box>
        </motion.div>

        <Box>
          {faqs.map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Accordion
                expanded={expanded === i}
                onChange={() => setExpanded(expanded === i ? false : i)}
                elevation={0}
                sx={{
                  mb: 1.5, border: '1px solid #E8EDF5', borderRadius: '12px !important',
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': { borderColor: `${GOLD}40`, boxShadow: `0 0 0 2px ${GOLD}15` },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: expanded === i ? GOLD : '#5A6A85' }} />} sx={{ px: 3, py: 0.5 }}>
                  <Typography variant="subtitle1" sx={{ color: NAVY, fontWeight: 600 }}>{faq.q}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3 }}>
                  <Typography variant="body1" sx={{ color: '#5A6A85', lineHeight: 1.8 }}>{faq.a}</Typography>
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
