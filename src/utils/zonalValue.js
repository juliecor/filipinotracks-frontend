/**
 * Frontend client for the zonal-value lookup.
 *
 * Calls our own Laravel backend (/api/zonal-lookup), which proxies the external
 * PH Zonal Value API with a server-side token. Returns the matching rows plus
 * the distinct classification codes available for the area.
 */
import api from '../api/axios'

/**
 * @param {{province?:string, city?:string, barangay?:string}} loc
 * @returns {Promise<{configured:boolean, matched_level:string, count:number, classifications:string[], rows:Array}>}
 */
export async function fetchZonalValue({ province, city, barangay }) {
  const { data } = await api.get('/zonal-lookup', {
    params: { province: province || '', city: city || '', barangay: barangay || '' },
    timeout: 30_000,
  })
  return data
}

/** Median of a numeric array (0 when empty). */
export function median(nums) {
  const xs = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (!xs.length) return 0
  const mid = Math.floor(xs.length / 2)
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2
}

/** Human label for the BIR classification codes the API returns. */
export const CLASSIFICATION_LABELS = {
  RR: 'Residential Regular',
  RC: 'Residential Condominium',
  CR: 'Commercial Regular',
  CC: 'Commercial Condominium',
  C:  'Commercial',
  A:  'Agricultural',
  I:  'Industrial',
  GP: 'Government / Institutional',
  X:  'Special / Exempt',
}
