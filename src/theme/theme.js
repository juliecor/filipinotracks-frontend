import { createTheme, alpha } from '@mui/material/styles'

const NAVY = '#0A1628'
const NAVY_LIGHT = '#132040'
const NAVY_MID = '#1E3A5F'
const GOLD = '#C9A84C'
const GOLD_LIGHT = '#E8C96D'
const GOLD_DARK = '#A8882A'
const WHITE = '#FFFFFF'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: NAVY,
      light: NAVY_MID,
      dark: '#060E1A',
      contrastText: WHITE,
    },
    secondary: {
      main: GOLD,
      light: GOLD_LIGHT,
      dark: GOLD_DARK,
      contrastText: NAVY,
    },
    background: {
      default: '#F5F7FA',
      paper: WHITE,
    },
    text: {
      primary: '#0A1628',
      secondary: '#5A6A85',
    },
    success: { main: '#22C55E', light: '#DCFCE7', dark: '#166534' },
    warning: { main: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
    error: { main: '#EF4444', light: '#FEE2E2', dark: '#991B1B' },
    info: { main: '#3B82F6', light: '#DBEAFE', dark: '#1E40AF' },
    divider: '#E8EDF5',
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
    subtitle2: { fontWeight: 500, color: '#5A6A85' },
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
        body: { backgroundColor: '#F5F7FA' },
        '::-webkit-scrollbar': { width: 6 },
        '::-webkit-scrollbar-track': { background: '#F1F5F9' },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
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
          background: `linear-gradient(135deg, ${NAVY_MID} 0%, ${NAVY} 100%)`,
          '&:hover': { background: `linear-gradient(135deg, ${NAVY} 0%, #060E1A 100%)` },
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
          border: '1px solid #E8EDF5',
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
            backgroundColor: '#FAFBFD',
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
            backgroundColor: '#F0F4F8',
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
export { NAVY, NAVY_LIGHT, NAVY_MID, GOLD, GOLD_LIGHT, GOLD_DARK, WHITE }
