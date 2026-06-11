/**
 * Surveyor-style PDF generators — two deliverables that mirror the
 * standard Philippine surveying output (Zaragoza Surveying et al.):
 *
 *   1. LAND TITLE MAP   — Google-Earth-style satellite with the parcel
 *                         outlined in gold + a branded FilipinoTracks
 *                         title block at the bottom.
 *
 *   2. TECHNICAL PLOT   — Bearings/distances table + AutoCAD-style
 *                         vector drawing of the polygon with numbered
 *                         corners (the "plotting" sheet).
 *
 * Both are generated client-side with jsPDF — no extra dependencies.
 */

import jsPDF from 'jspdf'
import { polygonAreaSqm } from './polygonGis'

/* ─── Brand tokens (kept inline so this util has no theme dep) ───── */
const NAVY     = '#0A1628'
const NAVY_INK = '#13284A'
const GOLD     = '#C9A24A'
const GOLD_DK  = '#9F7E2C'
const GREY     = '#64748B'
const LINE     = '#94A3B8'
const LIGHT    = '#F1F5F9'

/* ─── Helpers ─────────────────────────────────────────────────────── */

/** Load a remote image into a base64 data URL (so jsPDF.addImage accepts it). */
function loadImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      try {
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e?.message))
    img.src = url
  })
}

/**
 * Pick a Static Maps zoom level that frames the polygon tighter than
 * Google's auto-fit (auto-fit pads generously). Higher targetFillFactor
 * → tighter framing. 0.65 ≈ "tightly framed with a little breathing room".
 */
function computeZoomForPolygon(polygon, imageWidthPx = 1600, imageHeightPx = 1000, targetFillFactor = 0.18) {
  if (!polygon || polygon.length < 2) return 18
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const [lng, lat] of polygon) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const meanLat = (minLat + maxLat) / 2
  const mPerDegLng = Math.cos(meanLat * Math.PI / 180) * 111320
  const mPerDegLat = 110540
  const widthMeters  = Math.max(1, (maxLng - minLng) * mPerDegLng)
  const heightMeters = Math.max(1, (maxLat - minLat) * mPerDegLat)

  // Static Maps with scale=2 doubles effective pixels available
  const effW = imageWidthPx  * 2
  const effH = imageHeightPx * 2
  const mppRequired = Math.max(widthMeters / (effW * targetFillFactor),
                               heightMeters / (effH * targetFillFactor))
  // Web Mercator ground resolution: 156543.03 * cos(lat) / 2^z meters/px
  const baseRes = 156543.03 * Math.cos(meanLat * Math.PI / 180)
  const z = Math.log2(baseRes / mppRequired)
  return Math.max(14, Math.min(20, Math.floor(z)))
}

/**
 * Use the polygon's bounding-box CENTER (not the vertex average) as the
 * visual center. For irregular parcels the vertex average drifts toward
 * wherever vertices are clustered — the bbox center is what looks
 * "centered" to a human eye.
 */
function polygonCentroid(polygon) {
  if (!polygon || polygon.length === 0) return null
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const [lng, lat] of polygon) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 }
}

/**
 * Effective area in square meters — prefers the stored land_area, but if
 * that's missing/zero we compute it from the polygon geometry so the title
 * block always shows a real number.
 */
function effectiveAreaSqm(map) {
  const stored = +map.land_area
  if (Number.isFinite(stored) && stored > 0) return stored
  const ring = map.geojson_polygon?.geometry?.coordinates?.[0] || []
  if (ring.length >= 3) {
    const computed = polygonAreaSqm(ring)
    if (Number.isFinite(computed) && computed > 0) return computed
  }
  return null
}

function formatAreaSqm(sqm) {
  if (!Number.isFinite(sqm) || sqm <= 0) return '—'
  // 1 hectare = 10,000 sqm — show ha context for big lots
  const formatted = sqm >= 100
    ? `${Math.round(sqm).toLocaleString()} sq. m.`
    : `${sqm.toFixed(2)} sq. m.`
  if (sqm >= 10000) return `${formatted} (${(sqm / 10000).toFixed(2)} ha)`
  return formatted
}

