import jsPDF from 'jspdf'
import {
  computePolygonArea, computeSideMeasurements,
  formatArea, formatDistance,
  getPolygonPoints, STATUS_META,
} from './propertyGeo'

// Brand palette (kept as hex strings — jsPDF accepts hex via setFillColor/setTextColor)
const NAVY      = '#0A1628'
const GOLD      = '#C9A24A'
const GOLD_LIGHT = '#E6C76A'
const GOLD_DARK = '#9F7E2C'
const TEXT_MUTED = '#64748B'
const BORDER    = '#E5EAF2'

// Compute the tightest integer zoom that fits a lat/lng bbox into a given
// pixel size (Mercator math). Used to override Google Static Maps' default
// auto-fit padding, which is too loose for small parcels.
function fitZoom(points, mapW = 640, mapH = 400) {
  const TILE = 256
  const ZOOM_MAX = 20

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lng < minLng) minLng = p.lng
    if (p.lng > maxLng) maxLng = p.lng
  }

  const latRad = (lat) => {
    const sin = Math.sin(lat * Math.PI / 180)
    const r = Math.log((1 + sin) / (1 - sin)) / 2
    return Math.max(Math.min(r, Math.PI), -Math.PI) / 2
  }
  const latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI
  const lngFraction = (maxLng - minLng) / 360

  const latZoom = Math.floor(Math.log2(mapH / TILE / latFraction))
  const lngZoom = Math.floor(Math.log2(mapW / TILE / lngFraction))

  return {
    center: { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 },
    zoom: Math.max(0, Math.min(latZoom, lngZoom, ZOOM_MAX)),
  }
}

/** Build a Google Static Maps URL showing the property's boundary OR pin. */
function buildStaticMapUrl(property, apiKey) {
  if (!apiKey) return null
  const points = getPolygonPoints(property)
  const params = new URLSearchParams({
    size: '640x400',
    maptype: 'satellite',
    scale: '2',
    key: apiKey,
  })

  if (points.length >= 3) {
    // Force a tight center+zoom so the parcel fills the frame.
    const { center, zoom } = fitZoom(points)
    params.append('center', `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`)
    params.append('zoom', String(zoom))

    const pathPoints = [...points, points[0]]
      .map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`)
      .join('|')
    params.append('path', `color:0xC9A24Aff|weight:3|fillcolor:0xC9A24A66|${pathPoints}`)
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
  }
  if (property.latitude && property.longitude) {
    const lat = parseFloat(property.latitude)
    const lng = parseFloat(property.longitude)
    params.append('center', `${lat},${lng}`)
    params.append('zoom', '19')
    params.append('markers', `color:0xC9A24A|${lat},${lng}`)
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`
  }
  return null
}

async function fetchImageAsDataUrl(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Static map fetch failed')
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror   = reject
    reader.readAsDataURL(blob)
  })
}

function drawBadge(doc, x, y, text, color) {
  doc.setFillColor(color)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  const w = doc.getTextWidth(text) + 4
  doc.roundedRect(x, y - 4, w, 5.5, 1, 1, 'F')
  doc.setTextColor('#FFFFFF')
  doc.text(text, x + 2, y - 0.3)
  return w
}

function drawSectionHeader(doc, title, y, margin, pageW) {
  doc.setFillColor(GOLD_DARK)
  doc.rect(margin, y, 2.2, 4.8, 'F')
  doc.setTextColor(GOLD_DARK)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(title, margin + 4, y + 3.5)
  const titleEnd = margin + 4 + doc.getTextWidth(title) + 2
  doc.setDrawColor(BORDER)
  doc.setLineWidth(0.2)
  doc.line(titleEnd, y + 3.5, pageW - margin, y + 3.5)
  return y + 8
}

