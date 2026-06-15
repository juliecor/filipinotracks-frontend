/**
 * Instant Verify — automated sanity checks on a plotted title.
 *
 * Turns "is this extraction trustworthy?" into a scannable checklist:
 * closure quality, area agreement, required fields, well-formed bearings,
 * and AI confidence. Pure derivation from the extraction + plotted polygon.
 */

/** @returns {{ checks: Array<{label,status,detail}>, passed, total, verdict }} */
export function runTitleChecks(extracted, plotted) {
  const checks = []
  const bearings = extracted.bearings || []

  // 1) Boundary closes
  const cm = plotted?.closure?.meters
  if (Number.isFinite(cm)) {
    checks.push({
      label: 'Boundary closes',
      status: cm < 1 ? 'pass' : cm < 5 ? 'warn' : 'fail',
      detail: `${cm.toFixed(2)} m gap · ${((plotted.closure.ratio || 0) * 100).toFixed(3)}% of perimeter`,
    })
  }

  // 2) Computed area agrees with the area printed on the title
  if (Number.isFinite(extracted.land_area_sqm) && plotted?.area > 0) {
    const delta = Math.abs(plotted.area - extracted.land_area_sqm) / extracted.land_area_sqm * 100
    checks.push({
      label: 'Computed area matches title',
      status: delta < 2 ? 'pass' : delta < 10 ? 'warn' : 'fail',
      detail: `±${delta.toFixed(1)}% vs ${extracted.land_area_sqm.toLocaleString('en-PH')} sqm on title`,
    })
  }

  // 3) Enough bearings to form a polygon
  checks.push({
    label: 'Enough bearings to form a lot',
    status: bearings.length >= 3 ? 'pass' : 'fail',
    detail: `${bearings.length} bearing${bearings.length === 1 ? '' : 's'}${bearings.length < 3 ? ' (need at least 3)' : ''}`,
  })

  // 4) Key identity fields present
  const required = [['title_number', 'Title number'], ['lot_number', 'Lot number'], ['registered_owner', 'Registered owner']]
  const missing = required.filter(([k]) => !String(extracted[k] ?? '').trim()).map(([, l]) => l)
  checks.push({
    label: 'Key fields present',
    status: missing.length === 0 ? 'pass' : missing.length === 1 ? 'warn' : 'fail',
    detail: missing.length ? `Missing: ${missing.join(', ')}` : 'Title, lot, and owner all filled in',
  })

  // 5) Bearings are well-formed (no zero distances / out-of-range angles)
  const bad = bearings.filter(b => !(+b.distance > 0) || +b.degrees > 90 || +b.minutes >= 60)
  checks.push({
    label: 'Bearings are well-formed',
    status: bad.length === 0 ? 'pass' : 'warn',
    detail: bad.length ? `${bad.length} row(s) have a zero distance or out-of-range angle` : 'All rows have valid angles and distances',
  })

  // 6) AI confidence (informational)
  const fc = extracted.field_confidence || {}
  const unsure = Object.values(fc).filter(v => v === 'medium' || v === 'low').length
  if (unsure > 0) {
    checks.push({ label: 'AI confidence', status: 'warn', detail: `${unsure} field${unsure === 1 ? '' : 's'} flagged for a closer look` })
  }

  const passed = checks.filter(c => c.status === 'pass').length
  const failed = checks.filter(c => c.status === 'fail').length
  const verdict = failed > 0 ? 'fail' : checks.some(c => c.status === 'warn') ? 'warn' : 'pass'
  return { checks, passed, total: checks.length, verdict }
}
