import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Container, Typography, Chip, Stack } from '@mui/material'
import { motion } from 'framer-motion'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined'
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import api from '../../api/axios'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK } from '../../theme/theme'

const peso = (n) => '₱' + Number(n).toLocaleString('en-PH')

function FeaturedCard({ p, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.4) }}
      style={{ height: '100%' }}
    >
      <Box
        component={RouterLink}
        to={`/p/${p.transaction_code}`}
        sx={{
          display: 'flex', flexDirection: 'column', height: '100%',
          textDecoration: 'none',
          borderRadius: 3, overflow: 'hidden',
          bgcolor: 'background.paper',
          border: 1, borderColor: 'divider',
          boxShadow: '0 4px 24px rgba(10,22,40,0.06)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 16px 40px rgba(10,22,40,0.14)',
            '& .feat-img': { transform: 'scale(1.06)' },
          },
        }}
      >
        {/* Cover */}
        <Box sx={{ position: 'relative', height: 190, overflow: 'hidden', bgcolor: NAVY }}>
          {p.cover_photo ? (
            <Box
              component="img"
              className="feat-img"
              src={p.cover_photo}
              alt={p.registered_owner || 'Property'}
              loading="lazy"
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
            />
          ) : (
            <Box className="feat-img" sx={{
              width: '100%', height: '100%', display: 'grid', placeItems: 'center',
              background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`,
              transition: 'transform 0.5s ease',
            }}>
              <LandscapeOutlinedIcon sx={{ fontSize: 48, color: `${GOLD}88` }} />
            </Box>
          )}

          {/* Featured badge */}
          <Box sx={{
            position: 'absolute', top: 10, left: 10,
            display: 'inline-flex', alignItems: 'center', gap: 0.4,
            px: 1, py: 0.4, borderRadius: 1,
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
            color: NAVY,
          }}>
            <StarRoundedIcon sx={{ fontSize: 13 }} />
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em' }}>FEATURED</Typography>
          </Box>

          {/* Price chip */}
          {p.price > 0 && (
            <Box sx={{
              position: 'absolute', bottom: 10, right: 10,
              px: 1.2, py: 0.5, borderRadius: 1.5,
              bgcolor: 'rgba(10,22,40,0.82)', backdropFilter: 'blur(6px)',
              color: '#fff',
            }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 800 }}>{peso(p.price)}</Typography>
            </Box>
          )}
        </Box>

        {/* Body */}
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1rem', lineHeight: 1.3, mb: 0.5 }} noWrap>
            {p.registered_owner || 'Verified Property'}
          </Typography>

          {(p.city_municipality || p.province) && (
            <Stack direction="row" spacing={0.4} alignItems="center" sx={{ color: 'text.secondary', mb: 1 }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 14, color: GOLD_DARK }} />
              <Typography sx={{ fontSize: '0.8rem' }} noWrap>
                {[p.city_municipality, p.province].filter(Boolean).join(', ')}
              </Typography>
            </Stack>
          )}

          {p.listing_blurb && (
            <Typography sx={{
              fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.5, mb: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {p.listing_blurb}
            </Typography>
          )}

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 'auto', pt: 1, color: 'text.secondary' }}>
            {p.land_area > 0 && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <StraightenOutlinedIcon sx={{ fontSize: 14 }} />
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 600 }}>
                  {Number(p.land_area).toLocaleString()} sqm
                </Typography>
              </Stack>
            )}
            {p.views > 0 && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <VisibilityOutlinedIcon sx={{ fontSize: 14 }} />
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 600 }}>{p.views}</Typography>
              </Stack>
            )}
            <Box sx={{ flex: 1 }} />
            <ArrowForwardRoundedIcon sx={{ fontSize: 18, color: GOLD_DARK }} />
          </Stack>
        </Box>
      </Box>
    </motion.div>
  )
}

export default function FeaturedProperties() {
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get('/public/featured-properties')
      .then(({ data }) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true))
  }, [])

  // Render nothing until loaded, and nothing if there are no featured properties
  if (!loaded || items.length === 0) return null

  return (
    <Box id="featured" sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Chip
              label="FEATURED PROPERTIES"
              sx={{ mb: 2, bgcolor: `${GOLD}1A`, color: GOLD_DARK, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.7rem', border: `1px solid ${GOLD}40` }}
            />
            <Typography variant="h2" sx={{ color: 'text.primary', mb: 1.5, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              Verified Properties
              <Box component="span" sx={{ color: GOLD }}> Worth a Look</Box>
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 560, mx: 'auto', lineHeight: 1.7, fontSize: '1.02rem' }}>
              Hand-picked, FilipinoTracks-verified properties with mapped boundaries and clean documentation.
            </Typography>
          </motion.div>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: { xs: 2.5, md: 3 },
        }}>
          {items.map((p, i) => (
            <FeaturedCard key={p.transaction_code} p={p} index={i} />
          ))}
        </Box>
      </Container>
    </Box>
  )
}
