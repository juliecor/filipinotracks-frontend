/**
 * Closure auto-fix — the "AI surveyor assistant".
 *
 * When a plotted traverse doesn't close, the cause is almost always a
 * single transcription/OCR slip: a flipped quadrant letter (N↔S, E↔W),
 * swapped degrees/minutes, or one misread digit. This module brute-forces
 * those common slips one row at a time, replots each candidate, and
 * returns the edits that make the polygon close — ranked by resulting
 * closure error. Pure math on the existing plotter, no extra AI calls.
 */

import { plotPolygonFromBearings, closureError } from './bearingsPlotter.js'

// Closure error is origin-insensitive for lot-sized parcels, so a fixed PH
// origin works for evaluating candidate fixes before any pin exists.
const EVAL_ORIGIN = { lat: 10.3157, lng: 123.8854 }

// Digit pairs OCR habitually confuses on typewritten titles.
const CONFUSABLE_DIGITS = {
  0: ['8', '6'], 1: ['7'], 2: ['7'], 3: ['8'], 4: ['9'],
  5: ['6'], 6: ['5', '8', '0'], 7: ['1', '2'], 8: ['3', '0', '6'], 9: ['4'],
}

/** Misread-digit variants of `value` (integer digits only), clamped to [0, max]. */
function digitVariants(value, max) {
  const out = new Set()
  const s = String(value)
  const intEnd = s.includes('.') ? s.indexOf('.') : s.length
  for (let i = 0; i < intEnd; i++) {
    for (const repl of CONFUSABLE_DIGITS[s[i]] || []) {
      const v = parseFloat(s.slice(0, i) + repl + s.slice(i + 1))
      if (Number.isFinite(v) && v >= 0 && v <= max && v !== +value) out.add(v)
    }
  }
  return [...out]
}

/** All single-edit candidate corrections for one bearing row. */
function rowCandidates(b) {
  const flip1 = b.dir1 === 'N' ? 'S' : 'N'
  const flip2 = b.dir2 === 'E' ? 'W' : 'E'
  const out = [
    { row: { ...b, dir1: flip1 }, label: `${b.dir1} → ${flip1}` },
    { row: { ...b, dir2: flip2 }, label: `${b.dir2} → ${flip2}` },
    { row: { ...b, dir1: flip1, dir2: flip2 }, label: `${b.dir1}…${b.dir2} → ${flip1}…${flip2}` },
  ]
  if (b.degrees !== b.minutes && b.degrees <= 59 && b.minutes <= 89) {
    out.push({
      row: { ...b, degrees: b.minutes, minutes: b.degrees },
      label: `${b.degrees}°${b.minutes}' → ${b.minutes}°${b.degrees}' (deg ↔ min)`,
    })
  }
  for (const v of digitVariants(b.degrees, 89))     out.push({ row: { ...b, degrees: v },  label: `degrees ${b.degrees} → ${v}` })
  for (const v of digitVariants(b.minutes, 59))     out.push({ row: { ...b, minutes: v },  label: `minutes ${b.minutes} → ${v}` })
  for (const v of digitVariants(b.distance, 99999)) out.push({ row: { ...b, distance: v }, label: `distance ${b.distance} m → ${v} m` })
  return out
}

/**
 * Find single-row edits that close the traverse.
 *
 * @param {Array<{dir1, degrees, minutes, dir2, distance}>} bearings
 * @returns {{ before: number,
 *             suggestions: Array<{ line: string, label: string, after: number, bearings: Array }> }}
 *          `before` is the current closure error in meters; each suggestion
 *          carries the full corrected bearings array ready to apply.
 */
export function suggestClosureFixes(bearings, { maxSuggestions = 3 } = {}) {
  if (!bearings || bearings.length < 3) return { before: 0, suggestions: [] }
  const before = closureError(plotPolygonFromBearings(EVAL_ORIGIN, bearings)).meters
  if (before < 1.5) return { before, suggestions: [] }

  const suggestions = []
  bearings.forEach((b, i) => {
    for (const cand of rowCandidates(b)) {
      const test = bearings.map((row, j) => (j === i ? cand.row : row))
      const after = closureError(plotPolygonFromBearings(EVAL_ORIGIN, test)).meters
      // Only surface fixes that essentially solve the closure, not ones that
      // merely nudge it — a genuine transcription slip snaps the gap shut.
      if (after < before * 0.35 && before - after > 1) {
        suggestions.push({ line: `${b.point_from}-${b.point_to}`, label: cand.label, after, bearings: test })
      }
    }
  })

  suggestions.sort((a, z) => a.after - z.after)
  return { before, suggestions: suggestions.slice(0, maxSuggestions) }
}
