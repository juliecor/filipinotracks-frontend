import { createTheme, alpha } from '@mui/material/styles'

// ─── Brand ────────────────────────────────────────────────
const NAVY         = '#0A1628'   // canonical primary
const NAVY_SURFACE = '#13284A'   // sidebars, dark gradients (single source)
const NAVY_LINE    = '#1E3A5F'   // subtle borders on dark surfaces
const NAVY_DEEP    = '#060E1A'   // deepest navy (button :hover)

const GOLD       = '#C9A24A'     // slightly cleaner than C9A84C
const GOLD_LIGHT = '#E6C76A'
const GOLD_DARK  = '#9F7E2C'

const WHITE = '#FFFFFF'

// ─── Neutrals (single canonical scale) ─────────────────────
const SURFACE        = '#F6F8FB'  // page background
const SURFACE_SUBTLE = '#EEF2F7'  // alt sections, empty states
const BORDER         = '#E5EAF2'  // canonical border
const BORDER_STRONG  = '#D4DCE8'  // emphasized border
const TEXT_PRIMARY   = NAVY
const TEXT_BODY      = '#334155'  // body copy / table rows
const TEXT_MUTED     = '#64748B'  // labels, secondary
const TEXT_SUBTLE    = '#94A3B8'  // captions, helper

// ─── Status (5 semantic colors — deeper, more authoritative) ──
const INFO    = '#2563EB'
const SUCCESS = '#16A34A'
const WARNING = '#D97706'
const DANGER  = '#DC2626'

const theme = createTheme({
  palette: {
    mode: 'light',
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
    background: {
      default: SURFACE,
      paper: WHITE,
    },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_MUTED,
    },
    success: { main: SUCCESS, light: '#DCFCE7', dark: '#14532D' },
    warning: { main: WARNING, light: '#FEF3C7', dark: '#7C2D12' },
    error:   { main: DANGER,  light: '#FEE2E2', dark: '#7F1D1D' },
    info:    { main: INFO,    light: '#DBEAFE', dark: '#1E3A8A' },
    divider: BORDER,
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
    subtitle2: { fontWeight: 500, color: TEXT_MUTED },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6 },
    button: { fontWeight: 600, letterSpacing: '0.025em', textTransform: 'none' },
    overline: { fontWeight: 700, letterSpacing: '0.15em' },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px rgba(10,22,40,0.06), 0 1px 2px rgba(10,22,40,0.04)',
    '0 4px 6px rgba(10,22,40,0.05), 0 2px 4px rgba(10,22,40,0.04)',
    '0 10px 15px rgba(10,22,40,0.06), 0 4px 6px rgba(10,22,40,0.04)',
    '0 20px 25px rgba(10,22,40,0.08), 0 8px 10px rgba(10,22,40,0.04)',
    '0 25px 50px rgba(10,22,40,0.12)',
    ...Array(19).fill('none'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        html: { scrollBehavior: 'smooth' },
        body: { backgroundColor: SURFACE },
        '::-webkit-scrollbar': { width: 6 },
        '::-webkit-scrollbar-track': { background: SURFACE_SUBTLE },
        '::-webkit-scrollbar-thumb': { background: BORDER_STRONG, borderRadius: 3 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(10,22,40,0.15)' },
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
          boxShadow: '0 4px 24px rgba(10,22,40,0.06)',
          border: `1px solid ${BORDER}`,
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16 },
        elevation1: { boxShadow: '0 4px 24px rgba(10,22,40,0.06)' },
        elevation2: { boxShadow: '0 8px 32px rgba(10,22,40,0.08)' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#F8FAFC',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: GOLD },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: NAVY, borderWidth: 2 },
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
            backgroundColor: SURFACE_SUBTLE,
            fontWeight: 700,
            color: NAVY,
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
          '&:hover': { backgroundColor: alpha(NAVY, 0.02) },
          '&:last-child td': { border: 0 },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { border: 'none', boxShadow: '4px 0 24px rgba(10,22,40,0.08)' },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          padding: '10px 12px',
          '&.Mui-selected': {
            backgroundColor: alpha(GOLD, 0.12),
            color: GOLD_DARK,
            '& .MuiListItemIcon-root': { color: GOLD_DARK },
            '&:hover': { backgroundColor: alpha(GOLD, 0.18) },
          },
          '&:hover': { backgroundColor: alpha(NAVY, 0.04) },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 12px rgba(10,22,40,0.08)' },
      },
    },
  },
})

export default theme
export {
  NAVY, NAVY_SURFACE, NAVY_LINE, NAVY_DEEP,
  GOLD, GOLD_LIGHT, GOLD_DARK,
  WHITE,
  SURFACE, SURFACE_SUBTLE, BORDER, BORDER_STRONG,
  TEXT_PRIMARY, TEXT_BODY, TEXT_MUTED, TEXT_SUBTLE,
  INFO, SUCCESS, WARNING, DANGER,
}
// Legacy aliases (kept for backward compatibility — prefer the new names)
export { NAVY_LINE as NAVY_LIGHT, NAVY_LINE as NAVY_MID }
