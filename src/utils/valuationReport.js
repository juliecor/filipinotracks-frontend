/**
 * Builds a branded, client-ready Property Valuation Report and opens it in a
 * new tab for printing / Save-as-PDF. Self-contained HTML (no app styles), so
 * it prints cleanly. Pulls together the plotted lot, zonal value, market value,
 * and an estimated transfer-tax breakdown.
 */

const NAVY = '#0A1628'
const GOLD = '#C9A24A'
const GOLD_DARK = '#9F7E2C'

const peso = (n) => '₱' + Math.round(n || 0).toLocaleString('en-PH')
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function openValuationReport({ extracted = {}, plotted = {}, area = 0, zonal = null, market = null, staticMapUrl = '' }) {
  const date = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
  const base = zonal?.total || market?.value || 0
  const rates = { cgt: 6, dst: 1.5, transfer: 0.75, reg: 0.25 }
  const tax = {
    cgt: base * rates.cgt / 100,
    dst: base * rates.dst / 100,
    transfer: base * rates.transfer / 100,
    reg: base * rates.reg / 100,
  }
  tax.total = tax.cgt + tax.dst + tax.transfer + tax.reg

  const loc = [extracted.barangay, extracted.city_municipality, extracted.province].filter(Boolean).join(', ') || '—'
  const titleNo = extracted.title_number || (extracted.lot_number ? `LOT ${extracted.lot_number}` : 'Untitled lot')
  const lotLine = [extracted.lot_number && `Lot ${extracted.lot_number}`, extracted.block_number && `Blk ${extracted.block_number}`, extracted.survey_plan_number]
    .filter(Boolean).join(' · ') || '—'

  const detail = (label, value) => `
    <div class="d"><span class="dl">${esc(label)}</span><span class="dv">${esc(value || '—')}</span></div>`

  const valBlock = (title, lines) => `
    <div class="vb">
      <div class="vbt">${esc(title)}</div>
      ${lines.map((l) => `<div class="vl"><span>${esc(l[0])}</span><b>${esc(l[1])}</b></div>`).join('')}
    </div>`

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Valuation Report — ${esc(titleNo)}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif}
    body{background:#eef1f5;color:#1a2233;padding:24px}
    .sheet{max-width:820px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.15)}
    .top{background:linear-gradient(135deg,${NAVY},#0B1A30);color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:center}
    .brand{font-weight:800;font-size:20px;letter-spacing:.5px}
    .brand small{display:block;font-size:10px;font-weight:700;letter-spacing:3px;color:${GOLD}}
    .rt{ text-align:right;font-size:11px;color:#b9c4d4}
    .rt b{display:block;color:${GOLD};font-size:13px;letter-spacing:2px}
    .body{padding:24px 28px}
    h2{font-size:12px;letter-spacing:1.5px;color:${GOLD_DARK};margin:18px 0 8px;border-bottom:2px solid #eee;padding-bottom:4px}
    .titlebig{font-size:22px;font-weight:800;color:${NAVY}}
    .sub{color:#667;font-size:13px;margin-top:2px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:6px}
    .d{display:flex;justify-content:space-between;border-bottom:1px dotted #e3e7ee;padding:4px 0;font-size:13px}
    .dl{color:#889;font-weight:600}.dv{font-weight:700;color:#1a2233;text-align:right}
    .map{width:100%;border-radius:8px;border:1px solid #e3e7ee;margin-top:8px}
    .vals{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:6px}
    .vb{border:1px solid #e3e7ee;border-radius:8px;padding:12px 14px}
    .vbt{font-size:11px;font-weight:800;letter-spacing:1px;color:${GOLD_DARK};margin-bottom:6px}
    .vl{display:flex;justify-content:space-between;font-size:13px;padding:2px 0}
    .vl b{color:${NAVY}}
    table{width:100%;border-collapse:collapse;margin-top:6px;font-size:13px}
    td{padding:6px 4px;border-bottom:1px solid #eef1f5}
    td.r{text-align:right;font-variant-numeric:tabular-nums}
    .tot td{border-top:2px solid ${GOLD};font-weight:800;color:${NAVY};font-size:15px}
    .disc{font-size:10.5px;color:#889;margin-top:16px;line-height:1.5}
    .bar{background:${GOLD};color:${NAVY};text-align:center;font-weight:800;padding:12px;font-size:13px}
    .btn{position:fixed;top:16px;right:16px;background:${NAVY};color:#fff;border:none;border-radius:8px;padding:10px 18px;font-weight:800;cursor:pointer;font-size:13px}
    @media print{body{background:#fff;padding:0}.sheet{box-shadow:none;border-radius:0;max-width:none}.btn{display:none}}
  </style></head>
  <body>
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <div class="sheet">
      <div class="top">
        <div class="brand">FilipinoTracks<small>LAND TITLE INTELLIGENCE</small></div>
        <div class="rt"><b>PROPERTY VALUATION</b>Report · ${esc(date)}</div>
      </div>
      <div class="body">
        <div class="titlebig">${esc(titleNo)}</div>
        <div class="sub">${esc(loc)}</div>

        <h2>PROPERTY DETAILS</h2>
        <div class="grid">
          ${detail('Registered Owner', extracted.registered_owner)}
          ${detail('Lot / Block / Plan', lotLine)}
          ${detail('Area (computed)', `${Math.round(area).toLocaleString('en-PH')} sq.m.`)}
          ${detail('Area (on title)', extracted.land_area_sqm ? `${Number(extracted.land_area_sqm).toLocaleString('en-PH')} sq.m.` : '—')}
        </div>

        ${staticMapUrl ? `<h2>PLOTTED LOT</h2><img class="map" src="${esc(staticMapUrl)}" alt="plotted lot"/>` : ''}

        <h2>VALUATION</h2>
        <div class="vals">
          ${valBlock('BIR ZONAL VALUE (TAX BASIS)', zonal ? [
            ['Classification', zonal.classification || '—'],
            ['Rate', `${peso(zonal.perSqm)}/sqm`],
            ['Total', peso(zonal.total)],
          ] : [['Status', 'Not available']])}
          ${valBlock('ESTIMATED MARKET VALUE', market ? [
            ['Rate', `${peso(market.perSqm)}/sqm`],
            ['Total', peso(market.value)],
            ['Based on', `${market.count} listing${market.count === 1 ? '' : 's'}`],
          ] : [['Status', 'No comparable listings']])}
        </div>

        <h2>ESTIMATED TRANSFER TAXES &amp; FEES</h2>
        <div class="sub" style="margin-bottom:4px">Computed on the tax base of ${peso(base)} at standard rates.</div>
        <table>
          <tr><td>Capital Gains Tax (${rates.cgt}%)</td><td class="r">${peso(tax.cgt)}</td></tr>
          <tr><td>Documentary Stamp Tax (${rates.dst}%)</td><td class="r">${peso(tax.dst)}</td></tr>
          <tr><td>Transfer Tax (${rates.transfer}%)</td><td class="r">${peso(tax.transfer)}</td></tr>
          <tr><td>Registration Fee (${rates.reg}%)</td><td class="r">${peso(tax.reg)}</td></tr>
          <tr class="tot"><td>Estimated Total</td><td class="r">${peso(tax.total)}</td></tr>
        </table>

        <div class="disc">
          This report is an indicative estimate generated by the FilipinoTracks AI Title Scanner.
          The zonal value is the official BIR tax basis (typically below open-market price); the market value is
          derived from comparable listings; transfer taxes use standard rates and vary by LGU. BIR computes taxes on the
          higher of the zonal value or the actual selling price. This is not a formal appraisal or legal document.
        </div>
      </div>
      <div class="bar">Generated by FilipinoTracks · ${esc(date)}</div>
    </div>
  </body></html>`

  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(html)
  w.document.close()
  return true
}
