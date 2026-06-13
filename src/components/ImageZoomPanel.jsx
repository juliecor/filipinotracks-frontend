/**
 * Zoomable / pannable image viewer.
 *
 * Scroll (or the +/- buttons) to zoom, drag to pan when zoomed in. Used as
 * the source-title reference in the review step and inside the lightbox.
 */
import { useRef, useState, useCallback } from 'react'
import { Box, IconButton, Tooltip } from '@mui/material'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { GOLD } from '../theme/theme'

const MIN = 1, MAX = 6

export default function ImageZoomPanel({ src, alt = '', height = 360, rounded = 2 }) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const drag = useRef(null)

  const clampScale = (s) => Math.min(MAX, Math.max(MIN, s))
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }) }
  const zoomBy = (d) => setScale((s) => {
    const next = clampScale(+(s + d).toFixed(2))
    if (next === 1) setPos({ x: 0, y: 0 })
    return next
  })

  const onWheel = useCallback((e) => {
    e.preventDefault()
    setScale((s) => {
      const next = clampScale(+(s - e.deltaY * 0.0015).toFixed(3))
      if (next === 1) setPos({ x: 0, y: 0 })
      return next
    })
  }, [])

  const onPointerDown = (e) => {
    if (scale <= 1) return
    drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current) return
    setPos({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })
  }
  const onPointerUp = () => { drag.current = null }

  return (
    <Box sx={{
      position: 'relative', height, borderRadius: rounded, overflow: 'hidden',
      bgcolor: '#05080F', border: '1px solid', borderColor: 'divider',
    }}>
      <Box
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        sx={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: scale > 1 ? (drag.current ? 'grabbing' : 'grab') : 'default', touchAction: 'none',
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{
            maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: drag.current ? 'none' : 'transform 0.12s ease-out',
          }}
        />
      </Box>

      <Box sx={{
        position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 0.5,
        bgcolor: 'rgba(5,8,15,0.7)', borderRadius: 2, p: 0.3, border: `1px solid ${GOLD}44`,
      }}>
        <Tooltip title="Zoom out"><span>
          <IconButton size="small" onClick={() => zoomBy(-0.5)} disabled={scale <= MIN} sx={{ color: 'white' }}>
            <ZoomOutIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span></Tooltip>
        <Tooltip title="Reset"><span>
          <IconButton size="small" onClick={reset} disabled={scale === 1 && pos.x === 0 && pos.y === 0} sx={{ color: 'white' }}>
            <RestartAltIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span></Tooltip>
        <Tooltip title="Zoom in"><span>
          <IconButton size="small" onClick={() => zoomBy(0.5)} disabled={scale >= MAX} sx={{ color: 'white' }}>
            <ZoomInIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span></Tooltip>
      </Box>
    </Box>
  )
}
