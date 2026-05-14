import { useState, useEffect } from 'react'
import { Grid, FormControl, InputLabel, Select, MenuItem, CircularProgress, TextField, InputAdornment } from '@mui/material'
import {
  fetchProvinces, fetchCities, fetchNcrCities, fetchBarangays,
  NCR_PROVINCE,
} from '../utils/phLocations'

// onChange receives { province, city_municipality, barangay } as display names
export default function PhLocationPicker({ onChange }) {
  const [provinces,   setProvinces]   = useState([])
  const [cities,      setCities]      = useState([])
  const [barangays,   setBarangays]   = useState([])
  const [loadingP,    setLoadingP]    = useState(true)
  const [loadingC,    setLoadingC]    = useState(false)
  const [loadingB,    setLoadingB]    = useState(false)

  const [provinceCode,   setProvinceCode]   = useState('')
  const [provinceName,   setProvinceName]   = useState('')
  const [cityCode,       setCityCode]       = useState('')
  const [cityName,       setCityName]       = useState('')
  const [barangayCode,   setBarangayCode]   = useState('')
  const [barangayName,   setBarangayName]   = useState('')
  const [barangayManual, setBarangayManual] = useState('')

  useEffect(() => {
    fetchProvinces()
      .then(list => setProvinces([NCR_PROVINCE, ...list]))
      .finally(() => setLoadingP(false))
  }, [])

  const handleProvinceChange = (e) => {
    const code = e.target.value
    const name = provinces.find(p => p.code === code)?.name || ''
    setProvinceCode(code)
    setProvinceName(name)
    setCityCode('')
    setCityName('')
    setBarangayCode('')
    setBarangayName('')
    setBarangayManual('')
    setCities([])
    setBarangays([])
    onChange({ province: name, city_municipality: '', barangay: '' })

    setLoadingC(true)
    const load = code === NCR_PROVINCE.code ? fetchNcrCities() : fetchCities(code)
    load.then(setCities).finally(() => setLoadingC(false))
  }

  const handleCityChange = (e) => {
    const code = e.target.value
    const name = cities.find(c => c.code === code)?.name || ''
    setCityCode(code)
    setCityName(name)
    setBarangayCode('')
    setBarangayName('')
    setBarangayManual('')
    setBarangays([])
    onChange({ province: provinceName, city_municipality: name, barangay: '' })

    setLoadingB(true)
    fetchBarangays(code).then(setBarangays).finally(() => setLoadingB(false))
  }

  const handleBarangaySelectChange = (e) => {
    const code = e.target.value
    const name = barangays.find(b => b.code === code)?.name || ''
    setBarangayCode(code)
    setBarangayName(name)
    onChange({ province: provinceName, city_municipality: cityName, barangay: name })
  }

  const handleBarangayTextChange = (e) => {
    const val = e.target.value
    setBarangayManual(val)
    onChange({ province: provinceName, city_municipality: cityName, barangay: val })
  }

  const showBarangaySelect = barangays.length > 0 || loadingB

  return (
    <>
      {/* Province */}
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small" disabled={loadingP}>
          <InputLabel>{loadingP ? 'Loading provinces…' : 'Province'}</InputLabel>
          <Select
            label={loadingP ? 'Loading provinces…' : 'Province'}
            value={provinceCode}
            onChange={handleProvinceChange}
            endAdornment={loadingP
              ? <InputAdornment position="end" sx={{ mr: 1 }}><CircularProgress size={14} /></InputAdornment>
              : null}
          >
            {provinces.map(p => (
              <MenuItem key={p.code} value={p.code}>{p.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* City / Municipality */}
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small" disabled={!provinceCode || loadingC}>
          <InputLabel>{loadingC ? 'Loading cities…' : 'City / Municipality'}</InputLabel>
          <Select
            label={loadingC ? 'Loading cities…' : 'City / Municipality'}
            value={cityCode}
            onChange={handleCityChange}
            endAdornment={loadingC
              ? <InputAdornment position="end" sx={{ mr: 1 }}><CircularProgress size={14} /></InputAdornment>
              : null}
          >
            {cities.map(c => (
              <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Barangay — Select if API returned results, plain text fallback */}
      <Grid item xs={12} sm={4}>
        {showBarangaySelect ? (
          <FormControl fullWidth size="small" disabled={!cityCode || loadingB}>
            <InputLabel>{loadingB ? 'Loading barangays…' : 'Barangay'}</InputLabel>
            <Select
              label={loadingB ? 'Loading barangays…' : 'Barangay'}
              value={barangayCode}
              onChange={handleBarangaySelectChange}
              endAdornment={loadingB
                ? <InputAdornment position="end" sx={{ mr: 1 }}><CircularProgress size={14} /></InputAdornment>
                : null}
            >
              {barangays.map(b => (
                <MenuItem key={b.code} value={b.code}>{b.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <TextField
            label="Barangay"
            fullWidth
            size="small"
            value={barangayManual}
            onChange={handleBarangayTextChange}
            disabled={!cityCode}
            placeholder={cityCode ? 'Type barangay name' : ''}
          />
        )}
      </Grid>
    </>
  )
}
