/**
 * Surveyor-bearing → polygon plotter.
 *
 * Given a starting corner (lat/lng) and a list of bearings + distances
 * (the technical description), walks each leg and produces the corner
 * polygon. Pure JS, no Google Maps dependency.
 */

const R_EARTH = 6371000  // mean Earth radius in meters
const toRad   = (d) => d * Math.PI / 180
const toDeg   = (r) => r * 180 / Math.PI

/**
 * Convert a surveyor's quadrant bearing (N XX° YY' E, etc.) into a
 * standard true bearing (0–360° clockwise from north).
 */
export function quadrantToTrueBearing(dir1, deg, min, dir2) {
  const total = (+deg || 0) + (+min || 0) / 60
  if (dir1 === 'N' && dir2 === 'E') return total
  if (dir1 === 'S' && dir2 === 'E') return 180 - total
  if (dir1 === 'S' && dir2 === 'W') return 180 + total
  if (dir1 === 'N' && dir2 === 'W') return 360 - total
  return 0
}

/**
 * Spherical destination — start at (lat, lng), travel `distanceM` meters
 * along true bearing `bearingDeg`. Returns { lat, lng } of the new point.
 */
export function destinationPoint(lat, lng, bearingDeg, distanceM) {
  const δ = distanceM / R_EARTH
  const θ = toRad(bearingDeg)
  const φ1 = toRad(lat)
  const λ1 = toRad(lng)

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) +
    Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  )
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
  )
  return { lat: toDeg(φ2), lng: ((toDeg(λ2) + 540) % 360) - 180 }
}

/** Haversine distance between two points in meters. */
export function haversineMeters(a, b) {
  const φ1 = toRad(a.lat), φ2 = toRad(b.lat)
  const dφ = toRad(b.lat - a.lat)
  const dλ = toRad(b.lng - a.lng)
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Walk the bearings list from the starting point and return ALL corner
 * coordinates (corner 1 = startPoint, corner 2 = end of bearing 1, etc.).
 *
 * @param {{lat, lng}} startPoint
 * @param {Array<{dir1, degrees, minutes, dir2, distance}>} bearings
 * @param {number} [rotationDeg=0] extra rotation applied to every leg —
 *        rotates the whole traverse about corner 1 (used by the result-map
 *        "align with imagery" control)
 * @returns {Array<{lat, lng}>} corner points (length = bearings.length + 1)
 */
export function plotPolygonFromBearings(startPoint, bearings, rotationDeg = 0) {
  const corners = [{ lat: startPoint.lat, lng: startPoint.lng }]
  let current = corners[0]
  for (const b of bearings) {
    const trueBrng = quadrantToTrueBearing(b.dir1, b.degrees, b.minutes, b.dir2) + rotationDeg
    current = destinationPoint(current.lat, current.lng, trueBrng, +b.distance || 0)
    corners.push(current)
  }
  return corners
}

/**
 * Parse a tie-line description into a single bearing leg.
 * PH titles write it like "N. 44°31' E., 1393.31 m. from BLLM No. 1, Cad. 545-D".
 * Seconds, when present, fold into fractional minutes.
 *
 * @returns {{dir1, degrees, minutes, dir2, distance}|null}
 */
export function parseTieLine(text) {
  if (!text || typeof text !== 'string') return null
  const brng = text.match(
    /([NS])\.?\s*(\d+(?:\.\d+)?)\s*(?:°|deg\.?)?\s*(?:(\d+(?:\.\d+)?)\s*['′])?\s*(?:(\d+(?:\.\d+)?)\s*["″])?\s*,?\s*([EW])/i
  )
  if (!brng) return null
  const dist = text.match(/([\d,]+(?:\.\d+)?)\s*(?:m\b|m\.|meters|metres)/i)
  if (!dist) return null

  const distance = parseFloat(dist[1].replace(/,/g, ''))
  const degrees  = parseFloat(brng[2])
  const minutes  = (brng[3] ? parseFloat(brng[3]) : 0) + (brng[4] ? parseFloat(brng[4]) / 60 : 0)
  if (!Number.isFinite(distance) || distance <= 0) return null
  if (!Number.isFinite(degrees) || degrees > 90) return null

  return { dir1: brng[1].toUpperCase(), degrees, minutes, dir2: brng[5].toUpperCase(), distance }
}

/**
 * Closure error — the distance between corner-1 (start) and the LAST
 * computed corner. For a perfectly transcribed polygon this should be
 * tiny (a few centimeters from spherical accumulation). Larger values
 * indicate transcription / OCR errors in the bearings.
 *
 * @returns {{ meters: number, ratio: number }}
 *          ratio = closureMeters / perimeterMeters
 */
export function closureError(corners) {
  if (corners.length < 2) return { meters: 0, ratio: 0 }
  const start = corners[0]
  const last  = corners[corners.length - 1]
  const closure = haversineMeters(start, last)

  let perimeter = 0
  for (let i = 0; i < corners.length - 1; i++) {
    perimeter += haversineMeters(corners[i], corners[i + 1])
  }
  return { meters: closure, ratio: perimeter > 0 ? closure / perimeter : 0 }
}

/**
 * Build a GeoJSON Polygon object from the walked corners — drops the
 * duplicated closing corner so the ring is a clean N-vertex parcel.
 */
export function cornersToGeoJsonPolygon(corners) {
  if (!corners || corners.length < 3) return null
  // If the last corner is essentially identical to the first (closure < 1m),
  // omit it — GeoJSON closes the ring itself by repeating the first vertex.
  const last = corners[corners.length - 1]
  const first = corners[0]
  const closeDist = haversineMeters(first, last)

  const ring = (closeDist < 1 ? corners.slice(0, -1) : corners)
    .map(p => [p.lng, p.lat])
  // Close the ring (GeoJSON convention)
  ring.push([first.lng, first.lat])

  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [ring] },
    properties: {},
  }
}
