/**
 * Rotate + crop a title image before scanning.
 *
 * Two explicit stages (rotate, then crop) so each canvas bake operates on a
 * normal, untransformed bitmap — no combined transform-coordinate math.
 */
import { useEffect, useRef, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Button, Slider,
  IconButton, Tooltip, Typography, ToggleButtonGroup, ToggleButton, CircularProgress,
} from '@mui/material'
import RotateLeftIcon from '@mui/icons-material/RotateLeft'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import CropIcon from '@mui/icons-material/Crop'
import Rotate90DegreesCcwIcon from '@mui/icons-material/Rotate90DegreesCcw'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { rotateImageFile, cropImageFile } from '../utils/imageEdit'
import { GOLD, NAVY } from '../theme/theme'

const DEFAULT_CROP = { x: 0.06, y: 0.06, w: 0.88, h: 0.88 }

export default function ImageEditDialog({ open, file, onApply, onClose }) {
  const [stage, setStage] = useState('rotate')
  const [working, setWorking] = useState(file)
  const [angle, setAngle] = useState(0)
  const [busy, setBusy] = useState(false)
  const [crop, setCrop] = useState(DEFAULT_CROP)
  const [box, setBox] = useState(null)         // displayed container size {w,h}
  const [url, setUrl] = useState(null)
  const containerRef = useRef(null)
  const dragRef = useRef(null)

  // (Re)initialise whenever a new file is opened.
  useEffect(() => {
    if (!open) return
    setStage('rotate'); setWorking(file); setAngle(0); setCrop(DEFAULT_CROP)
  }, [open, file])

  // Create the preview URL in an effect (revoked on change/unmount) so we
  // never render a revoked blob URL under StrictMode's double-invoke.
  useEffect(() => {
    if (!working) { setUrl(null); return }
    const u = URL.createObjectURL(working)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [working])

  const fitBox = (img) => {
    const maxW = Math.min(window.innerWidth - 96, 700)
    const maxH = window.innerHeight * 0.5
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
    setBox({ w: Math.round(img.naturalWidth * scale), h: Math.round(img.naturalHeight * scale) })
  }

  const bakeRotation = async (deg) => {
    setBusy(true)
    try {
      const next = await rotateImageFile(working, deg)
      setWorking(next); setAngle(0)
    } finally { setBusy(false) }
  }

  const applyCrop = async () => {
    setBusy(true)
    try {
      const next = await cropImageFile(working, crop)
      setWorking(next); setCrop(DEFAULT_CROP)
    } finally { setBusy(false) }
  }

  /* ── Crop box drag/resize (pointer coords → fractions) ── */
  const onPointerDown = (mode) => (e) => {
    e.stopPropagation()
    const rect = containerRef.current.getBoundingClientRect()
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, rect, orig: { ...crop } }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = (e.clientX - d.startX) / d.rect.width
    const dy = (e.clientY - d.startY) / d.rect.height
    setCrop(() => {
      let { x, y, w, h } = d.orig
      if (d.mode === 'move') {
        x = Math.min(Math.max(0, x + dx), 1 - w)
        y = Math.min(Math.max(0, y + dy), 1 - h)
      } else {
        w = Math.min(Math.max(0.08, w + dx), 1 - x)
        h = Math.min(Math.max(0.08, h + dy), 1 - y)
      }
      return { x, y, w, h }
    })
  }
  const onPointerUp = () => { dragRef.current = null }

  const handleSave = () => { onApply?.(working); onClose?.() }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md"
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CropIcon sx={{ color: GOLD }} /> Edit image before scanning
      </DialogTitle>
      <DialogContent>
        <ToggleButtonGroup
          value={stage} exclusive size="small" sx={{ mb: 2 }}
          onChange={(_, v) => v && setStage(v)}
        >
          <ToggleButton value="rotate" sx={{ fontWeight: 700 }}><RotateRightIcon sx={{ fontSize: 16, mr: 0.5 }} /> Rotate</ToggleButton>
          <ToggleButton value="crop" sx={{ fontWeight: 700 }}><CropIcon sx={{ fontSize: 16, mr: 0.5 }} /> Crop</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#05080F', borderRadius: 2, p: 2, minHeight: 240, position: 'relative' }}>
          {url && (
            <Box
              ref={containerRef}
              sx={{ position: 'relative', width: box?.w, height: box?.h, maxWidth: '100%' }}
            >
              <img
                src={url}
                alt="edit"
                onLoad={(e) => fitBox(e.currentTarget)}
                draggable={false}
                style={{
                  width: box ? box.w : 'auto', height: box ? box.h : 'auto', maxWidth: '100%',
                  display: 'block',
                  transform: stage === 'rotate' ? `rotate(${angle}deg)` : 'none',
                  transition: 'transform 0.15s',
                }}
              />

              {/* Crop overlay */}
              {stage === 'crop' && box && (
                <Box
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  sx={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                >
                  {/* Dim everything outside the crop window (4 panels) */}
                  <Box sx={{ position: 'absolute', left: 0, right: 0, top: 0, height: `${crop.y * 100}%`, bgcolor: 'rgba(5,8,15,0.55)' }} />
                  <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(1 - crop.y - crop.h) * 100}%`, bgcolor: 'rgba(5,8,15,0.55)' }} />
                  <Box sx={{ position: 'absolute', left: 0, top: `${crop.y * 100}%`, width: `${crop.x * 100}%`, height: `${crop.h * 100}%`, bgcolor: 'rgba(5,8,15,0.55)' }} />
                  <Box sx={{ position: 'absolute', right: 0, top: `${crop.y * 100}%`, width: `${(1 - crop.x - crop.w) * 100}%`, height: `${crop.h * 100}%`, bgcolor: 'rgba(5,8,15,0.55)' }} />
                  {/* Crop window */}
                  <Box
                    onPointerDown={onPointerDown('move')}
                    sx={{
                      position: 'absolute',
                      left: `${crop.x * 100}%`, top: `${crop.y * 100}%`,
                      width: `${crop.w * 100}%`, height: `${crop.h * 100}%`,
                      border: `2px solid ${GOLD}`, cursor: 'move', touchAction: 'none',
                      backgroundImage: `linear-gradient(${GOLD}22 1px, transparent 1px), linear-gradient(90deg, ${GOLD}22 1px, transparent 1px)`,
                      backgroundSize: '33.33% 33.33%',
                    }}
                  >
                    <Box
                      onPointerDown={onPointerDown('resize')}
                      sx={{
                        position: 'absolute', right: -9, bottom: -9, width: 18, height: 18,
                        borderRadius: '50%', bgcolor: GOLD, border: `2px solid ${NAVY}`,
                        cursor: 'nwse-resize', touchAction: 'none',
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {busy && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(5,8,15,0.4)' }}>
              <CircularProgress sx={{ color: GOLD }} />
            </Box>
          )}
        </Box>

        {/* Stage controls */}
        {stage === 'rotate' ? (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 1 }}>
              <Tooltip title="Rotate 90° left">
                <IconButton onClick={() => bakeRotation(-90)} disabled={busy}><RotateLeftIcon /></IconButton>
              </Tooltip>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 60, textAlign: 'center' }}>
                {angle > 0 ? '+' : ''}{angle}°
              </Typography>
              <Tooltip title="Rotate 90° right">
                <IconButton onClick={() => bakeRotation(90)} disabled={busy}><RotateRightIcon /></IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ px: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rotate90DegreesCcwIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Slider
                value={angle} min={-45} max={45} step={1} color="secondary"
                valueLabelDisplay="auto" onChange={(_, v) => setAngle(v)}
              />
              <Button size="small" disabled={!angle || busy} onClick={() => bakeRotation(angle)} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                Apply tilt
              </Button>
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', textAlign: 'center', mt: 1 }}>
              Straighten a tilted photo with the slider, or rotate in 90° steps. Tilt is baked when you click <strong>Apply tilt</strong>.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.74rem', color: 'text.secondary' }}>
              Drag the box to frame just the title, then apply.
            </Typography>
            <Button size="small" startIcon={<CropIcon />} variant="outlined" disabled={busy} onClick={applyCrop} sx={{ fontWeight: 700 }}>
              Apply crop
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button startIcon={<RestartAltIcon />} onClick={() => { setWorking(file); setAngle(0); setCrop(DEFAULT_CROP) }} sx={{ color: 'text.secondary', mr: 'auto' }}>
          Revert
        </Button>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" color="secondary" onClick={handleSave} disabled={busy} sx={{ fontWeight: 800 }}>
          Use this image
        </Button>
      </DialogActions>
    </Dialog>
  )
}