function drawDetailRow(doc, label, value, y, margin, pageW) {
  if (value === null || value === undefined || value === '') return y
  const labelW = 48
  doc.setTextColor(TEXT_MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text(label.toUpperCase(), margin, y + 3.5)
  doc.setTextColor(NAVY)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(String(value), pageW - margin * 2 - labelW)
  doc.text(lines, margin + labelW, y + 3.5)
  const rowH = Math.max(5.5, lines.length * 4)
  doc.setDrawColor('#EEF2F7')
  doc.setLineWidth(0.2)
  doc.line(margin, y + rowH + 0.5, pageW - margin, y + rowH + 0.5)
  return y + rowH + 2
}

function ensureSpace(doc, y, needed, pageH) {
  if (y + needed > pageH - 18) {
    doc.addPage()
    return 20
  }
  return y
}

/**
 * Build the PDF document for a property. Returns the jsPDF doc + suggested
 * filename so the caller can choose to preview (doc.output('bloburl')) or
 * save (doc.save(filename)).
 */
export async function buildPropertyPdfDoc(property) {
  if (!property) throw new Error('No property provided')

  const doc   = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 15

  // ── HEADER STRIPE ───────────────────────────────────────
  doc.setFillColor(NAVY)
  doc.rect(0, 0, pageW, 22, 'F')
  doc.setFillColor(GOLD)
  doc.rect(0, 22, pageW, 1, 'F')

  // FT logo
  doc.setFillColor(GOLD)
  doc.roundedRect(margin, 6, 10, 10, 1.5, 1.5, 'F')
  doc.setTextColor(NAVY)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('FT', margin + 5, 12.5, { align: 'center' })

  // Brand text
  doc.setTextColor('#FFFFFF')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('FilipinoTracks', margin + 14, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(GOLD_LIGHT)
  doc.text('PROPERTY · DOCUMENTATION · TRUST', margin + 14, 15.5)

  // Right side: report label + date
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(GOLD_LIGHT)
  doc.text('PROPERTY REPORT', pageW - margin, 12, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor('#FFFFFF')
  doc.text(
    new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
    pageW - margin, 16.5, { align: 'right' }
  )

  let y = 32

  // ── OWNER HERO ──────────────────────────────────────────
  doc.setTextColor(TEXT_MUTED)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('REGISTERED OWNER', margin, y)
  y += 6
  doc.setTextColor(NAVY)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  const ownerLines = doc.splitTextToSize(property.registered_owner || 'Unknown Owner', pageW - margin * 2)
  doc.text(ownerLines, margin, y)
  y += ownerLines.length * 7

  // Status + chips
  let chipX = margin
  const meta = STATUS_META[property.transaction?.status]
  if (meta) {
    const w = drawBadge(doc, chipX, y, meta.label.toUpperCase(), meta.color)
    chipX += w + 2
  }
  if (property.latitude && property.longitude) {
    const w = drawBadge(doc, chipX, y, 'PINNED', '#16A34A')
    chipX += w + 2
  }
  const points = getPolygonPoints(property)
  if (points.length >= 3) {
    drawBadge(doc, chipX, y, 'BOUNDARY MAPPED', GOLD_DARK)
  }
  y += 6

  // Transaction code (if any)
  if (property.transaction?.transaction_code) {
    doc.setFillColor('#F6F8FB')
    doc.setDrawColor(BORDER)
    doc.setLineWidth(0.2)
    doc.roundedRect(margin, y, pageW - margin * 2, 9, 1.5, 1.5, 'FD')
    doc.setTextColor(TEXT_MUTED)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text('TRANSACTION CODE', margin + 3, y + 3.5)
    doc.setTextColor(NAVY)
    doc.setFontSize(10)
    doc.setFont('courier', 'bold')
    doc.text(property.transaction.transaction_code, margin + 3, y + 7.5)
    y += 12
  } else {
    y += 2
  }

  // ── MAP IMAGE ───────────────────────────────────────────
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const mapUrl = buildStaticMapUrl(property, apiKey)
  let mapHeight = 0
  if (mapUrl) {
    try {
      const dataUrl = await fetchImageAsDataUrl(mapUrl)
      const imgW = pageW - margin * 2
      const imgH = imgW * (400 / 640)
      y = ensureSpace(doc, y, imgH + 4, pageH)
      doc.addImage(dataUrl, 'PNG', margin, y, imgW, imgH)
      doc.setDrawColor(BORDER)
      doc.setLineWidth(0.3)
      doc.rect(margin, y, imgW, imgH)
      mapHeight = imgH
      y += imgH + 4
    } catch {
      doc.setFontSize(8)
      doc.setTextColor(TEXT_MUTED)
      doc.text('(Map preview unavailable)', margin, y)
      y += 5
    }
  }

  // ── MEASUREMENTS PILL ───────────────────────────────────
  if (points.length >= 3 && window.google?.maps?.geometry) {
    const area = computePolygonArea(points)
    const sides = computeSideMeasurements(points)
    const perimeter = sides.reduce((s, x) => s + x.length, 0)

    y = ensureSpace(doc, y, 16, pageH)
    doc.setFillColor('#FBF5E5')
    doc.setDrawColor(GOLD)
    doc.setLineWidth(0.4)
    doc.roundedRect(margin, y, pageW - margin * 2, 14, 2, 2, 'FD')
    doc.setTextColor(GOLD_DARK)
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'bold')
    doc.text('APPROXIMATE MEASUREMENTS', margin + 3, y + 4.5)
    doc.setTextColor(NAVY)
    doc.setFontSize(11)
    doc.text(
      `Area: ${formatArea(area)}   ·   Perimeter: ${formatDistance(perimeter)}   ·   Sides: ${sides.length}`,
      margin + 3, y + 10
    )
    y += 18
  }

  // ── PROPERTY DETAILS ────────────────────────────────────
  y = ensureSpace(doc, y, 12, pageH)
  y = drawSectionHeader(doc, 'PROPERTY DETAILS', y, margin, pageW)
  y = drawDetailRow(doc, 'Title Number',          property.title_number,                                                       y, margin, pageW)
  y = drawDetailRow(doc, 'Lot / Block',           [property.lot_number, property.block_number].filter(Boolean).join(' / '),    y, margin, pageW)
  y = drawDetailRow(doc, 'Survey Plan',           property.survey_plan_number,                                                  y, margin, pageW)
  y = drawDetailRow(doc, 'Tax Declaration',       property.tax_declaration_number,                                              y, margin, pageW)
  y = drawDetailRow(doc, 'Property Type',         property.property_type,                                                       y, margin, pageW)
  y = drawDetailRow(doc, 'Land Area (official)',  property.land_area ? `${parseFloat(property.land_area).toLocaleString()} sqm` : null, y, margin, pageW)
  if (points.length >= 3 && window.google?.maps?.geometry) {
    y = drawDetailRow(doc, 'Mapped Area (approx.)', formatArea(computePolygonArea(points)), y, margin, pageW)
  }
  y += 2

  // ── LOCATION ────────────────────────────────────────────
  y = ensureSpace(doc, y, 12, pageH)
  y = drawSectionHeader(doc, 'LOCATION', y, margin, pageW)
  y = drawDetailRow(doc, 'Province',            property.province,            y, margin, pageW)
  y = drawDetailRow(doc, 'City / Municipality', property.city_municipality,  y, margin, pageW)
  y = drawDetailRow(doc, 'Barangay',            property.barangay,            y, margin, pageW)
  y = drawDetailRow(doc, 'Full Address',        property.full_address,        y, margin, pageW)
  if (property.latitude && property.longitude) {
    y = drawDetailRow(
      doc, 'GPS Coordinates',
      `${parseFloat(property.latitude).toFixed(6)}, ${parseFloat(property.longitude).toFixed(6)}`,
      y, margin, pageW
    )
  }

  // ── VERIFICATION (if any) ───────────────────────────────
  if (property.verified_at) {
    y += 2
    y = ensureSpace(doc, y, 14, pageH)
    doc.setFillColor('#ECFDF5')
    doc.setDrawColor('#16A34A')
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, pageW - margin * 2, 12, 2, 2, 'FD')
    doc.setTextColor('#15803D')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('VERIFIED', margin + 3, y + 4.5)
    doc.setTextColor(NAVY)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const verifiedDate = new Date(property.verified_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    const verifier = property.verifiedBy?.name || property.verified_by_name
    doc.text(`Verified on ${verifiedDate}${verifier ? ` by ${verifier}` : ''}`, margin + 3, y + 9)
    y += 14
  }

  // ── FOOTER (on every page) ──────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const fy = pageH - 12
    doc.setDrawColor(BORDER)
    doc.setLineWidth(0.3)
    doc.line(margin, fy - 4, pageW - margin, fy - 4)
    doc.setTextColor(TEXT_MUTED)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generated ${new Date().toLocaleString('en-PH')}`, margin, fy)
    doc.text(`Page ${p} of ${totalPages}`, pageW / 2, fy, { align: 'center' })
    doc.text('FilipinoTracks · Confidential', pageW - margin, fy, { align: 'right' })
    doc.setFontSize(6)
    doc.setTextColor('#94A3B8')
    doc.text(
      'Mapped area shown is approximate, computed from plotted boundary points. Not for legal or surveyor-grade use.',
      pageW / 2, fy + 4, { align: 'center' }
    )
  }

  const ownerSlug = (property.registered_owner || 'property').replace(/\s+/g, '_').replace(/[^A-Za-z0-9_-]/g, '')
  const code = property.transaction?.transaction_code || property.title_number || property.id || 'record'
  const filename = `FilipinoTracks_Report_${ownerSlug}_${code}.pdf`

  return { doc, filename }
}

/** Convenience wrapper: builds the PDF and triggers an immediate download. */
export async function exportPropertyPdfReport(property) {
  const { doc, filename } = await buildPropertyPdfDoc(property)
  doc.save(filename)
}
