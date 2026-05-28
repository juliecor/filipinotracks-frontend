import { NAVY, GOLD_DARK, INFO, SUCCESS, WARNING, DANGER } from '../theme/theme'

export const STATUS_META = {
  'submitted':                { label: 'Submitted',    color: NAVY      },
  'under review':             { label: 'Under Review', color: INFO      },
  'verification ongoing':     { label: 'Verifying',    color: INFO      },
  'processing':               { label: 'Processing',   color: WARNING   },
  'waiting for requirements': { label: 'Waiting',      color: GOLD_DARK },
  'pending approval':         { label: 'Pending Approval', color: '#7C3AED' },
  'approved':                 { label: 'Approved',     color: SUCCESS   },
  'released':                 { label: 'Released',     color: SUCCESS   },
  'rejected':                 { label: 'Rejected',     color: DANGER    },
}

export function getCenter(m) {
  if (m?.latitude && m?.longitude) {
    return { lat: parseFloat(m.latitude), lng: parseFloat(m.longitude) }
  }
  const coords = m?.geojson_polygon?.geometry?.coordinates?.[0]
  if (coords?.length > 2) {
    return {
      lat: coords.reduce((s, [, la]) => s + la, 0) / coords.length,
      lng: coords.reduce((s, [lo])   => s + lo, 0) / coords.length,
    }
  }
  return null
}

export function getPolygonPoints(m) {
  const coords = m?.geojson_polygon?.geometry?.coordinates?.[0]
  if (!coords || coords.length < 3) return []
  return coords.map(([lo, la]) => ({ lat: la, lng: lo }))
}

export function getPolygonCentroid(pts) {
  if (!pts || pts.length < 3) return null
  return {
    lat: pts.reduce((s, p) => s + p.lat, 0) / pts.length,
    lng: pts.reduce((s, p) => s + p.lng, 0) / pts.length,
  }
}

// Requires `geometry` library to be loaded via useJsApiLoader.
// Returns area in square meters, or 0 if unavailable.
export function computePolygonArea(pts) {
  if (!pts || pts.length < 3) return 0
  if (!window.google?.maps?.geometry) return 0
  const path = pts.map(p => new window.google.maps.LatLng(p.lat, p.lng))
  return window.google.maps.geometry.spherical.computeArea(path)
}

// Returns array of { midpoint, length } — one entry per polygon edge.
export function computeSideMeasurements(pts) {
  if (!pts || pts.length < 2) return []
  if (!window.google?.maps?.geometry) return []
  const result = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const latLngA = new window.google.maps.LatLng(a.lat, a.lng)
    const latLngB = new window.google.maps.LatLng(b.lat, b.lng)
    result.push({
      midpoint: { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 },
      length: window.google.maps.geometry.spherical.computeDistanceBetween(latLngA, latLngB),
    })
  }
  return result
}

export function formatArea(sqm) {
  if (!sqm || sqm < 0.01) return '—'
  const sqmStr = sqm.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (sqm >= 10000) {
    const ha = (sqm / 10000).toLocaleString('en-US', { maximumFractionDigits: 2 })
    return `${sqmStr} sqm (${ha} ha)`
  }
  return `${sqmStr} sqm`
}

export function formatDistance(m) {
  if (!m || m < 0.01) return '—'
  if (m >= 1000) return `${(m / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} km`
  return `${m.toLocaleString('en-US', { maximumFractionDigits: 1 })} m`
}

export function getCenterAndZoom(properties) {
  const pinned = properties.filter(m => m.latitude && m.longitude)
  const center = pinned.length
    ? {
        lat: pinned.reduce((s, m) => s + parseFloat(m.latitude),  0) / pinned.length,
        lng: pinned.reduce((s, m) => s + parseFloat(m.longitude), 0) / pinned.length,
      }
    : { lat: 12.8797, lng: 121.7740 }
  const zoom = pinned.length === 1 ? 16 : pinned.length > 1 ? 7 : 6
  return { center, zoom }
}