/** Build a Google Static Maps URL for the property (polygon + pin). */
function buildStaticMapUrl(map, width = 1600, height = 1000, zoomOffset = 0) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const poly = map.geojson_polygon?.geometry?.coordinates?.[0] || []
  const hasPoly = poly.length >= 3
  const hasPin  = map.latitude && map.longitude

  const params = new URLSearchParams()
  params.set('size', `${width}x${height}`)
  params.set('scale', '2')          // retina-crisp
  params.set('maptype', 'satellite')
  params.set('key', key)

  if (hasPoly) {
    // Path: gold stroke, translucent gold fill — matches the in-app polygon
    const pathPts = poly.map(([lng, lat]) => `${lat},${lng}`).join('|')
    params.set('path', `color:0xC9A24Aff|weight:3|fillcolor:0xC9A24A55|${pathPts}`)
    // Override Google's loose auto-fit: center on the centroid, set our own zoom
    const c = polygonCentroid(poly)
    if (c) {
      params.set('center', `${c.lat},${c.lng}`)
      const z = computeZoomForPolygon(poly, width, height) + zoomOffset
      params.set('zoom', String(Math.max(14, Math.min(21, z))))
    }
  }
  if (hasPin) {
    params.set('markers', `color:0xC9A24A|${map.latitude},${map.longitude}`)
    if (!hasPoly) {
      params.set('center', `${map.latitude},${map.longitude}`)
      params.set('zoom', String(18 + zoomOffset))
    }
  }
  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
}

/** Format a bearing entry as "N 76°26' W". */
function fmtBearing(b) {
  const d = Number.isFinite(+b.degrees) ? Math.floor(+b.degrees) : 0
  const m = Number.isFinite(+b.minutes) ? Math.floor(+b.minutes) : 0
  return `${b.dir1 || ''} ${d}°${String(m).padStart(2, '0')}' ${b.dir2 || ''}`.replace(/\s+/g, ' ').trim()
}

/** Format a distance value in meters. */
function fmtDistance(d) {
  if (!Number.isFinite(+d)) return '—'
  return `${(+d).toFixed(2)} m.`
}

/**
 * If no PropertyBoundary rows exist, derive bearings + distances directly
 * from the polygon vertices using spherical geometry. Result has the same
 * shape as DB rows so the rest of the renderer doesn't care which source it is.
 */
function deriveBoundariesFromPolygon(polygon) {
  if (!polygon || polygon.length < 3) return []
  // Strip the closing duplicate vertex if present
  const verts = polygon.slice()
  const first = verts[0], last = verts[verts.length - 1]
  if (first[0] === last[0] && first[1] === last[1]) verts.pop()

  const rows = []
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i]
    const b = verts[(i + 1) % verts.length]
    const lat1 = a[1], lng1 = a[0], lat2 = b[1], lng2 = b[0]

    // Haversine distance
    const R = 6371000
    const toRad = (d) => d * Math.PI / 180
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const h = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
    const distance = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))

    // True bearing (0–360°)
    const y = Math.sin(dLng) * Math.cos(toRad(lat2))
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
              Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng)
    let brng = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360

    // Convert to surveyor quadrant bearing — N/S deg E/W
    let dir1, dir2, deg
    if (brng <= 90) {
      dir1 = 'N'; dir2 = 'E'; deg = brng
    } else if (brng <= 180) {
      dir1 = 'S'; dir2 = 'E'; deg = 180 - brng
    } else if (brng <= 270) {
      dir1 = 'S'; dir2 = 'W'; deg = brng - 180
    } else {
      dir1 = 'N'; dir2 = 'W'; deg = 360 - brng
    }
    const degInt = Math.floor(deg)
    const minutes = (deg - degInt) * 60

    rows.push({
      point_from: String(i + 1),
      point_to:   String(((i + 1) % verts.length) + 1),
      dir1, degrees: degInt, minutes, dir2,
      distance,
    })
  }
  return rows
}

