/**
 * Self-contained GIS helpers for the FilipinoTracks admin map.
 *
 * No dependency on @turf/turf — we only need a handful of routines and the
 * Google Maps geometry library is already loaded for distance/area work.
 *
 * Coordinate convention inside this file:
 *   - GeoJSON arrays are  [lng, lat]  (RFC 7946)
 *   - {lat, lng} objects are what Google Maps and the rest of the app use
 */

/* ─── Bounding box & basic geometry ───────────────────────────────── */

export function polygonBBox(ring) {
  // ring: [[lng, lat], …]
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const [lng, lat] of ring) {
    if (lng < minLng) minLng = lng
    if (lat < minLat) minLat = lat
    if (lng > maxLng) maxLng = lng
    if (lat > maxLat) maxLat = lat
  }
  return { minLng, minLat, maxLng, maxLat }
}

function bboxesOverlap(a, b) {
  return !(a.maxLng < b.minLng || b.maxLng < a.minLng ||
           a.maxLat < b.minLat || b.maxLat < a.minLat)
}

/** Point-in-polygon (ray-casting). pt = [lng, lat], ring = [[lng, lat], …]. */
function pointInRing(pt, ring) {
  const [x, y] = pt
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1]
    const xj = ring[j][0], yj = ring[j][1]
    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-15) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

/** Segment-segment intersection (proper crossing). */
function segmentsIntersect(p1, p2, p3, p4) {
  const d1x = p2[0] - p1[0], d1y = p2[1] - p1[1]
  const d2x = p4[0] - p3[0], d2y = p4[1] - p3[1]
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 1e-15) return false  // parallel — treat as non-crossing
  const sx = p3[0] - p1[0], sy = p3[1] - p1[1]
  const t = (sx * d2y - sy * d2x) / denom
  const u = (sx * d1y - sy * d1x) / denom
  return t > 0 && t < 1 && u > 0 && u < 1
}

/* ─── Public API ──────────────────────────────────────────────────── */

/**
 * Do two polygons overlap?
 * Robust for non-convex parcels: bbox cull → vertex inclusion → edge crossing.
 * @param {Array<[lng,lat]>} ringA
 * @param {Array<[lng,lat]>} ringB
 * @returns {boolean}
 */
export function polygonsOverlap(ringA, ringB) {
  if (!ringA || !ringB || ringA.length < 3 || ringB.length < 3) return false

  // 1) Cheap bounding-box cull
  if (!bboxesOverlap(polygonBBox(ringA), polygonBBox(ringB))) return false

  // 2) Any vertex of A inside B (or vice versa) — catches the "fully nested" case
  for (const v of ringA) if (pointInRing(v, ringB)) return true
  for (const v of ringB) if (pointInRing(v, ringA)) return true

  // 3) Any edge of A crosses any edge of B — catches "side-by-side overlap"
  for (let i = 0, j = ringA.length - 1; i < ringA.length; j = i++) {
    for (let m = 0, n = ringB.length - 1; m < ringB.length; n = m++) {
      if (segmentsIntersect(ringA[j], ringA[i], ringB[n], ringB[m])) return true
    }
  }
  return false
}

/**
 * Polygon area in square meters — uses Google's geometry library
 * (loaded via GOOGLE_MAPS_LIBRARIES = ['places', 'geometry']).
 * Returns 0 when google/geometry isn't ready yet.
 */
export function polygonAreaSqm(ring) {
  if (!window.google?.maps?.geometry?.spherical || !ring || ring.length < 3) return 0
  const path = ring.map(([lng, lat]) => new window.google.maps.LatLng(lat, lng))
  return Math.abs(window.google.maps.geometry.spherical.computeArea(path))
}

/* ─── Status palette — shared between map polygons and the legend ─── */

