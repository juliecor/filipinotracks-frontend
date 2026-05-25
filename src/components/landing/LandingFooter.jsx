import { Box, Container, Typography, Grid, IconButton, Divider, Link } from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import TwitterIcon from '@mui/icons-material/Twitter'
import { NAVY, GOLD, GOLD_LIGHT } from '../../theme/theme'

const links = {
  Services: ['Land / Title Verification', 'Title Cancellation', 'Land Registration', 'Property Consultation'],
  Company: ['About Us', 'Our Team', 'Careers', 'Partners', 'Contact'],
  Support: ['Help Center', 'Track Transaction', 'Document Checklist', 'Privacy Policy', 'Terms of Service'],
}

export default function LandingFooter() {
  return (
    <Box sx={{ bgcolor: NAVY, color: 'white', pt: 10, pb: 4 }}>
      <Container maxWidth="xl">
        <Grid container spacing={6} mb={6}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" sx={{ color: NAVY, fontWeight: 800 }}>FT</Typography>
              </Box>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.1 }}>FilipinoTracks</Typography>
                <Typography variant="caption" sx={{ color: GOLD, letterSpacing: '0.1em', fontSize: '0.6rem', fontWeight: 600 }}>PROPERTY SOLUTIONS</Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, mb: 3, maxWidth: 300 }}>
              The Philippines' most trusted property documentation and land transaction platform. Built on the expertise of LARES.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[FacebookIcon, LinkedInIcon, TwitterIcon].map((Icon, i) => (
                <IconButton key={i} size="small" sx={{ color: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', '&:hover': { color: GOLD, bgcolor: `${GOLD}18`, borderColor: `${GOLD}30` } }}>
                  <Icon fontSize="small" />
                </IconButton>
              ))}
            </Box>
          </Grid>

          {Object.entries(links).map(([heading, items]) => (
            <Grid item xs={6} md={2} key={heading}>
              <Typography variant="overline" sx={{ color: GOLD, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
                {heading}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {items.map((item) => (
                  <Link key={item} href="#" underline="none" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', '&:hover': { color: GOLD_LIGHT } }}>
                    {item}
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}

          <Grid item xs={12} md={2}>
            <Typography variant="overline" sx={{ color: GOLD, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.65rem', mb: 2, display: 'block' }}>
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {['info@filipinotracks.ph', '+63 (2) 8XXX-XXXX', 'Makati City, Philippines', 'Mon–Sat: 8AM–6PM'].map((item) => (
                <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{item}</Typography>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 4 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2025 FilipinoTracks. All rights reserved. A subsidiary of LARES.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            LRA Accredited · BIR Registered · DTI Licensed
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}
