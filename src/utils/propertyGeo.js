import { NAVY, GOLD_DARK, INFO, SUCCESS, WARNING, DANGER } from '../theme/theme'

export const STATUS_META = {
  'submitted':                { label: 'Submitted',    color: NAVY      },
  'under review':             { label: 'Under Review', color: INFO      },
  'verification ongoing':     { label: 'Verifying',    color: INFO      },
  'processing':               { label: 'Processing',   color: WARNING   },
  'waiting for requirements': { label: 'Waiting',      color: GOLD_DARK },
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
