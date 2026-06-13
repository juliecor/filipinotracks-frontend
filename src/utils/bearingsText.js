/**
 * Parse a pasted technical-description text block into bearing rows.
 *
 * Handles the common Philippine survey phrasings, e.g.
 *   "1. N 45°30' E , 41.40 m. to corner 2;"
 *   "thence S. 12 deg. 05 min. 30 sec. E., 12.11 meters to point 3"
 *   "N 76-26 W 43.20m"
 * Seconds, when present, fold into fractional minutes (matching the rest of
 * the plotter, which works in degrees + decimal minutes).
 */

const LEG = new RegExp(
  [
    '([NS])\\s*\\.?\\s*',                                  // dir1
    '(\\d+(?:\\.\\d+)?)\\s*(?:°|º|deg\\.?|d|-|\\s)?\\s*',   // degrees
    "(?:(\\d+(?:\\.\\d+)?)\\s*(?:'|′|min\\.?|-|(?=\\s*[EW])))?\\s*", // minutes (optional)
    '(?:(\\d+(?:\\.\\d+)?)\\s*(?:"|″|sec\\.?))?\\s*',       // seconds (optional)
    '([EW])\\s*\\.?\\s*[, ]?\\s*',                          // dir2
    '([\\d,]+(?:\\.\\d+)?)\\s*(?:m\\b|m\\.|meters|metres)', // distance
  ].join(''),
  'gi'
)

/**
 * @param {string} text
 * @returns {Array<{point_from, point_to, dir1, degrees, minutes, dir2, distance, conf}>}
 */
export function parseBearingsText(text) {
  if (!text || typeof text !== 'string') return []
  const out = []
  for (const m of text.matchAll(LEG)) {
    const degrees  = parseFloat(m[2])
    const minutes  = (m[3] ? parseFloat(m[3]) : 0) + (m[4] ? parseFloat(m[4]) / 60 : 0)
    const distance = parseFloat(m[6].replace(/,/g, ''))
    if (!Number.isFinite(degrees) || degrees > 90) continue
    if (!Number.isFinite(distance) || distance <= 0) continue
    out.push({
      dir1: m[1].toUpperCase(),
      degrees,
      minutes: +minutes.toFixed(4),
      dir2: m[5].toUpperCase(),
      distance,
      conf: 'high',
    })
  }
  // Sequential corner labels; last leg closes back to corner 1.
  return out.map((b, i) => ({
    ...b,
    point_from: String(i + 1),
    point_to: String(i + 2 > out.length ? 1 : i + 2),
  }))
}
