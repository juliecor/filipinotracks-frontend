import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar, Menu, MenuItem,
  Divider, Chip, Badge, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Tooltip, useTheme, useMediaQuery,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import PeopleIcon from '@mui/icons-material/People'
import BarChartIcon from '@mui/icons-material/BarChart'
import CampaignIcon from '@mui/icons-material/Campaign'
import AssignmentIcon from '@mui/icons-material/Assignment'
import HomeIcon from '@mui/icons-material/Home'
import StarIcon from '@mui/icons-material/Star'
import { useAuth } from '../../context/AuthContext'
import { NAVY, GOLD } from '../../theme/theme'
import api from '../../api/axios'
import ChatWidget from '../chat/ChatWidget'

const DRAWER_WIDTH = 255
const COLLAPSED_WIDTH = 68

const clientNav = [
  { label: 'Dashboard',       path: '/portal/dashboard',      icon: <DashboardIcon /> },
  { label: 'Transactions',    path: '/portal/transactions',   icon: <ReceiptLongIcon /> },
  { label: 'Upload Documents',path: '/portal/documents',      icon: <CloudUploadIcon /> },
  { label: 'Notifications',   path: '/portal/notifications',  icon: <NotificationsIcon />, notif: true },
  { label: 'My Review',       path: '/portal/review',         icon: <StarIcon /> },
  { label: 'Settings',        path: '/portal/settings',       icon: <SettingsIcon /> },
]

const adminNav = [
  { label: 'Dashboard',    path: '/admin/dashboard',    icon: <DashboardIcon /> },
  { label: 'Users',        path: '/admin/users',        icon: <PeopleIcon /> },
  { label: 'Transactions', path: '/admin/transactions', icon: <ReceiptLongIcon /> },
  { label: 'Analytics',    path: '/admin/analytics',    icon: <BarChartIcon /> },
  { label: 'Announcements',path: '/admin/announcements',icon: <CampaignIcon /> },
  { label: 'Testimonials', path: '/admin/testimonials', icon: <StarIcon /> },
  { label: 'Settings',     path: '/admin/settings',     icon: <SettingsIcon /> },
]

const staffNav = [
  { label: 'Dashboard',       path: '/staff/dashboard',       icon: <DashboardIcon /> },
  { label: 'Assigned Tasks',  path: '/staff/transactions',    icon: <AssignmentIcon /> },
  { label: 'Notifications',   path: '/staff/notifications',   icon: <NotificationsIcon />, notif: true },
  { label: 'Settings',        path: '/staff/settings',        icon: <SettingsIcon /> },
]

