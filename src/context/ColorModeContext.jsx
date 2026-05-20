import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { buildTheme } from '../theme/theme'

const STORAGE_KEY = 'filipinotracks:colorMode'

const ColorModeContext = createContext({
  mode: 'light',
  toggleMode: () => {},
  setMode:    () => {},
})

export function useColorMode() {
  return useContext(ColorModeContext)
}

function getInitialMode() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  // Respect OS preference on first visit
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function ColorModeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* ignore */ }
    // Keep meta theme-color in sync (mobile browser chrome)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', mode === 'dark' ? '#0B1424' : '#FFFFFF')
  }, [mode])

  const toggleMode = useCallback(
    () => setMode(prev => (prev === 'dark' ? 'light' : 'dark')),
    []
  )

  const theme = useMemo(() => buildTheme(mode), [mode])
  const value = useMemo(() => ({ mode, toggleMode, setMode }), [mode, toggleMode])

  return (
    <ColorModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}
