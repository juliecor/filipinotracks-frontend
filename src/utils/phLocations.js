const BASE = 'https://psgc.gitlab.io/api'

const cache = {}

async function cached(url) {
  if (cache[url]) return cache[url]
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed: ${url}`)
  const data = await res.json()
  cache[url] = data
  return data
}

export const fetchProvinces = () =>
  cached(`${BASE}/provinces/`).then(list =>
    [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => ({ code: p.code, name: toTitleCase(p.name) }))
  )

export const fetchCities = (provinceCode) =>
  cached(`${BASE}/provinces/${provinceCode}/cities-municipalities/`).then(list =>
    [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({ code: c.code, name: toTitleCase(c.name) }))
  )

export const fetchNcrCities = () =>
  cached(`${BASE}/regions/130000000/cities-municipalities/`).then(list =>
    [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => ({ code: c.code, name: toTitleCase(c.name) }))
  ).catch(() =>
    // Static fallback for NCR
    NCR_CITIES
  )

export const fetchBarangays = (cityCode) =>
  cached(`${BASE}/cities-municipalities/${cityCode}/barangays/`).then(list =>
    [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(b => ({ code: b.code, name: toTitleCase(b.name) }))
  )

function toTitleCase(str) {
  if (!str) return str
  return str
    .toLowerCase()
    .replace(/(?:^|\s|[-/])\S/g, c => c.toUpperCase())
    .replace(/\bOf\b/g, 'of')
    .replace(/\bDe\b/g, 'de')
    .replace(/\bDel\b/g, 'del')
    .replace(/\bNg\b/g, 'ng')
}

// NCR cities static fallback (official PSGC codes)
export const NCR_CODE = 'NCR'

export const NCR_CITIES = [
  { code: '133801000', name: 'Caloocan' },
  { code: '137601000', name: 'Las Piñas' },
  { code: '137401000', name: 'Makati' },
  { code: '133802000', name: 'Malabon' },
  { code: '133803000', name: 'Mandaluyong' },
  { code: '133804000', name: 'Manila' },
  { code: '133805000', name: 'Marikina' },
  { code: '133806000', name: 'Muntinlupa' },
  { code: '133807000', name: 'Navotas' },
  { code: '133808000', name: 'Parañaque' },
  { code: '133809000', name: 'Pasay' },
  { code: '133810000', name: 'Pasig' },
  { code: '137402000', name: 'Pateros' },
  { code: '133813000', name: 'Quezon City' },
  { code: '133814000', name: 'San Juan' },
  { code: '133815000', name: 'Taguig' },
  { code: '133816000', name: 'Valenzuela' },
]

// The NCR "province" entry injected into the province list
export const NCR_PROVINCE = { code: NCR_CODE, name: 'Metro Manila (NCR)' }