export default function PortalLayout({ role = 'client' }) {
  const [collapsed, setCollapsed]     = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [anchorEl, setAnchorEl]       = useState(null)
  const [unreadCount, setUnreadCount]   = useState(0)
  const [unreadMsgs, setUnreadMsgs]     = useState(0)
  const { user, logout } = useAuth()

  useEffect(() => {
    const fetchCounts = () => {
      api.get('/notifications/unread-count')
        .then(({ data }) => setUnreadCount(data.count || 0))
        .catch(() => {})
      api.get('/messages/unread-count')
        .then(({ data }) => setUnreadMsgs(data.count || 0))
        .catch(() => {})
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 10000)
    return () => clearInterval(interval)
  }, [])

  const navigate  = useNavigate()
  const location  = useLocation()
  const theme     = useTheme()
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'))

  const navItems   = role === 'admin' ? adminNav : role === 'staff' ? staffNav : clientNav
  const drawerWidth = collapsed && !isMobile ? COLLAPSED_WIDTH : DRAWER_WIDTH

  const handleLogout = async () => { await logout(); navigate('/') }
  const isActive = (path) => location.pathname.startsWith(path)

  const settingsPath = role === 'admin' ? '/admin/settings' : '/portal/settings'

  /* ─── Sidebar ─── */
  const SidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0F2444', overflow: 'hidden' }}>

      {/* Logo */}
      <Box sx={{
        px: collapsed ? 1.5 : 2.5, py: 2,
        display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: '9px', flexShrink: 0,
          background: `linear-gradient(135deg, ${GOLD} 0%, #A8882A 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ color: NAVY, fontWeight: 900, fontSize: '0.85rem' }}>FT</Typography>
        </Box>
        {!collapsed && (
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.1, fontSize: '0.95rem' }}>
              FilipinoTracks
            </Typography>
            <Typography variant="caption" sx={{ color: GOLD, fontSize: '0.55rem', letterSpacing: '0.12em', fontWeight: 700 }}>
              {role === 'admin' ? 'ADMIN PORTAL' : role === 'staff' ? 'STAFF PORTAL' : 'CLIENT PORTAL'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Nav items */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, '&::-webkit-scrollbar': { width: 0 } }}>
        <List dense disablePadding>
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1, mb: 0.3 }}>
                <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    onClick={() => isMobile && setMobileOpen(false)}
                    sx={{
                      borderRadius: '10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      px: collapsed ? 1 : 1.5, py: 1.1,
                      bgcolor: active ? 'rgba(201,168,76,0.16)' : 'transparent',
                      border: active ? '1px solid rgba(201,168,76,0.28)' : '1px solid transparent',
                      '&:hover': { bgcolor: active ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)' },
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ListItemIcon sx={{
                      color: active ? GOLD : 'rgba(255,255,255,0.78)',
                      minWidth: collapsed ? 0 : 38,
                      '& svg': { fontSize: 21 },
                    }}>
                      {item.notif
                        ? <Badge badgeContent={(unreadCount || 0) + (unreadMsgs || 0)} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>{item.icon}</Badge>
                        : item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontSize: '0.875rem',
                            fontWeight: active ? 700 : 500,
                            color: active ? GOLD : 'rgba(255,255,255,0.92)',
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            )
          })}
        </List>
      </Box>

      {/* Back to Home */}
      <Box sx={{ px: 1, pb: 1 }}>
        <Tooltip title={collapsed ? 'Back to Home' : ''} placement="right" arrow>
          <ListItemButton
            component={Link}
            to="/"
            sx={{
              borderRadius: '10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 1.5, py: 1.1,
              bgcolor: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.25)' },
              transition: 'all 0.15s ease',
            }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.6)', minWidth: collapsed ? 0 : 38, '& svg': { fontSize: 21 } }}>
              <HomeIcon />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Back to Home"
                sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)' } }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>

      {/* User footer */}
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Tooltip title={collapsed ? `${user?.name} — Logout` : ''} placement="right">
          <Box
            onClick={handleLogout}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2,
              borderRadius: '10px', cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.12)' },
              transition: 'all 0.15s',
            }}
          >
            <Avatar
              src={user?.profile_picture_url || undefined}
              sx={{ width: 34, height: 34, bgcolor: GOLD, color: NAVY, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}
            >
              {!user?.profile_picture_url && user?.name?.charAt(0)}
            </Avatar>
            {!collapsed && (
              <Box sx={{ overflow: 'hidden', flex: 1 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem' }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', textTransform: 'capitalize' }}>
                  {user?.roles?.[0]?.name}
                </Typography>
              </Box>
            )}
            {!collapsed && <LogoutIcon sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 18, flexShrink: 0 }} />}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Desktop sidebar */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        width: drawerWidth, flexShrink: 0,
        transition: 'width 0.2s ease',
        flexDirection: 'column',
      }}>
        <SidebarContent />
      </Box>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#0F2444', border: 'none' } }}
      >
        <SidebarContent />
      </Drawer>

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'hidden' }}>

        {/* Topbar */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #E8EDF5', color: NAVY, flexShrink: 0 }}>
          <Toolbar sx={{ px: { xs: 2, md: 2.5 }, minHeight: '56px !important' }}>
            <IconButton
              onClick={() => isMobile ? setMobileOpen(true) : setCollapsed(c => !c)}
              sx={{ mr: 2, color: '#64748B', bgcolor: '#F8FAFC', borderRadius: 2, width: 36, height: 36 }}
            >
              {!collapsed || isMobile
                ? <ChevronLeftIcon sx={{ fontSize: 20, transform: collapsed ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                : <MenuIcon sx={{ fontSize: 20 }} />}
            </IconButton>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: NAVY }}>
              {navItems.find(n => isActive(n.path))?.label || 'Portal'}
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={user?.roles?.[0]?.name?.toUpperCase()}
                size="small"
                sx={{ bgcolor: `${GOLD}18`, color: '#A8882A', fontWeight: 700, fontSize: '0.68rem', display: { xs: 'none', sm: 'flex' } }}
              />
              <IconButton
                component={Link}
                to={role === 'admin' ? '/admin/announcements' : '/portal/notifications'}
                sx={{ color: '#64748B', width: 36, height: 36 }}
              >
                <Badge badgeContent={(unreadCount || 0) + (unreadMsgs || 0)} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                  <NotificationsIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
                <Avatar
                  src={user?.profile_picture_url || undefined}
                  sx={{ width: 34, height: 34, bgcolor: NAVY, color: GOLD, fontWeight: 800, fontSize: '0.82rem' }}
                >
                  {!user?.profile_picture_url && user?.name?.charAt(0)}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        {/* User menu */}
        <Menu
          anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 2, boxShadow: '0 8px 32px rgba(10,22,40,0.12)', border: '1px solid #E8EDF5' } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: NAVY }}>{user?.name}</Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>{user?.email}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/') }}>
            <HomeIcon fontSize="small" sx={{ mr: 1.5, color: '#64748B' }} /> Back to Home
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); navigate(settingsPath) }}>
            <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: '#64748B' }} /> Settings
          </MenuItem>
          <MenuItem onClick={() => { setAnchorEl(null); handleLogout() }} sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} /> Logout
          </MenuItem>
        </Menu>

        {/* Page content */}
        <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#F5F7FA' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Global chat widget */}
      <ChatWidget />
    </Box>
  )
}
