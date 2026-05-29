import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public landing pages — eager (need fast first paint, also small)
import LandingPage from './pages/LandingPage'

// Auth pages — lightweight, eager-load for snappy login
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Portal shell — kept eager (small wrapper)
import PortalLayout from './components/portal/PortalLayout'

// ─── Heavy / authenticated routes — code-split ─────────────────────
const PublicPropertyMapsPage = lazy(() => import('./pages/PublicPropertyMapsPage'))
const PublicPropertyPage     = lazy(() => import('./pages/PublicPropertyPage'))

// Client portal
const ClientDashboard       = lazy(() => import('./pages/portal/ClientDashboard'))
const TransactionsPage      = lazy(() => import('./pages/portal/TransactionsPage'))
const NewTransactionPage    = lazy(() => import('./pages/portal/NewTransactionPage'))
const TransactionDetailPage = lazy(() => import('./pages/portal/TransactionDetailPage'))
const TitleVerificationPage = lazy(() => import('./pages/portal/TitleVerificationPage'))
const DocumentsPage         = lazy(() => import('./pages/portal/DocumentsPage'))
const NotificationsPage     = lazy(() => import('./pages/portal/NotificationsPage'))
const MessagesPage          = lazy(() => import('./pages/portal/MessagesPage'))
const SettingsPage          = lazy(() => import('./pages/portal/SettingsPage'))
const TestimonialPage       = lazy(() => import('./pages/portal/TestimonialPage'))

// Admin portal
const AdminDashboard         = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsersPage         = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminTransactionsPage  = lazy(() => import('./pages/admin/AdminTransactionsPage'))
const AdminAnnouncementsPage = lazy(() => import('./pages/admin/AdminAnnouncementsPage'))
const AdminTestimonialsPage  = lazy(() => import('./pages/admin/AdminTestimonialsPage'))
const AdminPropertyMapsPage  = lazy(() => import('./pages/admin/AdminPropertyMapsPage'))
const AdminInquiriesPage     = lazy(() => import('./pages/admin/AdminInquiriesPage'))

// Staff portal
const StaffDashboard        = lazy(() => import('./pages/staff/StaffDashboard'))
const StaffTransactionsPage = lazy(() => import('./pages/staff/StaffTransactionsPage'))

function RouteFallback() {
  return (
    <Box sx={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
    }}>
      <CircularProgress sx={{ color: 'secondary.main' }} />
    </Box>
  )
}

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles) {
    const userRole = user?.roles?.[0]?.name
    if (!roles.includes(userRole)) return <Navigate to="/" replace />
  }
  return children
}

function GuestRoute({ children }) {
  const { user } = useAuth()
  if (user) {
    const role = user?.roles?.[0]?.name
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (role === 'staff' || role === 'agent') return <Navigate to="/staff/dashboard" replace />
    return <Navigate to="/portal/dashboard" replace />
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/p/:code"  element={<PublicPropertyPage />} />

          {/* Property registry (any authenticated user) */}
          <Route path="/properties" element={<ProtectedRoute><PublicPropertyMapsPage /></ProtectedRoute>} />

          {/* Client Portal */}
          <Route path="/portal" element={<ProtectedRoute roles={['client']}><PortalLayout role="client" /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"           element={<ClientDashboard />} />
            <Route path="transactions"            element={<TransactionsPage />} />
            <Route path="transactions/new"        element={<NewTransactionPage />} />
            <Route path="transactions/:id"        element={<TransactionDetailPage />} />
            <Route path="title-verification"      element={<TitleVerificationPage />} />
            <Route path="documents"           element={<DocumentsPage />} />
            <Route path="notifications"       element={<NotificationsPage />} />
            <Route path="messages"            element={<MessagesPage />} />
            <Route path="review"              element={<TestimonialPage />} />
            <Route path="settings"            element={<SettingsPage />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><PortalLayout role="admin" /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"           element={<AdminDashboard />} />
            <Route path="users"               element={<AdminUsersPage />} />
            <Route path="transactions"        element={<AdminTransactionsPage />} />
            <Route path="transactions/:id"    element={<TransactionDetailPage />} />
            <Route path="staff"               element={<AdminUsersPage />} />
            <Route path="announcements"       element={<AdminAnnouncementsPage />} />
            <Route path="testimonials"        element={<AdminTestimonialsPage />} />
            <Route path="property-maps"       element={<AdminPropertyMapsPage />} />
            <Route path="inquiries"           element={<AdminInquiriesPage />} />
            <Route path="settings"            element={<SettingsPage />} />
          </Route>

          {/* Staff Portal */}
          <Route path="/staff" element={<ProtectedRoute roles={['staff', 'agent']}><PortalLayout role="staff" /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"              element={<StaffDashboard />} />
            <Route path="transactions"           element={<StaffTransactionsPage />} />
            <Route path="transactions/:id"       element={<TransactionDetailPage />} />
            <Route path="notifications"       element={<NotificationsPage />} />
            <Route path="messages"            element={<MessagesPage />} />
            <Route path="settings"            element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
