import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout
import Layout from './components/Layout'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import QueryPage from './pages/QueryPage'
import ExperiencesPage from './pages/ExperiencesPage'
import ExperienceDetailPage from './pages/ExperienceDetailPage'
import SubmitExperiencePage from './pages/SubmitExperiencePage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProfilePage from './pages/ProfilePage'

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected Routes */}
      <Route element={<Layout />}>
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ask" 
          element={
            <ProtectedRoute>
              <QueryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/experiences" 
          element={
            <ProtectedRoute>
              <ExperiencesPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/experiences/:id" 
          element={
            <ProtectedRoute>
              <ExperienceDetailPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/submit" 
          element={
            <ProtectedRoute requiredRole="senior">
              <SubmitExperiencePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
      </Route>
      
      {/* Auth Callback for OAuth */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// OAuth callback handler
function AuthCallback() {
  const { setToken } = useAuthStore()
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  
  if (token) {
    setToken(token)
    return <Navigate to="/dashboard" replace />
  }
  
  return <Navigate to="/login" replace />
}

export default App
