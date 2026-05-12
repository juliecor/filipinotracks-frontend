import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  AppBar, Box, CssBaseline, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography,
  Avatar, Menu, MenuItem, Divider, Chip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VerifiedIcon from '@mui/icons-material/Verified'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import ArticleIcon from '@mui/icons-material/Article'
import HomeWorkIcon from '@mui/icons-material/HomeWork'
import PeopleIcon from '@mui/icons-material/People'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../context/AuthContext'

const DRAWER_WIDTH = 250

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { label: 'Title Verification', path: '/title-verifications', icon: <VerifiedIcon /> },
  { label: 'Title Transfer', path: '/title-transfers', icon: <SwapHorizIcon /> },
  { label: 'Lot Verification', path: '/lot-verifications', icon: <LocationOnIcon /> },
  { label: 'Tax Clearance', path: '/tax-clearances', icon: <ReceiptLongIcon /> },
  { label: 'Tax Declaration', path: '/tax-declarations', icon: <ArticleIcon /> },
  { label: 'Mortgage', path: '/mortgages', icon: <HomeWorkIcon /> },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, logout, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const items = hasRole('admin')
    ? [...navItems, { label: 'Users', path: '/users', icon: <PeopleIcon /> }]
    : navItems

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'primary.main' }}>
        <Typography variant="h6" color="white" fontWeight={700} noWrap>
          FilipinoTracks
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {items.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={() => setMobileOpen(false)}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            FilipinoTracks
          </Typography>
          <Chip label={user?.roles?.[0]?.name?.toUpperCase()} size="small" color="secondary" sx={{ mr: 2 }} />
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled><Typography variant="body2">{user?.name}</Typography></MenuItem>
            <MenuItem disabled><Typography variant="caption">{user?.email}</Typography></MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}><LogoutIcon fontSize="small" sx={{ mr: 1 }} />Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
          open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  )
}
