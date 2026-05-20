import { createTheme, alpha } from '@mui/material/styles'

// ─── Brand ────────────────────────────────────────────────
const NAVY         = '#0A1628'
const NAVY_SURFACE = '#13284A'
const NAVY_LINE    = '#1E3A5F'
const NAVY_DEEP    = '#060E1A'

const GOLD       = '#C9A24A'
const GOLD_LIGHT = '#E6C76A'
const GOLD_DARK  = '#9F7E2C'

const WHITE = '#FFFFFF'

// ─── Light neutrals ───────────────────────────────────────
const SURFACE        = '#F6F8FB'
const SURFACE_SUBTLE = '#EEF2F7'
const BORDER         = '#E5EAF2'
const BORDER_STRONG  = '#D4DCE8'
const TEXT_PRIMARY   = NAVY
const TEXT_BODY      = '#334155'
const TEXT_MUTED     = '#64748B'
const TEXT_SUBTLE    = '#94A3B8'

// ─── Dark neutrals ────────────────────────────────────────
const DARK_BG        = '#0B1424'   // page background
const DARK_PAPER     = '#13284A'   // cards / sidebars
const DARK_SUBTLE    = '#1A3258'   // alt surfaces
const DARK_BORDER    = 'rgba(255,255,255,0.10)'
const DARK_BORDER_STRONG = 'rgba(255,255,255,0.18)'
const DARK_TEXT      = '#F1F5F9'
const DARK_TEXT_BODY = '#CBD5E1'
const DARK_TEXT_MUTED = '#94A3B8'
const DARK_TEXT_SUBTLE = '#64748B'

// ─── Status ────────────────────────────────────────────────
const INFO    = '#2563EB'
const SUCCESS = '#16A34A'
const WARNING = '#D97706'
const DANGER  = '#DC2626'

