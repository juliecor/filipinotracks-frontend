// Converts Philippine quadrant bearing (N 45 30 E) to azimuth degrees (0-360)
export function bearingToAzimuth(dir1, degrees, minutes, dir2) {
  const d1 = (dir1 || '').toUpperCase()
  const d2 = (dir2 || '').toUpperCase()
  const angle = parseFloat(degrees || 0) + parseFloat(minutes || 0) / 60

  if (d1 === 'N' && d2 === 'E') return angle
  if (d1 === 'S' && d2 === 'E') return 180 - angle
  if (d1 === 'S' && d2 === 'W') return 180 + angle
  if (d1 === 'N' && d2 === 'W') return 360 - angle
  return angle
}

// Given lat/lng, azimuth degrees, and distance in meters → returns next lat/lng
export function destinationPoint(lat, lng, azimuthDeg, distanceMeters) {
  const R = 6371000
  const δ = distanceMeters / R
  const θ = (azimuthDeg * Math.PI) / 180
  const φ1 = (lat * Math.PI) / 180
  const λ1 = (lng * Math.PI) / 180

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  )
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    )

  return {
    lat: (φ2 * 180) / Math.PI,
    lng: (((λ2 * 180) / Math.PI) + 540) % 360 - 180,
  }
}

// Converts array of boundary rows + start point into polygon coordinates
// Returns array of { lat, lng } — also mutates each row with gen_lat/gen_lng
export function boundariesToPolygon(startLat, startLng, boundaries) {
  if (!startLat || !startLng || !boundaries?.length) return []

  const points = [{ lat: startLat, lng: startLng }]
  let curLat = startLat
  let curLng = startLng

  for (const b of boundaries) {
    if (!b.dir1 || !b.dir2 || !b.degrees || !b.distance) continue
    const azimuth = bearingToAzimuth(b.dir1, b.degrees, b.minutes, b.dir2)
    const next = destinationPoint(curLat, curLng, azimuth, parseFloat(b.distance))
    b.gen_lat = next.lat
    b.gen_lng = next.lng
    points.push(next)
    curLat = next.lat
    curLng = next.lng
  }

  return points
}

// Converts polygon points to GeoJSON Polygon feature
export function pointsToGeoJSON(points) {
  if (!points?.length) return null
  const coords = points.map(p => [p.lng, p.lat])
  // Close the ring
  if (coords.length > 0) coords.push(coords[0])
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: {},
  }
}