/**
 * Project lat/lng polygon coords into a [x,y] frame fitting a target box
 * with padding. Used by the technical plot drawing.
 */
function projectPolygon(polygon, boxX, boxY, boxW, boxH, padding = 36) {
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const [lng, lat] of polygon) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }
  const innerW = boxW - padding * 2
  const innerH = boxH - padding * 2

  // Approximate metric scale at PH latitudes — 1° lat ≈ 110.5 km, 1° lng ≈ cos(lat)·111.32 km
  const meanLat = (minLat + maxLat) / 2
  const mLng = Math.cos(meanLat * Math.PI / 180) * 111320
  const mLat = 110540
  const widthMeters  = (maxLng - minLng) * mLng
  const heightMeters = (maxLat - minLat) * mLat
  if (widthMeters === 0 || heightMeters === 0) return null

  const scale = Math.min(innerW / widthMeters, innerH / heightMeters)
  const drawW = widthMeters * scale
  const drawH = heightMeters * scale
  const offX  = boxX + (boxW - drawW) / 2
  const offY  = boxY + (boxH - drawH) / 2

  return polygon.map(([lng, lat]) => ({
    x: offX + (lng - minLng) * mLng * scale,
    y: offY + (maxLat - lat) * mLat * scale,  // flip — PDF y grows downward
  }))
}

/* ─── Branded title-block helper used by both PDFs ────────────────── */