export const STATUS_STYLES = {
  approved:                { color: '#16A34A', fill: 0.35, weight: 2.5, dash: null,         label: 'Approved'               },
  released:                { color: '#15803D', fill: 0.35, weight: 2.5, dash: null,         label: 'Released'               },
  'pending approval':      { color: '#D97706', fill: 0.30, weight: 2.5, dash: [8, 4],       label: 'Pending Admin Approval' },
  'under review':          { color: '#2563EB', fill: 0.25, weight: 2,   dash: [6, 4],       label: 'Under Review'           },
  'verification ongoing':  { color: '#0891B2', fill: 0.25, weight: 2,   dash: [6, 4],       label: 'Verification Ongoing'   },
  processing:              { color: '#7C3AED', fill: 0.25, weight: 2,   dash: [6, 4],       label: 'Processing'             },
  'waiting for requirements': { color: '#CA8A04', fill: 0.2, weight: 2, dash: [3, 3],       label: 'Waiting for Documents'  },
  submitted:               { color: '#64748B', fill: 0.18, weight: 1.5, dash: [3, 3],       label: 'Submitted'              },
  rejected:                { color: '#DC2626', fill: 0.20, weight: 2,   dash: null,         label: 'Rejected'               },
}

export const OVERLAP_STYLE = {
  color: '#DC2626', fill: 0.45, weight: 3, dash: null, label: 'Overlap Detected',
}

export function styleForStatus(status) {
  return STATUS_STYLES[status] || { color: '#64748B', fill: 0.2, weight: 1.5, dash: [3, 3], label: status || 'Unknown' }
}

/* ─── Exporters ───────────────────────────────────────────────────── */

function triggerDownload(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function exportGeoJSON(featureCollection, filename = 'filipinotracks-gis.geojson') {
  triggerDownload(filename, JSON.stringify(featureCollection, null, 2), 'application/geo+json')
}

export function exportKML(featureCollection, filename = 'filipinotracks-gis.kml') {
  const escapeXml = (s = '') => String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;')

  const placemarks = featureCollection.features.map(f => {
    const p = f.properties || {}
    const desc = [
      p.title_number     && `<b>Title:</b> ${escapeXml(p.title_number)}`,
      p.lot_number       && `<b>Lot:</b> ${escapeXml(p.lot_number)}`,
      p.registered_owner && `<b>Owner:</b> ${escapeXml(p.registered_owner)}`,
      p.property_type    && `<b>Type:</b> ${escapeXml(p.property_type)}`,
      p.land_area        && `<b>Area:</b> ${p.land_area} sqm`,
      p.full_address     && `<b>Address:</b> ${escapeXml(p.full_address)}`,
      p.status           && `<b>Status:</b> ${escapeXml(p.status)}`,
    ].filter(Boolean).join('<br/>')

    if (f.geometry?.type === 'Polygon') {
      const coords = f.geometry.coordinates[0].map(([lng, lat]) => `${lng},${lat},0`).join(' ')
      return `<Placemark>
  <name>${escapeXml(p.title_number || p.transaction_code || 'Property')}</name>
  <description><![CDATA[${desc}]]></description>
  <Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon>
</Placemark>`
    }
    if (f.geometry?.type === 'Point') {
      const [lng, lat] = f.geometry.coordinates
      return `<Placemark>
  <name>${escapeXml(p.title_number || p.transaction_code || 'Property')}</name>
  <description><![CDATA[${desc}]]></description>
  <Point><coordinates>${lng},${lat},0</coordinates></Point>
</Placemark>`
    }
    return ''
  }).join('\n')

  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>FilipinoTracks GIS Export</name>
    <description>Exported ${new Date().toISOString()} · ${featureCollection.features.length} properties</description>
${placemarks}
  </Document>
</kml>`
  triggerDownload(filename, kml, 'application/vnd.google-earth.kml+xml')
}

export function exportCSV(featureCollection, filename = 'filipinotracks-gis.csv') {
  const cols = ['transaction_code', 'title_number', 'lot_number', 'registered_owner',
                'property_type', 'land_area', 'price', 'status',
                'barangay', 'city_municipality', 'province',
                'centroid_lat', 'centroid_lng', 'has_polygon']
  const escape = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
  }
  const rows = featureCollection.features.map(f => {
    const p = f.properties || {}
    return [
      p.transaction_code, p.title_number, p.lot_number, p.registered_owner,
      p.property_type, p.land_area, p.price, p.status,
      p.barangay, p.city_municipality, p.province,
      p.centroid?.lat, p.centroid?.lng, p.has_polygon ? 'yes' : 'no',
    ].map(escape).join(',')
  })
  triggerDownload(filename, [cols.join(','), ...rows].join('\n'), 'text/csv')
}
