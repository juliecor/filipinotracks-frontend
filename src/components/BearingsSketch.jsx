/**
 * Live planar sketch of a bearings traverse — a north-up SVG preview that
 * redraws as the user edits rows, so OCR slips are visible before the lot
 * is ever pinned on a real map. No Google Maps / geo dependency.
 *
 * When the traverse doesn't close, the gap between the last computed corner
 * and corner 1 is drawn as a dashed red segment.
 */
import { Box, Typography } from '@mui/material'
import { quadrantToTrueBearing } from '../utils/bearingsPlotter'
import { GOLD, NAVY } from '../theme/theme'

export default function BearingsSketch({ bearings, height = 200 }) {
  const placeholder = (msg) => (
    <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>{msg}</Typography>
    </Box>
  )
  if (!bearings || bearings.length < 3) return placeholder('Add at least 3 bearings to preview the lot shape')

  // Walk the traverse on a flat plane (meters; north = +y, east = +x).
  const pts = [{ x: 0, y: 0 }]
  for (const b of bearings) {
    const θ = quadrantToTrueBearing(b.dir1, b.degrees, b.minutes, b.dir2) * Math.PI / 180
    const d = +b.distance || 0
    const prev = pts[pts.length - 1]
    pts.push({ x: prev.x + d * Math.sin(θ), y: prev.y + d * Math.cos(θ) })
  }

  const xs = pts.map(p => p.x), ys = pts.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const span = Math.max(maxX - minX, maxY - minY)
  if (!(span > 0)) return placeholder('Enter the leg distances to preview the lot shape')

  const W = 320, H = height, PAD = 22
  const scale = Math.min((W - PAD * 2) / (maxX - minX || 1), (H - PAD * 2) / (maxY - minY || 1))
  // Center the drawing in the viewBox; flip y so north points up.
  const sx = (x) => PAD + (x - minX) * scale + ((W - PAD * 2) - (maxX - minX) * scale) / 2
  const sy = (y) => H - PAD - (y - minY) * scale - ((H - PAD * 2) - (maxY - minY) * scale) / 2

  const last = pts[pts.length - 1]
  const gap = Math.hypot(last.x - pts[0].x, last.y - pts[0].y)
  const closed = gap < span * 0.005
  const ring = closed ? pts.slice(0, -1) : pts

  const walkPath = ring.map((p, i) => `${i ? 'L' : 'M'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ')

  return (
    <Box sx={{ borderRadius: 2, bgcolor: 'action.hover', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
        {/* Fill (always closed) drawn separately from the stroke so an open
            traverse doesn't get a phantom gold closing edge. */}
        <path d={`${walkPath} Z`} fill={GOLD} fillOpacity={0.22} stroke="none" />
        <path d={walkPath} fill="none" stroke={GOLD} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {!closed && (
          <line
            x1={sx(last.x)} y1={sy(last.y)} x2={sx(pts[0].x)} y2={sy(pts[0].y)}
            stroke="#DC2626" strokeWidth={1.6} strokeDasharray="5 4"
          />
        )}
        {ring.map((p, i) => (
          <g key={i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={7} fill={NAVY} stroke={GOLD} strokeWidth={1.2} />
            <text x={sx(p.x)} y={sy(p.y)} dy={2.8} textAnchor="middle" fill="white" fontSize={8} fontWeight={700}>
              {i + 1}
            </text>
          </g>
        ))}
        <text x={W - 16} y={20} textAnchor="middle" fill="#94A3B8" fontSize={11} fontWeight={700}>N ↑</text>
      </svg>
    </Box>
  )
}
