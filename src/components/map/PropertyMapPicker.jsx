import { useCallback, useRef, useState } from 'react'
import {
  GoogleMap, Marker, Polygon, StandaloneSearchBox, useJsApiLoader,
} from '@react-google-maps/api'
import { Box, Button, CircularProgress, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt'
import MapIcon from '@mui/icons-material/Map'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import { NAVY, GOLD } from '../../theme/theme'

const LIBRARIES = ['places']
const PH_CENTER = { lat: 14.5995, lng: 120.9842 }

const POLYGON_OPTIONS = {
  fillColor: GOLD,
  fillOpacity: 0.2,
  strokeColor: GOLD,
  strokeOpacity: 0.9,
  strokeWeight: 2,
}

export default function PropertyMapPicker({ lat, lng, polygonPoints = [], onChange }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  })

  const [mapType, setMapType] = useState('hybrid')
  const mapRef = useRef(null)
  const searchRef = useRef(null)

  const center = lat && lng ? { lat, lng } : PH_CENTER
  const zoom = lat && lng ? 18 : 12

  const handleMapClick = useCallback((e) => {
    onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }, [onChange])

  const handleMarkerDrag = useCallback((e) => {
    onChange({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }, [onChange])

  const handlePlacesChanged = useCallback(() => {
    const places = searchRef.current?.getPlaces()
    if (!places?.length) return
    const loc = places[0].geometry?.location
    if (!loc) return
    const newLat = loc.lat()
    const newLng = loc.lng()
    onChange({ lat: newLat, lng: newLng })
    mapRef.current?.panTo({ lat: newLat, lng: newLng })
    mapRef.current?.setZoom(18)
  }, [onChange])

  const handleLocate = useCallback(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      onChange({ lat: latitude, lng: longitude })
      mapRef.current?.panTo({ lat: latitude, lng: longitude })
      mapRef.current?.setZoom(18)
    })
  }, [onChange])

  if (!isLoaded) {
    return (
      <Box sx={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F1F5F9', borderRadius: 2 }}>
        <CircularProgress sx={{ color: GOLD }} />
      </Box>
    )
  }

  return (
    <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1.5px solid #E2E8F0' }}>
      {/* Search box */}
      <StandaloneSearchBox onLoad={ref => (searchRef.current = ref)} onPlacesChanged={handlePlacesChanged}>
        <input
          type="text"
          placeholder="Search address or location..."
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
            width: 'calc(100% - 180px)', padding: '10px 14px',
            borderRadius: 8, border: '1px solid #CBD5E1',
            fontSize: 14, fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            outline: 'none',
          }}
        />
      </StandaloneSearchBox>

      {/* Map type toggle */}
      <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
        <ToggleButtonGroup value={mapType} exclusive onChange={(_, v) => v && setMapType(v)} size="small"
          sx={{ bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', borderRadius: 1 }}>
          <ToggleButton value="hybrid" sx={{ px: 1.5 }}>
            <SatelliteAltIcon sx={{ fontSize: 16, mr: 0.5 }} /> Satellite
          </ToggleButton>
          <ToggleButton value="roadmap" sx={{ px: 1.5 }}>
            <MapIcon sx={{ fontSize: 16, mr: 0.5 }} /> Map
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Locate me button */}
      <Box sx={{ position: 'absolute', bottom: 100, right: 12, zIndex: 10 }}>
        <Button variant="contained" size="small" onClick={handleLocate}
          startIcon={<MyLocationIcon sx={{ fontSize: 15 }} />}
          sx={{ bgcolor: 'white', color: NAVY, fontWeight: 700, fontSize: '0.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)', '&:hover': { bgcolor: '#F8FAFC' } }}>
          My Location
        </Button>
      </Box>

      <GoogleMap
        mapContainerStyle={{ width: '100%', height: 420 }}
        center={center}
        zoom={zoom}
        mapTypeId={mapType}
        onClick={handleMapClick}
        onLoad={ref => (mapRef.current = ref)}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
      >
        {lat && lng && (
          <Marker
            position={{ lat, lng }}
            draggable
            onDragEnd={handleMarkerDrag}
            animation={window.google?.maps?.Animation?.DROP}
          />
        )}
        {polygonPoints.length > 2 && (
          <Polygon paths={polygonPoints} options={POLYGON_OPTIONS} />
        )}
      </GoogleMap>

      {/* Hint */}
      <Box sx={{ px: 2, py: 1, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ color: '#64748B' }}>
          Click on the map to place a pin · Drag to adjust position
        </Typography>
        {lat && lng && (
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94A3B8' }}>
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