function drawBrandLogo(pdf, x, y, size = 22) {
  // Gold rounded square with "FT" — same shape as the app's sidebar logo
  pdf.setFillColor(GOLD)
  pdf.roundedRect(x, y, size, size, 4, 4, 'F')
  pdf.setTextColor(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(size * 0.42)
  const tw = pdf.getTextWidth('FT')
  pdf.text('FT', x + (size - tw) / 2, y + size * 0.66)
}

/* ─── 1. LAND TITLE MAP PDF ───────────────────────────────────────── */

export async function generateLandTitleMapPdf(map, transaction) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()   // 842
  const pageH = pdf.internal.pageSize.getHeight()  // 595

  /* — 1) Satellite image fills the top portion — */
  const mapAreaY = 30
  const mapAreaH = pageH * 0.66
  try {
    // No zoom offset — the computed 45% fill already frames the lot well with context
    const mapUrl = buildStaticMapUrl(map, 1600, 1000, 0)
    const imgData = await loadImageAsDataUrl(mapUrl)
    pdf.addImage(imgData, 'PNG', 30, mapAreaY, pageW - 60, mapAreaH)
  } catch (e) {
    pdf.setFillColor(LIGHT)
    pdf.rect(30, mapAreaY, pageW - 60, mapAreaH, 'F')
    pdf.setTextColor(GREY)
    pdf.setFontSize(11)
    pdf.text('Satellite image unavailable — check Google Maps key + network', pageW / 2, mapAreaY + mapAreaH / 2, { align: 'center' })
  }

  /* — 2) Bottom title block — */
  const blockY  = mapAreaY + mapAreaH + 14
  const blockH  = pageH - blockY - 24
  const colLeftW = 230  // brand panel
  const colMidW  = 340  // notes / prepared-for
  const colRightStart = 30 + colLeftW + colMidW
  const colRightW = pageW - 60 - colLeftW - colMidW

  // Left brand panel (navy)
  pdf.setFillColor(NAVY)
  pdf.rect(30, blockY, colLeftW, blockH, 'F')
  drawBrandLogo(pdf, 44, blockY + 18, 28)
  pdf.setTextColor('#FFFFFF')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(15)
  pdf.text('FILIPINOTRACKS', 82, blockY + 32)
  pdf.setTextColor(GOLD)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.text('LAND TITLE MAPPING SERVICE', 82, blockY + 46)

  pdf.setTextColor('#CBD5E1')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('facebook.com/filipinotracks',     44, blockY + blockH - 28)
  pdf.text('support@filipinotracks.com',      44, blockY + blockH - 16)
  // Gold accent line at bottom of panel
  pdf.setDrawColor(GOLD)
  pdf.setLineWidth(2)
  pdf.line(30, blockY + blockH, 30 + colLeftW, blockY + blockH)
  pdf.setLineWidth(0.5)

  // Middle panel (Prepared for + disclaimer)
  pdf.setDrawColor(LINE)
  pdf.rect(30 + colLeftW, blockY, colMidW, blockH)

  pdf.setTextColor(GREY)
  pdf.setFontSize(7)
  pdf.text('Prepared for:', 40 + colLeftW, blockY + 14)
  pdf.setTextColor(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  // Safety: always use the REGISTERED OWNER, not the submitter (who may be an agent/relative)
  pdf.text(map.registered_owner || '—', 40 + colLeftW, blockY + 30)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(GREY)
  const disclaimer =
    `Note: No ground survey was conducted. This plan only shows the General Location of the\n` +
    `Property and does not equate to the actual ground boundaries. The property may be subject to\n` +
    `ground verification or relocation survey for more accurate results. Property boundaries were\n` +
    `plotted using the technical descriptions provided by the client.\n` +
    `This service is not used for land-boundary disputes or fencing purposes.`
  pdf.text(disclaimer, 40 + colLeftW, blockY + 50, { lineHeightFactor: 1.5 })

  // Footer caption
  pdf.setFontSize(6.5)
  pdf.setTextColor(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Land Title Mapping', 40 + colLeftW, blockY + blockH - 12)

  // Right panel (fields grid: title, owner, area, location)
  pdf.setDrawColor(LINE)
  pdf.rect(colRightStart, blockY, colRightW, blockH)

  const fields = [
    ['Title Number',    map.title_number     || '—'],
    ['Owner',           map.registered_owner || transaction?.user?.name || '—'],
    ['Lot Area',        formatAreaSqm(effectiveAreaSqm(map))],
    ['Location',        [map.barangay, map.city_municipality, map.province].filter(Boolean).join(', ') || '—'],
  ]
  const fieldH = blockH / fields.length
  fields.forEach(([label, value], i) => {
    const fy = blockY + i * fieldH
    if (i > 0) pdf.line(colRightStart, fy, colRightStart + colRightW, fy)
    pdf.setTextColor(GREY)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.text(`${label}:`, colRightStart + 8, fy + 12)
    pdf.setTextColor(NAVY)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9.5)
    // Truncate long values to fit
    const maxW = colRightW - 16
    let txt = value
    while (pdf.getTextWidth(txt) > maxW && txt.length > 4) txt = txt.slice(0, -2)
    if (txt !== value) txt = txt.slice(0, -1) + '…'
    pdf.text(txt, colRightStart + 8, fy + 26)
  })

  // Drawing title strap across the right panel header (overlay)
  const lotLabel = map.lot_number || map.survey_plan_number
    ? `Land Title Map of LOT ${map.lot_number || ''} ${map.survey_plan_number || ''}`.trim()
    : `Land Title Map`
  pdf.setFillColor(NAVY_INK)
  pdf.rect(colRightStart, blockY + blockH - 28, colRightW, 14, 'F')
  pdf.setTextColor('#FFFFFF')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(lotLabel, colRightStart + 8, blockY + blockH - 18)
  pdf.setFillColor(GOLD)
  pdf.rect(colRightStart, blockY + blockH - 14, colRightW, 14, 'F')
  pdf.setTextColor(NAVY)
  pdf.setFontSize(7.5)
  pdf.text('DRAWING NOT TO SCALE', colRightStart + 8, blockY + blockH - 4)
  pdf.text(`Rev. A · ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' })}`,
           colRightStart + colRightW - 8, blockY + blockH - 4, { align: 'right' })

  return pdf
}

/* ─── 2. TECHNICAL PLOT PDF (AutoCAD-style) ───────────────────────── */

export function generateTechnicalPlotPdf(map, transaction) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()   // 595
  const pageH = pdf.internal.pageSize.getHeight()  // 842

  const polygon = map.geojson_polygon?.geometry?.coordinates?.[0] || []
  const stripped = polygon.length > 0 && polygon[0][0] === polygon[polygon.length - 1][0]
                && polygon[0][1] === polygon[polygon.length - 1][1]
    ? polygon.slice(0, -1)
    : polygon

  // Use DB-stored boundaries if present, else compute from polygon
  let boundaries = map.boundaries && map.boundaries.length > 0
    ? map.boundaries
    : deriveBoundariesFromPolygon(polygon)

  /* — Header bar — */
  pdf.setFillColor(NAVY)
  pdf.rect(0, 0, pageW, 56, 'F')
  drawBrandLogo(pdf, 24, 14, 28)
  pdf.setTextColor('#FFFFFF')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.text('FILIPINOTRACKS', 62, 28)
  pdf.setTextColor(GOLD)
  pdf.setFontSize(7.5)
  pdf.text('TECHNICAL PLOTTING · LAND TITLE MAPPING', 62, 42)
  // Gold accent line under header
  pdf.setFillColor(GOLD)
  pdf.rect(0, 56, pageW, 3, 'F')

  /* — Technical Description table (top) — */
  let y = 80
  pdf.setTextColor(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text('TECHNICAL DESCRIPTION', pageW / 2, y, { align: 'center' })
  y += 8

  const tableX = 80
  const tableW = pageW - tableX * 2
  const colLine = tableW * 0.18
  const colBrng = tableW * 0.45
  const colDist = tableW * 0.37

  // Lot header row
  pdf.setFillColor(LIGHT)
  pdf.rect(tableX, y, tableW, 18, 'F')
  pdf.setDrawColor(LINE)
  pdf.rect(tableX, y, tableW, 18)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8.5)
  pdf.setTextColor(NAVY)
  const lotHeader = `LOT ${map.lot_number || ''} ${map.survey_plan_number || ''}`.trim() || 'LOT —'
  pdf.text(lotHeader, tableX + tableW / 2, y + 12, { align: 'center' })
  y += 18

  // Column headers
  pdf.setFillColor('#EEF2F7')
  pdf.rect(tableX, y, tableW, 16, 'F')
  pdf.rect(tableX, y, tableW, 16)
  pdf.line(tableX + colLine, y, tableX + colLine, y + 16)
  pdf.line(tableX + colLine + colBrng, y, tableX + colLine + colBrng, y + 16)
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(NAVY)
  pdf.text('LINE',     tableX + colLine / 2,                              y + 11, { align: 'center' })
  pdf.text('BEARING',  tableX + colLine + colBrng / 2,                    y + 11, { align: 'center' })
  pdf.text('DISTANCE', tableX + colLine + colBrng + colDist / 2,          y + 11, { align: 'center' })
  y += 16

  // Body rows
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(NAVY)
  boundaries.forEach((b, i) => {
    const rowH = 14
    if (i % 2 === 1) {
      pdf.setFillColor('#F8FAFC')
      pdf.rect(tableX, y, tableW, rowH, 'F')
    }
    pdf.setDrawColor(LINE)
    pdf.rect(tableX, y, tableW, rowH)
    pdf.line(tableX + colLine, y, tableX + colLine, y + rowH)
    pdf.line(tableX + colLine + colBrng, y, tableX + colLine + colBrng, y + rowH)
    pdf.text(`${b.point_from}-${b.point_to}`, tableX + colLine / 2,                       y + 10, { align: 'center' })
    pdf.text(fmtBearing(b),                   tableX + colLine + colBrng / 2,             y + 10, { align: 'center' })
    pdf.text(fmtDistance(b.distance),         tableX + colLine + colBrng + colDist - 8,   y + 10, { align: 'right' })
    y += rowH
  })

  // Tie line (if any of the boundaries record one — usually first one for surveyor docs)
  // We keep this informational since most users won't have tie-line data
  y += 6
  if (map.survey_plan_number) {
    pdf.setFillColor(LIGHT)
    pdf.rect(tableX, y, tableW, 28, 'F')
    pdf.setDrawColor(LINE)
    pdf.rect(tableX, y, tableW, 28)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(7.5)
    pdf.setTextColor(GREY)
    pdf.text('TIE LINE: From BLLM 7,', tableX + tableW / 2, y + 10, { align: 'center' })
    pdf.text(`${map.survey_plan_number} to Corner Marked "1"`, tableX + tableW / 2, y + 22, { align: 'center' })
    y += 28
  }

  /* — Polygon drawing (the AutoCAD-style plot) — */
  y += 24
  const drawAreaY = y
  const drawAreaH = pageH - drawAreaY - 80   // leave room for footer
  const drawAreaW = pageW - 60

  pdf.setDrawColor(LINE)
  pdf.setLineWidth(0.5)
  pdf.rect(30, drawAreaY, drawAreaW, drawAreaH)

  if (stripped.length >= 3) {
    const pts = projectPolygon(stripped, 30, drawAreaY, drawAreaW, drawAreaH, 50)
    if (pts) {
      // Draw the polygon
      pdf.setDrawColor(NAVY)
      pdf.setLineWidth(1)
      pdf.lines(
        pts.slice(1).map((p, i) => [p.x - pts[i].x, p.y - pts[i].y]).concat([[pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y]]),
        pts[0].x, pts[0].y,
        [1, 1], 'S', false
      )

      // Corner markers + numeric labels (1, 2, 3, …)
      pts.forEach((p, i) => {
        // Open circle marker
        pdf.setDrawColor(NAVY)
        pdf.setFillColor('#FFFFFF')
        pdf.circle(p.x, p.y, 2.5, 'FD')
        // Label number (offset outward from centroid)
        const cx = pts.reduce((s, q) => s + q.x, 0) / pts.length
        const cy = pts.reduce((s, q) => s + q.y, 0) / pts.length
        const dx = p.x - cx, dy = p.y - cy
        const len = Math.hypot(dx, dy) || 1
        const lx = p.x + (dx / len) * 12
        const ly = p.y + (dy / len) * 12 + 3
        pdf.setTextColor(NAVY)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.text(String(i + 1), lx, ly, { align: 'center' })
      })

      // Centered lot label
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
      pdf.setTextColor(NAVY)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(8.5)
      pdf.text(`LOT ${map.lot_number || ''} ${map.survey_plan_number || ''}`.trim(), cx, cy - 4, { align: 'center' })
      const areaSqm = effectiveAreaSqm(map)
      if (Number.isFinite(areaSqm) && areaSqm > 0) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.text(`Area: ${Math.round(areaSqm).toLocaleString()} sq. m.`, cx, cy + 8, { align: 'center' })
      }
    }
  } else {
    pdf.setTextColor(GREY)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(10)
    pdf.text('No polygon geometry available for plotting.', pageW / 2, drawAreaY + drawAreaH / 2, { align: 'center' })
  }

  /* — Footer — */
  const fy = pageH - 50
  pdf.setDrawColor(LINE)
  pdf.line(30, fy, pageW - 30, fy)
  pdf.setFontSize(7)
  pdf.setTextColor(GREY)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Prepared for: ${map.registered_owner || '—'}`, 30, fy + 14)
  pdf.text(`Title No.: ${map.title_number || '—'}`, 30, fy + 26)
  pdf.text(`FilipinoTracks · ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' })}`,
           pageW - 30, fy + 14, { align: 'right' })
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor('#94A3B8')
  pdf.text('Generated by FilipinoTracks — for reference only; not a substitute for a licensed surveyor\'s relocation survey.',
           pageW / 2, fy + 26, { align: 'center' })

  return pdf
}

/* ─── Convenience: trigger downloads with sensible filenames ──────── */

export async function downloadLandTitleMap(map, transaction) {
  const pdf = await generateLandTitleMapPdf(map, transaction)
  const code = map.title_number || transaction?.transaction_code || `lot-${map.id}`
  pdf.save(`Land-Title-Map-${code}.pdf`)
}

export function downloadTechnicalPlot(map, transaction) {
  const pdf = generateTechnicalPlotPdf(map, transaction)
  const code = map.title_number || transaction?.transaction_code || `lot-${map.id}`
  pdf.save(`Technical-Plot-${code}.pdf`)
}
