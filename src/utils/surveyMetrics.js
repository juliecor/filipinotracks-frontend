/**
 * Survey-grade metrics for a plotted lot — perimeter, side lengths, interior
 * angles, and an angle-closure sanity check. Pure geometry on the plotted
 * corners + the title bearings.
 */
import { haversineMeters } from './bearingsPlotter.js'

/**
 * @param {Array<{lat,lng}>} corners  walked corners (closing duplicate at end)
 * @param {Array} bearings            the title courses (for side labels/lengths)
 * @returns {{ corners, perimeter, sides, angles, angleSum, expectedAngleSum, longest, shortest } | null}
 */
export function surveyMetrics(corners, bearings) {
  const ring = (corners || []).slice(0, -1)
  const n = ring.length
  if (n < 3) return null

  // Side lengths — prefer the title's stated distances, fall back to geometry
  const sides = []
  for (let i = 0; i < n; i++) {
    const b = bearings?.[i]
    sides.push({
      label: b ? `${b.point_from}-${b.point_to}` : `${i + 1}-${(i + 1) % n + 1}`,
      length: b && +b.distance > 0 ? +b.distance : haversineMeters(ring[i], ring[(i + 1) % n]),
    })
  }
  const perimeter = sides.reduce((s, x) => s + x.length, 0)

  // Planar leg bearings (north = +lat); interior angles via the turning method
  const legBrng = []
  for (let i = 0; i < n; i++) {
    const a = ring[i], c = ring[(i + 1) % n]
    legBrng.push((Math.atan2(c.lng - a.lng, c.lat - a.lat) * 180 / Math.PI + 360) % 360)
  }
  const turns = []
  for (let i = 0; i < n; i++) {
    let t = legBrng[i] - legBrng[(i - 1 + n) % n]
    while (t > 180) t -= 360
    while (t < -180) t += 360
    turns.push(t)
  }
  const ccw = turns.reduce((s, t) => s + t, 0) > 0
  const angles = turns.map((t, i) => ({ corner: i + 1, deg: ccw ? 180 - t : 180 + t }))
  const angleSum = angles.reduce((s, a) => s + a.deg, 0)
  const expectedAngleSum = (n - 2) * 180

  const lengths = sides.map(s => s.length)
  return {
    corners: n, perimeter, sides, angles, angleSum, expectedAngleSum,
    longest: Math.max(...lengths), shortest: Math.min(...lengths),
  }
}
