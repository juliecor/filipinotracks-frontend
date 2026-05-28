import { OverlayView } from '@react-google-maps/api'
import { Box, Typography } from '@mui/material'
import { NAVY, GOLD, GOLD_LIGHT } from '../../theme/theme'
import {
  computePolygonArea, computeSideMeasurements,
  formatArea, formatDistance, getPolygonCentroid,
} from '../../utils/propertyGeo'

const centerOffset = (w, h) => ({ x: -w / 2, y: -h / 2 })

export default function PolygonMeasurements({ paths, compact = false }) {
  if (!paths || paths.length < 3) return null
  if (!window.google?.maps?.geometry) return null

  const sides    = computeSideMeasurements(paths)
  const area     = computePolygonArea(paths)
  const centroid = getPolygonCentroid(paths)

  return (
    <>
      {/* Per-side length labels at edge midpoints */}
      {sides.map((s, idx) => (
        <OverlayView
          key={`side-${idx}`}
          position={s.midpoint}
          mapPaneName={OverlayView.FLOAT_PANE}
          getPixelPositionOffset={centerOffset}
        >
          <Box
            sx={{
              pointerEvents: 'none',
              userSelect: 'none',
              display: 'inline-block',
              px: 0.9, py: 0.25,
              bgcolor: 'rgba(255,255,255,0.96)',
              color: NAVY,
              border: `1px solid ${GOLD}`,
              borderRadius: 1,
              boxShadow: '0 2px 8px rgba(10,22,40,0.28)',
              fontSize: compact ? '0.62rem' : '0.7rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
              lineHeight: 1.2,
            }}
          >
            {formatDistance(s.length)}
          </Box>
        </OverlayView>
      ))}

      {/* Area label at polygon centroid */}
      {centroid && area > 0 && (
        <OverlayView
          position={centroid}
          mapPaneName={OverlayView.FLOAT_PANE}
          getPixelPositionOffset={centerOffset}
        >
          <Box
            sx={{
              pointerEvents: 'none',
              userSelect: 'none',
              display: 'inline-block',
              px: 1.3, py: 0.6,
              bgcolor: NAVY,
              color: '#fff',
              border: `2px solid ${GOLD}`,
              borderRadius: 1.5,
              boxShadow: '0 6px 18px rgba(10,22,40,0.45)',
              textAlign: 'center',
              minWidth: 96,
            }}
          >
            <Typography
              sx={{
                fontSize: '0.55rem',
                fontWeight: 800,
                color: GOLD_LIGHT,
                letterSpacing: '0.16em',
                lineHeight: 1,
              }}
            >
              APPROX. AREA
            </Typography>
            <Typography
              sx={{
                fontSize: compact ? '0.78rem' : '0.85rem',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.2,
                mt: 0.3,
                whiteSpace: 'nowrap',
              }}
            >
              {formatArea(area)}
            </Typography>
          </Box>
        </OverlayView>
      )}
    </>
  )
}
