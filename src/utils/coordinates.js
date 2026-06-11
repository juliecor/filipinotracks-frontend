/**
 * Coordinate parsing + formatting helpers.
 *
 * Accepts the formats Philippine surveyors / titles commonly use:
 *   - DMS  →  9°37'46.46"N 123°49'29.97"E
 *   - DMS  →  9° 37' 46.46" N, 123° 49' 29.97" E
 *   - Decimal pair  →  9.629572, 123.824992
 *   - Decimal pair  →  9.629572 123.824992
 *
 * Returns { lat, lng } or null when the input can't be parsed.
 */

/**
 * Convert a single DMS triplet (+ direction) to a signed decimal degree.
 */
function dmsToDecimal({ deg, min, sec, dir }) {
  let dec = (deg || 0) + (min || 0) / 60 + (sec || 0) / 3600
  if (dir === 'S' || dir === 'W') dec = -dec
  return dec
}

/**
 * Parse a coordinate string. Returns { lat, lng } or null.
 */
export function parseCoordinates(input) {
  if (!input || typeof input !== 'string') return null
  const cleaned = input.trim()
  if (!cleaned) return null

  // ── 1) Plain decimal pair (e.g. "9.629572, 123.824992") ──
  const decMatch = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/)
  if (decMatch) {
    const lat = parseFloat(decMatch[1])
    const lng = parseFloat(decMatch[2])
    if (
      Number.isFinite(lat) && Number.isFinite(lng) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ) {
      return { lat, lng }
    }
  }

  // ── 2) DMS pair — find two coordinate tokens with N/S/E/W suffix ──
  // Match: digits → optional °/space → optional digits → optional '/'/space →
  //        optional digits/decimal → optional "/space → N|S|E|W
  const dmsToken = /(\d+(?:\.\d+)?)\s*[°\s]\s*(?:(\d+(?:\.\d+)?)\s*['′\s])?\s*(?:(\d+(?:\.\d+)?)\s*["″\s])?\s*([NSEWnsew])/g
  const tokens = [...cleaned.matchAll(dmsToken)].map(m => ({
    deg: parseFloat(m[1]),
    min: m[2] !== undefined ? parseFloat(m[2]) : 0,
    sec: m[3] !== undefined ? parseFloat(m[3]) : 0,
    dir: m[4].toUpperCase(),
  }))

  if (tokens.length >= 2) {
    const latToken = tokens.find(t => t.dir === 'N' || t.dir === 'S')
    const lngToken = tokens.find(t => t.dir === 'E' || t.dir === 'W')
    if (latToken && lngToken) {
      const lat = dmsToDecimal(latToken)
      const lng = dmsToDecimal(lngToken)
      if (
        Number.isFinite(lat) && Number.isFinite(lng) &&
        Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ) {
        return { lat, lng }
      }
    }
  }

  return null
}

/**
 * Convert a decimal degree to DMS triplet (no direction).
 */
function decimalToDmsParts(decimal) {
  const abs = Math.abs(decimal)
  const deg = Math.floor(abs)
  const minFloat = (abs - deg) * 60
  const min = Math.floor(minFloat)
  const sec = (minFloat - min) * 60
  return { deg, min, sec }
}

/**
 * Format a latitude as e.g.  9°37'46.46"N
 */
export function formatLatDMS(lat, precision = 2) {
  if (!Number.isFinite(lat)) return ''
  const { deg, min, sec } = decimalToDmsParts(lat)
  const dir = lat >= 0 ? 'N' : 'S'
  return `${deg}°${String(min).padStart(2, '0')}'${sec.toFixed(precision)}"${dir}`
}

/**
 * Format a longitude as e.g.  123°49'29.97"E
 */
export function formatLngDMS(lng, precision = 2) {
  if (!Number.isFinite(lng)) return ''
  const { deg, min, sec } = decimalToDmsParts(lng)
  const dir = lng >= 0 ? 'E' : 'W'
  return `${deg}°${String(min).padStart(2, '0')}'${sec.toFixed(precision)}"${dir}`
}

/**
 * Format both as one display string.
 */
export function formatCoordsDMS(lat, lng, precision = 2) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return ''
  return `${formatLatDMS(lat, precision)} ${formatLngDMS(lng, precision)}`
}
