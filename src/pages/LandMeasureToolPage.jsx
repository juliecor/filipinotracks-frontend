import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Container, Typography, Chip, Stack, Button, Divider } from '@mui/material'
import { motion } from 'framer-motion'
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded'
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined'
import LandingNav from '../components/landing/LandingNav'
import LandingFooter from '../components/landing/LandingFooter'
import PropertyBoundaryDrawer from '../components/map/PropertyBoundaryDrawer'
import {
  computePolygonArea, computeSideMeasurements, formatArea, formatDistance,
} from '../utils/propertyGeo'
import { NAVY, NAVY_DEEP, NAVY_LINE, GOLD, GOLD_LIGHT, GOLD_DARK, TEXT_MUTED } from '../theme/theme'

function StatTile({ icon, label, value, highlight }) {
  return (
    <Box sx={{
      p: 1.75, borderRadius: 2,
      border: 1, borderColor: highlight ? GOLD : 'divider',
      bgcolor: highlight ? `${GOLD}0E` : 'background.paper',
      display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
        display: 'grid', placeItems: 'center',
        bgcolor: highlight ? `${GOLD}22` : `${NAVY}0F`,
        color: highlight ? GOLD_DARK : NAVY,
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.08em' }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: highlight ? '1.25rem' : '1rem', lineHeight: 1.2 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

export default function LandMeasureToolPage() {
  const navigate = useNavigate()
  const [points, setPoints] = useState([])

  const hasPolygon = points.length >= 3
  const area      = useMemo(() => hasPolygon ? computePolygonArea(points) : 0, [points, hasPolygon])
  const sides     = useMemo(() => hasPolygon ? computeSideMeasurements(points) : [], [points, hasPolygon])
  const perimeter = useMemo(() => sides.reduce((s, x) => s + x.length, 0), [sides])
  const hectares  = area > 0 ? (area / 10000) : 0

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh' }}>
      <LandingNav />

      {/* Hero */}
      <Box sx={{
        pt: { xs: 11, md: 14 }, pb: { xs: 5, md: 7 },
        background: `linear-gradient(155deg, ${NAVY_LINE} 0%, ${NAVY} 55%, ${NAVY_DEEP} 100%)`,
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <Box aria-hidden sx={{
          position: 'absolute', inset: 0, opacity: 0.16,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at 40% 0%, #862424 40%, transparent 80%)',
        }} />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Chip
              label="FREE TOOL · NO SIGN-UP"
              size="small"
              sx={{ mb: 2, bgcolor: `${GOLD}22`, color: GOLD_LIGHT, fontWeight: 800, letterSpacing: '0.14em', fontSize: '0.65rem', border: `1px solid ${GOLD}44` }}
            />
            <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.1, letterSpacing: '-0.02em', mb: 2 }}>
              Measure Your Land,{' '}
              <Box component="span" sx={{ color: GOLD_LIGHT }}>Instantly.</Box>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 620 }}>
              Draw your property boundary on the map and get the approximate land area (sqm &amp; hectares),
              perimeter, and the length of every side — right away. No account needed.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* Tool */}
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.8fr 1fr' }, gap: { xs: 3, md: 4 }, alignItems: 'start' }}>
          {/* Drawer */}
          <Box>
            <PropertyBoundaryDrawer points={points} onChange={setPoints} mapHeight={580} />
            <Typography sx={{ mt: 1.5, fontSize: '0.78rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 16, color: GOLD_DARK }} />
              Tip: use the search box on the map to jump to your town, then click to drop boundary points.
            </Typography>
          </Box>

          {/* Results */}
          <Box sx={{ position: { md: 'sticky' }, top: { md: 90 } }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.14em', mb: 1.5 }}>
              YOUR MEASUREMENT
            </Typography>

            {!hasPolygon ? (
              <Box sx={{
                p: 4, borderRadius: 3, textAlign: 'center',
                border: '2px dashed', borderColor: 'divider', bgcolor: 'background.paper',
              }}>
                <Box sx={{ width: 60, height: 60, mx: 'auto', mb: 2, borderRadius: '50%', bgcolor: `${GOLD}14`, color: GOLD_DARK, display: 'grid', placeItems: 'center' }}>
                  <TouchAppOutlinedIcon sx={{ fontSize: 30 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                  Start drawing your land
                </Typography>
                <Typography sx={{ fontSize: '0.86rem', color: 'text.secondary', lineHeight: 1.6 }}>
                  Click at least <strong>3 points</strong> on the map to form your property boundary.
                  Your measurements will appear here.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                <StatTile highlight icon={<LandscapeOutlinedIcon />} label="APPROX. LAND AREA"
                  value={formatArea(area)} />
                <Stack direction="row" spacing={1.5}>
                  <Box sx={{ flex: 1 }}>
                    <StatTile icon={<StraightenOutlinedIcon sx={{ fontSize: 20 }} />} label="PERIMETER" value={formatDistance(perimeter)} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <StatTile icon={<TimelineOutlinedIcon sx={{ fontSize: 20 }} />} label="SIDES" value={`${sides.length}`} />
                  </Box>
                </Stack>

                {/* Per-side breakdown */}
                <Box sx={{ p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
                  <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: TEXT_MUTED, letterSpacing: '0.08em', mb: 1 }}>
                    SIDE LENGTHS
                  </Typography>
                  <Stack spacing={0.5}>
                    {sides.map((s, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Side {i + 1}</Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', fontFamily: 'ui-monospace, monospace' }}>
                          {formatDistance(s.length)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', lineHeight: 1.5, textAlign: 'center' }}>
                  Approximate — computed from your plotted points. For official figures, have your land surveyed and verified.
                </Typography>
              </Stack>
            )}

            {/* CTA */}
            <Box sx={{
              mt: 2.5, p: 2.5, borderRadius: 3,
              background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`, color: '#fff',
            }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <VerifiedRoundedIcon sx={{ color: GOLD_LIGHT, fontSize: 20 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>Make it official</Typography>
              </Stack>
              <Typography sx={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.86rem', lineHeight: 1.6, mb: 2 }}>
                Want this boundary professionally verified, mapped, and documented? FilipinoTracks handles
                title verification, registration, and more.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained" fullWidth
                  onClick={() => navigate('/register')}
                  sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: NAVY,
                    '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
                  }}
                >
                  Get Verified
                </Button>
                <Button
                  variant="outlined" fullWidth
                  onClick={() => navigate('/properties')}
                  sx={{ fontWeight: 700, color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: GOLD_LIGHT, color: GOLD_LIGHT } }}
                >
                  Browse Properties
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>

      <Divider />
      <LandingFooter />
    </Box>
  )
}
