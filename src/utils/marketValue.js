/**
 * Market-value comparables client. Hits our backend, which derives an
 * indicative ₱/sqm from the company's own priced listings near the lot.
 */
import api from '../api/axios'

export async function fetchMarketComps({ province, city, barangay }) {
  const { data } = await api.get('/market-comps', {
    params: { province: province || '', city: city || '', barangay: barangay || '' },
  })
  return data // { count, level, per_sqm, low, high, sample[] }
}

export const COMP_LEVEL_NOTE = {
  barangay: 'from listings in this barangay',
  city: 'from listings in this city/municipality',
  province: 'from listings in this province',
  none: 'no comparable listings found',
}
