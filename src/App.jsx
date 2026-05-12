import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import PortalLayout from './components/portal/PortalLayout'

// Client portal pages
import ClientDashboard from './pages/portal/ClientDashboard'
import TransactionsPage from './pages/portal/TransactionsPage'
import NewTransactionPage from './pages/portal/NewTransactionPage'
import TransactionDetailPage from './pages/portal/TransactionDetailPage'
import DocumentsPage from './pages/portal/DocumentsPage'
import NotificationsPage from './pages/portal/NotificationsPage'
import MessagesPage from './pages/portal/MessagesPage'
import SettingsPage from './pages/portal/SettingsPage'

// Admin portal pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage'
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage'

// Staff portal pages
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffTransactionsPage from './pages/staff/StaffTransactionsPage'

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
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Client Portal */}
        <Route path="/portal" element={<ProtectedRoute roles={['client']}><PortalLayout role="client" /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"           element={<ClientDashboard />} />
          <Route path="transactions"        element={<TransactionsPage />} />
          <Route path="transactions/new"    element={<NewTransactionPage />} />
          <Route path="transactions/:id"    element={<TransactionDetailPage />} />
          <Route path="documents"           element={<DocumentsPage />} />
          <Route path="notifications"       element={<NotificationsPage />} />
          <Route path="messages"            element={<MessagesPage />} />
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
          <Route path="analytics"           element={<AdminDashboard />} />
          <Route path="announcements"       element={<AdminAnnouncementsPage />} />
          <Route path="settings"            element={<SettingsPage />} />
        </Route>

        {/* Staff Portal */}
        <Route path="/staff" element={<ProtectedRoute roles={['staff', 'agent']}><PortalLayout role="staff" /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"           element={<StaffDashboard />} />
          <Route path="transactions"        element={<StaffTransactionsPage />} />
          <Route path="transactions/:id"    element={<TransactionDetailPage />} />
          <Route path="notifications"       element={<NotificationsPage />} />
          <Route path="messages"            element={<MessagesPage />} />
          <Route path="settings"            element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