export function buildTheme(mode = 'light') {
  const isDark = mode === 'dark'

  return createTheme({
    palette: {
      mode,
      primary: {
        main: NAVY,
        light: NAVY_LINE,
        dark: NAVY_DEEP,
        contrastText: WHITE,
      },
      secondary: {
        main: GOLD,
        light: GOLD_LIGHT,
        dark: GOLD_DARK,
        contrastText: NAVY,
      },
      background: isDark
        ? { default: DARK_BG, paper: DARK_PAPER }
        : { default: SURFACE, paper: WHITE },
      text: isDark
        ? { primary: DARK_TEXT, secondary: DARK_TEXT_MUTED }
        : { primary: TEXT_PRIMARY, secondary: TEXT_MUTED },
      success: { main: SUCCESS, light: isDark ? '#14532D' : '#DCFCE7', dark: '#14532D' },
      warning: { main: WARNING, light: isDark ? '#7C2D12' : '#FEF3C7', dark: '#7C2D12' },
      error:   { main: DANGER,  light: isDark ? '#7F1D1D' : '#FEE2E2', dark: '#7F1D1D' },
      info:    { main: INFO,    light: isDark ? '#1E3A8A' : '#DBEAFE', dark: '#1E3A8A' },
      divider: isDark ? DARK_BORDER : BORDER,
    },
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      h1: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 },
      h2: { fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
      h3: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500, lineHeight: 1.6 },
      subtitle2: { fontWeight: 500, color: isDark ? DARK_TEXT_MUTED : TEXT_MUTED },
      body1: { lineHeight: 1.7 },
      body2: { lineHeight: 1.6 },
      button: { fontWeight: 600, letterSpacing: '0.025em', textTransform: 'none' },
      overline: { fontWeight: 700, letterSpacing: '0.15em' },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      isDark
        ? '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.25)'
        : '0 1px 3px rgba(10,22,40,0.06), 0 1px 2px rgba(10,22,40,0.04)',
      isDark
        ? '0 4px 6px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)'
        : '0 4px 6px rgba(10,22,40,0.05), 0 2px 4px rgba(10,22,40,0.04)',
      isDark
        ? '0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.3)'
        : '0 10px 15px rgba(10,22,40,0.06), 0 4px 6px rgba(10,22,40,0.04)',
      isDark
        ? '0 20px 25px rgba(0,0,0,0.45), 0 8px 10px rgba(0,0,0,0.3)'
        : '0 20px 25px rgba(10,22,40,0.08), 0 8px 10px rgba(10,22,40,0.04)',
      isDark
        ? '0 25px 50px rgba(0,0,0,0.5)'
        : '0 25px 50px rgba(10,22,40,0.12)',
      ...Array(19).fill('none'),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': { boxSizing: 'border-box' },
          html: { scrollBehavior: 'smooth' },
          body: { backgroundColor: isDark ? DARK_BG : SURFACE, transition: 'background-color 0.3s ease' },
          '::-webkit-scrollbar': { width: 6 },
          '::-webkit-scrollbar-track': { background: isDark ? DARK_SUBTLE : SURFACE_SUBTLE },
          '::-webkit-scrollbar-thumb': { background: isDark ? DARK_BORDER_STRONG : BORDER_STRONG, borderRadius: 3 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: '0.9rem',
            boxShadow: 'none',
            '&:hover': { boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(10,22,40,0.15)' },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${NAVY_LINE} 0%, ${NAVY} 100%)`,
            '&:hover': { background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)` },
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
            color: NAVY,
            '&:hover': { background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)` },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': { borderWidth: '1.5px' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDark
              ? '0 4px 24px rgba(0,0,0,0.4)'
              : '0 4px 24px rgba(10,22,40,0.06)',
            border: `1px solid ${isDark ? DARK_BORDER : BORDER}`,
            backgroundImage: 'none',
            overflow: 'hidden',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 16, backgroundImage: 'none' },
          elevation1: { boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(10,22,40,0.06)' },
          elevation2: { boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(10,22,40,0.08)' },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: GOLD },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: GOLD, borderWidth: 2 },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600, borderRadius: 8 },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? DARK_SUBTLE : SURFACE_SUBTLE,
              fontWeight: 700,
              color: isDark ? DARK_TEXT : NAVY,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': { backgroundColor: isDark ? alpha('#FFFFFF', 0.04) : alpha(NAVY, 0.02) },
            '&:last-child td': { border: 0 },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { border: 'none', boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.5)' : '4px 0 24px rgba(10,22,40,0.08)' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            padding: '10px 12px',
            '&.Mui-selected': {
              backgroundColor: alpha(GOLD, 0.16),
              color: isDark ? GOLD_LIGHT : GOLD_DARK,
              '& .MuiListItemIcon-root': { color: isDark ? GOLD_LIGHT : GOLD_DARK },
              '&:hover': { backgroundColor: alpha(GOLD, 0.22) },
            },
            '&:hover': { backgroundColor: isDark ? alpha('#FFFFFF', 0.05) : alpha(NAVY, 0.04) },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { boxShadow: isDark ? '0 1px 12px rgba(0,0,0,0.5)' : '0 1px 12px rgba(10,22,40,0.08)' },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: isDark ? DARK_BORDER : BORDER },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: { backgroundImage: 'none' },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: '0.72rem', fontWeight: 600 },
        },
      },
    },
  })
}

// Default export: light theme (for any module that imports `theme` directly)
const theme = buildTheme('light')
export default theme

// Token exports — UNCHANGED. Apps importing constants don't need to know about modes.
export {
  NAVY, NAVY_SURFACE, NAVY_LINE, NAVY_DEEP,
  GOLD, GOLD_LIGHT, GOLD_DARK,
  WHITE,
  SURFACE, SURFACE_SUBTLE, BORDER, BORDER_STRONG,
  TEXT_PRIMARY, TEXT_BODY, TEXT_MUTED, TEXT_SUBTLE,
  INFO, SUCCESS, WARNING, DANGER,
}
export { NAVY_LINE as NAVY_LIGHT, NAVY_LINE as NAVY_MID }
