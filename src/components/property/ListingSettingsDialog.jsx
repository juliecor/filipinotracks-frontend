import { useEffect, useState } from 'react'
import {
  Dialog, DialogActions, Box, Typography, IconButton, Button, Stack,
  TextField, InputAdornment, Switch, FormControlLabel, Alert, CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import api from '../../api/axios'
import { NAVY, GOLD, GOLD_LIGHT, GOLD_DARK } from '../../theme/theme'

const SHAREABLE_STATUSES = ['approved', 'released']

/**
 * Admin dialog to set a property's public-listing fields:
 *  - asking price
 *  - "Featured" flag (shows on the landing page carousel)
 *  - a short marketing blurb shown on the public page
 *
 * Props:
 *  - open, onClose()
 *  - propertyMap  — the PropertyMap object
 *  - onSaved(updatedFields)  — { price, is_featured, listing_blurb }
 */
export default function ListingSettingsDialog({ open, onClose, propertyMap, onSaved }) {
  const [price, setPrice]       = useState('')
  const [featured, setFeatured] = useState(false)
  const [blurb, setBlurb]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!open || !propertyMap) return
    setPrice(propertyMap.price != null ? String(propertyMap.price) : '')
    setFeatured(!!propertyMap.is_featured)
    setBlurb(propertyMap.listing_blurb || '')
    setError('')
  }, [open, propertyMap])

  const status = propertyMap?.transaction?.status
  const isShareable = SHAREABLE_STATUSES.includes(status)

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        price: price === '' ? null : Number(price),
        is_featured: featured,
        listing_blurb: blurb.trim() || null,
      }
      const { data } = await api.put(`/admin/property-maps/${propertyMap.id}/listing`, payload)
      onSaved?.({
        price: data.price,
        is_featured: data.is_featured,
        listing_blurb: data.listing_blurb,
      })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save listing settings.')
    } finally {
      setSaving(false)
    }
  }

  const previewPrice = price !== '' && !isNaN(Number(price))
    ? `₱${Number(price).toLocaleString('en-PH')}`
    : null

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      sx={{ '& .MuiDialog-paper': { borderRadius: 3, overflow: 'hidden' } }}
      BackdropProps={{ sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(10,22,40,0.55)' } }}
    >
      {/* Header */}
      <Box sx={{
        px: 2.5, py: 1.75, display: 'flex', alignItems: 'center', gap: 1.25,
        background: `linear-gradient(135deg, ${NAVY} 0%, #13284A 100%)`,
        borderBottom: `2px solid ${GOLD}`, color: '#fff',
      }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 1.5, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: NAVY }}>
          <SellOutlinedIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: GOLD_LIGHT, letterSpacing: '0.14em' }}>
            LISTING & PRICING
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {propertyMap?.registered_owner || 'Property'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={saving} aria-label="Close"
          sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {!isShareable && (
          <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            This property isn't approved yet, so listing details won't be public until its transaction is <strong>approved</strong> or <strong>released</strong>.
          </Alert>
        )}

        <Stack spacing={2.5}>
          {/* Price */}
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.1em', mb: 0.75 }}>
              ASKING PRICE
            </Typography>
            <TextField
              fullWidth
              type="number"
              placeholder="e.g. 2500000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Typography sx={{ fontWeight: 800, color: 'text.secondary' }}>₱</Typography></InputAdornment>,
              }}
              helperText={previewPrice ? `Shows as ${previewPrice}` : 'Leave blank to hide the price'}
            />
          </Box>

          {/* Featured */}
          <Box sx={{
            p: 1.5, borderRadius: 2, border: 1,
            borderColor: featured ? GOLD : 'divider',
            bgcolor: featured ? `${GOLD}0E` : 'transparent',
            transition: 'all 0.15s',
          }}>
            <FormControlLabel
              sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
              labelPlacement="start"
              control={<Switch checked={featured} onChange={(e) => setFeatured(e.target.checked)} color="warning" />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <StarRoundedIcon sx={{ fontSize: 18, color: featured ? GOLD_DARK : 'text.disabled' }} />
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>Feature on homepage</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Show in the landing-page carousel</Typography>
                  </Box>
                </Box>
              }
            />
          </Box>

          {/* Blurb */}
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: GOLD_DARK, letterSpacing: '0.1em', mb: 0.75 }}>
              SHORT DESCRIPTION
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="e.g. Prime residential lot near the highway, clean title, ready for transfer."
              value={blurb}
              onChange={(e) => setBlurb(e.target.value.slice(0, 280))}
              helperText={`${blurb.length}/280 — shown on the public property page`}
            />
          </Box>
        </Stack>
      </Box>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 0, gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} sx={{ color: NAVY }} /> : <SellOutlinedIcon />}
          sx={{
            fontWeight: 800, px: 3,
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
            color: NAVY,
            '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
          }}
        >
          {saving ? 'Saving…' : 'Save Listing'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
